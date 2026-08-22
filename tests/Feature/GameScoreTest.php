<?php

namespace Tests\Feature;

use App\Models\GameScore;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GameScoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_shows_the_global_best_score(): void
    {
        GameScore::query()->create(['duration_ms' => 12840]);
        GameScore::query()->create(['duration_ms' => 21490]);

        $this->get('/topluluk')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('bestScoreMs', 21490));
    }

    public function test_a_new_best_score_is_saved(): void
    {
        GameScore::query()->create(['duration_ms' => 10000]);

        $this->postJson('/game-scores', ['duration_ms' => 15620])
            ->assertOk()
            ->assertJsonPath('best_score_ms', 15620);

        $this->assertDatabaseHas('game_scores', ['duration_ms' => 15620]);
    }

    public function test_a_lower_score_does_not_create_an_unnecessary_record(): void
    {
        GameScore::query()->create(['duration_ms' => 10000]);

        $this->postJson('/game-scores', ['duration_ms' => 4200])
            ->assertOk()
            ->assertJsonPath('best_score_ms', 10000);

        $this->assertDatabaseCount('game_scores', 1);
    }

    public function test_an_invalid_score_is_rejected(): void
    {
        $this->postJson('/game-scores', ['duration_ms' => 100])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('duration_ms');
    }
}
