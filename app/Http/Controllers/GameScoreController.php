<?php

namespace App\Http\Controllers;

use App\Models\GameScore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameScoreController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'duration_ms' => ['required', 'integer', 'min:250', 'max:86400000'],
        ]);

        $duration = (int) $validated['duration_ms'];
        $bestScore = (int) (GameScore::query()->max('duration_ms') ?? 0);

        if ($duration > $bestScore) {
            GameScore::query()->create(['duration_ms' => $duration]);
            $bestScore = $duration;
        }

        return response()->json([
            'best_score_ms' => $bestScore,
        ]);
    }
}
