<?php

namespace App\Services;

use App\Models\GamePlay;
use Illuminate\Http\Request;

class CommunityGameService
{
    public const DAILY_LIMIT = 3;

    public function playerKey(Request $request): string
    {
        if ($request->user()) {
            return 'user:'.$request->user()->getKey();
        }

        $demoUsername = trim((string) $request->session()->get('demo_community_username'));
        if ($demoUsername !== '') {
            return 'demo:'.mb_strtolower($demoUsername);
        }

        return 'session:'.$request->session()->getId();
    }

    public function playsUsedToday(Request $request): int
    {
        return GamePlay::query()
            ->where('player_key', $this->playerKey($request))
            ->whereBetween('created_at', [now()->startOfDay(), now()->endOfDay()])
            ->count();
    }

    public function playsRemainingToday(Request $request): int
    {
        return max(0, self::DAILY_LIMIT - $this->playsUsedToday($request));
    }
}
