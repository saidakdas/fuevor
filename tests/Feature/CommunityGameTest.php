<?php

namespace Tests\Feature;

use App\Models\GamePlay;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityGameTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_start_at_most_three_games_per_day(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/community/game/plays')->assertCreated()->assertJsonPath('plays_remaining', 2);
        $this->actingAs($user)->postJson('/community/game/plays')->assertCreated()->assertJsonPath('plays_remaining', 1);
        $this->actingAs($user)->postJson('/community/game/plays')->assertCreated()->assertJsonPath('plays_remaining', 0);
        $this->actingAs($user)->postJson('/community/game/plays')->assertStatus(429)->assertJsonPath('plays_remaining', 0);

        $this->assertDatabaseCount('game_plays', 3);
    }

    public function test_daily_game_limit_is_separate_for_each_user(): void
    {
        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();

        foreach (range(1, 3) as $_) {
            $this->actingAs($firstUser)->postJson('/community/game/plays')->assertCreated();
        }

        $this->actingAs($secondUser)
            ->postJson('/community/game/plays')
            ->assertCreated()
            ->assertJsonPath('plays_remaining', 2);
    }

    public function test_a_run_can_be_finished_only_by_its_owner(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $playId = $this->actingAs($owner)->postJson('/community/game/plays', [
            'player_name' => 'Rekor Sahibi',
            'player_avatar' => 'data:image/png;base64,dGVzdA==',
        ])->json('play_id');

        $this->actingAs($otherUser)
            ->patchJson("/community/game/plays/{$playId}", ['duration_ms' => 12_500])
            ->assertNotFound();

        $this->actingAs($owner)
            ->patchJson("/community/game/plays/{$playId}", ['duration_ms' => 12_500])
            ->assertOk()
            ->assertJsonPath('best_score_ms', 12_500)
            ->assertJsonPath('best_score_player.name', 'Rekor Sahibi')
            ->assertJsonPath('best_score_player.avatar', 'data:image/png;base64,dGVzdA==')
            ->assertJsonPath('plays_remaining', 2);

        $this->assertDatabaseHas('game_plays', [
            'id' => $playId,
            'user_id' => $owner->id,
            'duration_ms' => 12_500,
        ]);
    }

    public function test_community_props_include_the_remaining_daily_plays(): void
    {
        $user = User::factory()->create();
        GamePlay::query()->create([
            'user_id' => $user->id,
            'player_key' => 'user:'.$user->id,
        ]);

        $this->actingAs($user)
            ->get('/')
            ->assertInertia(fn ($page) => $page
                ->component('welcome')
                ->where('gamePlaysRemaining', 2));
    }
}
