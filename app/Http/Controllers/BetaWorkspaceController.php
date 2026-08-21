<?php

namespace App\Http\Controllers;

use App\Models\BetaWorkspace;
use App\Models\Goal;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BetaWorkspaceController extends Controller
{
    public function show(Request $request, CommunityController $community): Response
    {
        $workspace = $request->user()->betaWorkspace()->firstOrCreate();

        return Inertia::render('demo/home', [
            ...$community->feedData($request),
            'betaMode' => true,
            'betaState' => $this->state($workspace, $request->user()),
            'betaGoalIds' => $this->goalIds($request->user()),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        abort_if(strlen($request->getContent()) > 5_000_000, 413);

        $state = $request->validate([
            'goals' => ['present', 'array', 'max:200'],
            'plans' => ['present', 'array', 'max:1000'],
            'notes' => ['present', 'array', 'max:1000'],
            'books' => ['present', 'array', 'max:500'],
            'profile' => ['present', 'array'],
            'settings' => ['present', 'array'],
        ]);

        $goalIds = DB::transaction(function () use ($request, $state): array {
            $request->user()->betaWorkspace()->updateOrCreate([], $state);
            $profile = $state['profile'];
            $request->user()->fill([
                'name' => filled($profile['name'] ?? null) ? mb_substr(trim((string) $profile['name']), 0, 255) : $request->user()->name,
                'phone' => mb_substr(trim((string) ($profile['phone'] ?? '')), 0, 30) ?: null,
                'profession' => mb_substr(trim((string) ($profile['profession'] ?? '')), 0, 120) ?: null,
                'country' => mb_substr(trim((string) ($profile['country'] ?? '')), 0, 100) ?: null,
                'show_fu_publicly' => (bool) ($state['settings']['showFuPublicly'] ?? true),
            ])->save();
            $this->syncGoals($request->user(), $state['goals']);

            return $this->goalIds($request->user());
        });

        return response()->json(['saved' => true, 'goalIds' => $goalIds]);
    }

    /** @return array<string, mixed> */
    private function state(BetaWorkspace $workspace, User $user): array
    {
        return [
            'goals' => $workspace->goals ?? [],
            'plans' => $workspace->plans ?? [],
            'notes' => $workspace->notes ?? [],
            'books' => $workspace->books ?? [],
            'profile' => $workspace->profile ?? [
                'name' => $user->name,
                'username' => '',
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'birthDate' => '',
                'country' => $user->country ?? '',
                'profession' => $user->profession ?? '',
                'about' => '',
                'educations' => [],
                'avatar' => '',
            ],
            'settings' => $workspace->settings ?? [],
        ];
    }

    /** @param array<int, mixed> $goals */
    private function syncGoals(User $user, array $goals): void
    {
        $keptKeys = [];

        foreach ($goals as $goalData) {
            if (! is_array($goalData) || blank($goalData['id'] ?? null) || blank($goalData['title'] ?? null)) {
                continue;
            }

            $key = (string) $goalData['id'];
            $keptKeys[] = $key;
            $startDate = CarbonImmutable::createFromTimestampMs((int) ($goalData['createdAt'] ?? now()->getTimestampMs()))->toDateString();
            $targetDate = $this->date($goalData['deadline'] ?? null, $startDate);
            $blocks = is_array($goalData['buildingBlocks'] ?? null) ? $goalData['buildingBlocks'] : [];
            $completed = $blocks !== [] && collect($blocks)->every(fn ($block) => (bool) Arr::get($block, 'completed'));
            $progress = $blocks === [] ? 0 : (int) round(collect($blocks)->filter(fn ($block) => (bool) Arr::get($block, 'completed'))->count() / count($blocks) * 100);
            $completedAt = $completed && is_numeric($goalData['fuAwardedAt'] ?? null)
                ? CarbonImmutable::createFromTimestampMs((int) $goalData['fuAwardedAt'])
                : ($completed ? now() : null);

            $goal = $user->goals()->updateOrCreate(
                ['beta_key' => $key],
                [
                    'title' => mb_substr(trim((string) $goalData['title']), 0, 255),
                    'description' => filled($goalData['category'] ?? null) ? 'Beta kategori: '.$goalData['category'] : null,
                    'start_date' => $startDate,
                    'target_date' => $targetDate,
                    'status' => $completed ? 'completed' : 'active',
                    'priority' => $this->priority($goalData['priority'] ?? null),
                    'motivation' => filled($goalData['gain'] ?? null) ? (string) $goalData['gain'] : null,
                    'progress' => $progress,
                    'completed_at' => $completedAt,
                ],
            );

            $keptBlockKeys = [];
            foreach ($blocks as $position => $block) {
                if (! is_array($block) || blank($block['id'] ?? null) || blank($block['title'] ?? null)) {
                    continue;
                }

                $blockKey = (string) $block['id'];
                $keptBlockKeys[] = $blockKey;
                $isCompleted = (bool) ($block['completed'] ?? false);
                $goal->milestones()->updateOrCreate(
                    ['beta_key' => $blockKey],
                    [
                        'title' => mb_substr(trim((string) $block['title']), 0, 255),
                        'target_date' => $targetDate,
                        'position' => $position,
                        'status' => $isCompleted ? 'completed' : 'pending',
                        'progress' => $isCompleted ? 100 : 0,
                        'completed_at' => $isCompleted ? now() : null,
                    ],
                );
            }

            $goal->milestones()->whereNotNull('beta_key')->when(
                $keptBlockKeys !== [],
                fn ($query) => $query->whereNotIn('beta_key', $keptBlockKeys),
            )->delete();
        }

        $user->goals()->whereNotNull('beta_key')->when(
            $keptKeys !== [],
            fn ($query) => $query->whereNotIn('beta_key', $keptKeys),
        )->delete();
    }

    /** @return array<string, int> */
    private function goalIds(User $user): array
    {
        return $user->goals()->whereNotNull('beta_key')->pluck('id', 'beta_key')->all();
    }

    private function date(mixed $value, string $fallback): string
    {
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return $value;
        }

        return $fallback;
    }

    private function priority(mixed $priority): string
    {
        return match ($priority) {
            'urgent', 'very-important' => 'high',
            'has-time' => 'low',
            default => 'medium',
        };
    }
}
