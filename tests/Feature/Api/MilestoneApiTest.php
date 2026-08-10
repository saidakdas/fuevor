<?php

namespace Tests\Feature\Api;

use App\Models\Goal;
use App\Models\Milestone;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MilestoneApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.user_panel_enabled' => true]);
    }

    public function test_user_can_manage_milestones_of_own_goal(): void
    {
        Sanctum::actingAs($user = User::factory()->create());
        $goal = Goal::factory()->for($user)->create();

        $response = $this->postJson("/api/v1/goals/{$goal->id}/milestones", ['title' => 'İlk aşama', 'target_date' => '2026-10-01'])->assertCreated();
        $id = $response->json('data.id');
        $this->putJson("/api/v1/goals/{$goal->id}/milestones/{$id}", ['title' => 'Güncel aşama'])->assertOk()->assertJsonPath('data.title', 'Güncel aşama');
        $this->getJson("/api/v1/goals/{$goal->id}/milestones/{$id}")->assertOk();
        $this->deleteJson("/api/v1/goals/{$goal->id}/milestones/{$id}")->assertNoContent();
    }

    public function test_user_cannot_manage_another_users_milestone(): void
    {
        $milestone = Milestone::factory()->for(Goal::factory()->for(User::factory()))->create();
        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/v1/goals/{$milestone->goal_id}/milestones/{$milestone->id}")->assertForbidden();
    }
}
