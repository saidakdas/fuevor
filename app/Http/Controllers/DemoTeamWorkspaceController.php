<?php

namespace App\Http\Controllers;

use App\Models\DemoTeamNotification;
use App\Models\DemoTeamWorkspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DemoTeamWorkspaceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $username = $this->validatedUsername($request);

        $teams = DemoTeamWorkspace::query()
            ->latest('updated_at')
            ->get()
            ->map(fn (DemoTeamWorkspace $workspace) => $workspace->payload)
            ->filter(fn (array $team) => collect($team['members'] ?? [])->contains(
                fn ($member) => is_array($member) && ($member['username'] ?? null) === $username,
            ))
            ->values();

        return response()->json(['teams' => $teams]);
    }

    public function store(Request $request): JsonResponse
    {
        $username = $this->validatedUsername($request);
        $team = $this->validatedTeam($request);
        $workspaceKey = (string) $team['id'];
        $workspace = DemoTeamWorkspace::query()->where('workspace_key', $workspaceKey)->first();

        if ($workspace) {
            $member = collect($workspace->payload['members'] ?? [])->firstWhere('username', $username);
            abort_unless(is_array($member), 403);
            abort_unless(($workspace->payload['creatorUsername'] ?? null) === ($team['creatorUsername'] ?? null), 403);
            $this->assertMembershipUnchanged($workspace->payload, $team);
            $this->assertCompletionChangesBelongTo($username, $workspace->payload, $team);
        } else {
            abort_unless(($team['creatorUsername'] ?? null) === $username, 403);
        }

        $workspace = DemoTeamWorkspace::query()->updateOrCreate(
            ['workspace_key' => $workspaceKey],
            [
                'invite_code' => strtoupper((string) $team['inviteCode']),
                'creator_username' => (string) $team['creatorUsername'],
                'payload' => $team,
            ],
        );

        return response()->json(['team' => $workspace->payload]);
    }

    public function invite(Request $request, string $workspaceKey): JsonResponse
    {
        $username = $this->validatedUsername($request);
        $validated = $request->validate([
            'invitedUsername' => ['required', 'string', 'max:30', 'different:username'],
            'invitedName' => ['nullable', 'string', 'max:80'],
            'invitedAvatar' => ['nullable', 'string', 'max:4194304'],
        ]);
        $workspace = DemoTeamWorkspace::query()->where('workspace_key', $workspaceKey)->firstOrFail();
        $team = $workspace->payload;
        $members = collect($team['members'] ?? []);
        $actor = $members->firstWhere('username', $username);
        abort_unless(is_array($actor) && in_array($actor['role'] ?? null, ['manager', 'assistant'], true), 403);
        abort_if($members->contains(fn ($member) => is_array($member) && ($member['username'] ?? null) === $validated['invitedUsername']), 422);

        $message = sprintf(
            '%s, %s kullanıcısını %s ekibine eklemek için davetiye gönderdi.',
            $username,
            $validated['invitedUsername'],
            $team['name'],
        );
        $data = [
            'workspaceKey' => $workspaceKey,
            'teamName' => $team['name'],
            'inviteCode' => $team['inviteCode'],
            'member' => [
                'id' => now()->getTimestampMs(),
                'username' => $validated['invitedUsername'],
                'name' => $validated['invitedName'] ?: '@'.$validated['invitedUsername'],
                'avatar' => $validated['invitedAvatar'] ?? '',
                'role' => 'member',
                'joinedAt' => now()->getTimestampMs(),
            ],
        ];

        $invitation = DemoTeamNotification::query()
            ->where('recipient_username', $validated['invitedUsername'])
            ->where('type', 'team_invite')
            ->whereNull('acted_at')
            ->get()
            ->first(fn (DemoTeamNotification $notification) => ($notification->data['workspaceKey'] ?? null) === $workspaceKey);
        $invitationData = [
            'actor_username' => $username,
            'message' => $message,
            'data' => $data,
            'read_at' => null,
        ];
        if ($invitation) {
            $invitation->update($invitationData);
        } else {
            $invitation = DemoTeamNotification::query()->create([
                'recipient_username' => $validated['invitedUsername'],
                'type' => 'team_invite',
                'actor_username' => $username,
                'message' => $message,
                'data' => $data,
                'read_at' => null,
            ]);
        }

        if (($actor['role'] ?? null) === 'assistant') {
            $this->notifyManager($team, $username, 'team_member_invited', $message, $data);
        }

        return response()->json(['invitationId' => $invitation->id, 'message' => $message], 201);
    }

    public function removeMember(Request $request, string $workspaceKey, string $memberUsername): JsonResponse
    {
        $username = $this->validatedUsername($request);
        $workspace = DemoTeamWorkspace::query()->where('workspace_key', $workspaceKey)->firstOrFail();
        $team = $workspace->payload;
        $members = collect($team['members'] ?? []);
        $actor = $members->firstWhere('username', $username);
        $removedMember = $members->firstWhere('username', $memberUsername);
        abort_unless(is_array($actor) && in_array($actor['role'] ?? null, ['manager', 'assistant'], true), 403);
        abort_unless(is_array($removedMember), 404);
        abort_if(($removedMember['username'] ?? null) === ($team['creatorUsername'] ?? null), 403);
        abort_if(($actor['role'] ?? null) === 'assistant' && ($removedMember['role'] ?? null) !== 'member', 403);

        $removedMemberId = $removedMember['id'] ?? null;
        $team['members'] = $members->reject(fn ($member) => is_array($member) && ($member['username'] ?? null) === $memberUsername)->values()->all();
        $team['goals'] = collect($team['goals'] ?? [])->map(function ($goal) use ($removedMemberId) {
            if (! is_array($goal)) {
                return $goal;
            }
            $goal['buildingBlocks'] = collect($goal['buildingBlocks'] ?? [])->map(function ($block) use ($removedMemberId) {
                if (! is_array($block) || ($block['assigneeId'] ?? null) !== $removedMemberId) {
                    return $block;
                }

                return [...$block, 'assigneeId' => null];
            })->all();

            return $goal;
        })->all();
        $workspace->update(['payload' => $team]);

        if (($actor['role'] ?? null) === 'assistant') {
            $message = sprintf('%s, %s kullanıcısını %s ekibinden çıkardı.', $username, $memberUsername, $team['name']);
            $this->notifyManager($team, $username, 'team_member_removed', $message, [
                'workspaceKey' => $workspaceKey,
                'teamName' => $team['name'],
                'memberUsername' => $memberUsername,
            ]);
        }

        return response()->json(['team' => $team]);
    }

    public function destroy(Request $request, string $workspaceKey): JsonResponse
    {
        $username = $this->validatedUsername($request);
        $workspace = DemoTeamWorkspace::query()->where('workspace_key', $workspaceKey)->firstOrFail();
        abort_unless($workspace->creator_username === $username, 403);
        $workspace->delete();

        return response()->json(status: 204);
    }

    private function validatedUsername(Request $request): string
    {
        return $request->validate(['username' => ['required', 'string', 'max:30']])['username'];
    }

    /**
     * @param  array<string, mixed>  $team
     * @param  array<string, mixed>  $data
     */
    private function notifyManager(array $team, string $actorUsername, string $type, string $message, array $data): void
    {
        $manager = collect($team['members'] ?? [])->first(
            fn ($member) => is_array($member) && ($member['role'] ?? null) === 'manager',
        );
        if (! is_array($manager) || ($manager['username'] ?? null) === $actorUsername) {
            return;
        }

        DemoTeamNotification::query()->create([
            'recipient_username' => $manager['username'],
            'actor_username' => $actorUsername,
            'type' => $type,
            'message' => $message,
            'data' => $data,
        ]);
    }

    /**
     * @param  array<string, mixed>  $currentTeam
     * @param  array<string, mixed>  $updatedTeam
     */
    private function assertMembershipUnchanged(array $currentTeam, array $updatedTeam): void
    {
        $memberUsernames = fn (array $team) => collect($team['members'] ?? [])
            ->filter(fn ($member) => is_array($member) && is_string($member['username'] ?? null))
            ->pluck('username')
            ->sort()
            ->values()
            ->all();

        abort_unless($memberUsernames($currentTeam) === $memberUsernames($updatedTeam), 403);
    }

    /**
     * @param  array<string, mixed>  $currentTeam
     * @param  array<string, mixed>  $updatedTeam
     */
    private function assertCompletionChangesBelongTo(string $username, array $currentTeam, array $updatedTeam): void
    {
        $members = collect($currentTeam['members'] ?? []);
        $updatedGoals = collect($updatedTeam['goals'] ?? [])->keyBy('id');

        foreach ($currentTeam['goals'] ?? [] as $goal) {
            if (! is_array($goal)) {
                continue;
            }

            $updatedGoal = $updatedGoals->get($goal['id'] ?? null);
            if (! is_array($updatedGoal)) {
                continue;
            }

            $updatedBlocks = collect($updatedGoal['buildingBlocks'] ?? [])->keyBy('id');
            foreach ($goal['buildingBlocks'] ?? [] as $block) {
                if (! is_array($block)) {
                    continue;
                }

                $updatedBlock = $updatedBlocks->get($block['id'] ?? null);
                if (! is_array($updatedBlock) || (bool) ($block['completed'] ?? false) === (bool) ($updatedBlock['completed'] ?? false)) {
                    continue;
                }

                $assignee = $members->firstWhere('id', $block['assigneeId'] ?? null);
                abort_unless(is_array($assignee) && ($assignee['username'] ?? null) === $username, 403);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedTeam(Request $request): array
    {
        $validated = $request->validate([
            'team' => ['required', 'array'],
            'team.id' => ['required', 'integer'],
            'team.name' => ['required', 'string', 'max:80'],
            'team.avatar' => ['nullable', 'string', 'max:4194304'],
            'team.inviteCode' => ['required', 'string', 'max:30'],
            'team.creatorUsername' => ['required', 'string', 'max:30'],
            'team.members' => ['required', 'array', 'max:100'],
            'team.goals' => ['present', 'array', 'max:100'],
            'team.createdAt' => ['required', 'integer'],
        ]);

        $team = $validated['team'];
        if (! collect($team['members'])->contains(fn ($member) => is_array($member) && isset($member['username'], $member['role']))) {
            throw ValidationException::withMessages(['team.members' => 'The team must have at least one valid member.']);
        }

        return $team;
    }
}
