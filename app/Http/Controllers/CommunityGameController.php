<?php

namespace App\Http\Controllers;

use App\Models\GamePlay;
use App\Models\GameScore;
use App\Services\CommunityGameService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityGameController extends Controller
{
    public function __construct(private readonly CommunityGameService $game) {}

    public function start(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'player_name' => ['nullable', 'string', 'max:255'],
            'player_avatar' => ['nullable', 'string', 'max:4194304'],
        ]);

        if ($this->game->playsRemainingToday($request) < 1) {
            return response()->json([
                'message' => 'Günlük oyun hakkın doldu.',
                'plays_remaining' => 0,
            ], 429);
        }

        $play = GamePlay::query()->create([
            'user_id' => $request->user()?->id,
            'player_key' => $this->game->playerKey($request),
            'player_name' => trim((string) ($validated['player_name'] ?? $request->user()?->name)) ?: null,
            'player_avatar' => $validated['player_avatar'] ?? null,
        ]);

        return response()->json([
            'play_id' => $play->id,
            'plays_remaining' => $this->game->playsRemainingToday($request),
        ], 201);
    }

    public function finish(Request $request, GamePlay $play): JsonResponse
    {
        abort_unless(hash_equals($play->player_key, $this->game->playerKey($request)), 404);

        $validated = $request->validate([
            'duration_ms' => ['required', 'integer', 'min:250', 'max:86400000'],
        ]);

        $duration = (int) $validated['duration_ms'];

        if ($play->duration_ms === null) {
            $play->update(['duration_ms' => $duration]);
        }

        $bestScore = GameScore::query()->orderByDesc('duration_ms')->first();
        if ($duration > (int) ($bestScore?->duration_ms ?? 0)) {
            $bestScore = GameScore::query()->create([
                'user_id' => $play->user_id,
                'duration_ms' => $duration,
                'player_name' => $play->player_name,
                'player_avatar' => $play->player_avatar,
            ]);
        }

        return response()->json([
            'best_score_ms' => (int) ($bestScore?->duration_ms ?? 0),
            'best_score_player' => $bestScore?->player_name ? [
                'name' => $bestScore->player_name,
                'avatar' => $bestScore->player_avatar,
            ] : null,
            'plays_remaining' => $this->game->playsRemainingToday($request),
        ]);
    }
}
