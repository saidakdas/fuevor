<?php

namespace App\Http\Controllers;

use App\Models\DemoTeamNotification;
use App\Models\DemoTeamWorkspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DemoTeamNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $username = $this->validatedUsername($request);
        $notifications = DemoTeamNotification::query()
            ->where('recipient_username', $username)
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn (DemoTeamNotification $notification) => $this->serialize($notification));

        return response()->json(['notifications' => $notifications]);
    }

    public function accept(Request $request, DemoTeamNotification $notification): JsonResponse
    {
        $username = $this->validatedUsername($request);
        abort_unless($notification->recipient_username === $username && $notification->type === 'team_invite', 403);
        abort_if($notification->acted_at, 409);

        $team = DB::transaction(function () use ($notification) {
            $workspace = DemoTeamWorkspace::query()
                ->where('workspace_key', $notification->data['workspaceKey'] ?? '')
                ->lockForUpdate()
                ->firstOrFail();
            $team = $workspace->payload;
            $member = $notification->data['member'] ?? null;
            abort_unless(is_array($member), 422);

            if (! collect($team['members'] ?? [])->contains(
                fn ($existing) => is_array($existing) && ($existing['username'] ?? null) === ($member['username'] ?? null),
            )) {
                $team['members'][] = $member;
                $workspace->update(['payload' => $team]);
            }

            $notification->update(['read_at' => now(), 'acted_at' => now()]);

            return $team;
        });

        return response()->json(['team' => $team, 'notification' => $this->serialize($notification->fresh())]);
    }

    public function reject(Request $request, DemoTeamNotification $notification): JsonResponse
    {
        $username = $this->validatedUsername($request);
        abort_unless($notification->recipient_username === $username && $notification->type === 'team_invite', 403);
        abort_if($notification->acted_at, 409);
        $notification->update(['read_at' => now(), 'acted_at' => now()]);

        return response()->json(['notification' => $this->serialize($notification->fresh())]);
    }

    public function read(Request $request, DemoTeamNotification $notification): JsonResponse
    {
        $username = $this->validatedUsername($request);
        abort_unless($notification->recipient_username === $username, 403);
        $notification->update(['read_at' => $notification->read_at ?? now()]);

        return response()->json(['notification' => $this->serialize($notification->fresh())]);
    }

    private function validatedUsername(Request $request): string
    {
        return $request->validate(['username' => ['required', 'string', 'max:30']])['username'];
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(DemoTeamNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'message' => $notification->message,
            'data' => $notification->data,
            'readAt' => $notification->read_at?->toISOString(),
            'actedAt' => $notification->acted_at?->toISOString(),
            'createdAt' => $notification->created_at?->toISOString(),
        ];
    }
}
