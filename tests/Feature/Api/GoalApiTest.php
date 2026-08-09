<?php

namespace Tests\Feature\Api;

use App\Models\Goal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GoalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_read_update_and_delete_own_goal(): void
    {
        Sanctum::actingAs($user = User::factory()->create());
        $payload = ['title' => 'Yeni hedef', 'description' => 'Açıklama', 'start_date' => '2026-08-01', 'target_date' => '2026-12-01', 'priority' => 'high', 'motivation' => 'Nedenim', 'reward' => 'Kazanım'];

        $created = $this->postJson('/api/v1/goals', $payload)->assertCreated()->assertJsonPath('data.title', 'Yeni hedef');
        $id = $created->json('data.id');
        $this->getJson("/api/v1/goals/{$id}")->assertOk()->assertJsonPath('data.id', $id);
        $this->putJson("/api/v1/goals/{$id}", [...$payload, 'title' => 'Güncel hedef'])->assertOk()->assertJsonPath('data.title', 'Güncel hedef');
        $this->deleteJson("/api/v1/goals/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('goals', ['id' => $id, 'user_id' => $user->id]);
    }

    public function test_user_cannot_access_another_users_goal(): void
    {
        $owner = User::factory()->create();
        $goal = Goal::factory()->for($owner)->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/v1/goals/{$goal->id}")->assertForbidden();
        $this->deleteJson("/api/v1/goals/{$goal->id}")->assertForbidden();
    }
}
