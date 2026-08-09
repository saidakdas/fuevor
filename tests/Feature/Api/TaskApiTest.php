<?php

namespace Tests\Feature\Api;

use App\Models\Goal;
use App\Models\Milestone;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_manage_tasks_of_own_milestone(): void
    {
        Sanctum::actingAs($user = User::factory()->create());
        $milestone = Milestone::factory()->for(Goal::factory()->for($user))->create();

        $response = $this->postJson("/api/v1/milestones/{$milestone->id}/tasks", ['title' => 'İlk görev', 'priority' => 'medium', 'due_date' => '2026-09-01'])->assertCreated();
        $id = $response->json('data.id');
        $this->putJson("/api/v1/milestones/{$milestone->id}/tasks/{$id}", ['title' => 'Güncel görev', 'priority' => 'high'])->assertOk()->assertJsonPath('data.title', 'Güncel görev');
        $this->patchJson("/api/v1/milestones/{$milestone->id}/tasks/{$id}/toggle")->assertOk()->assertJsonPath('data.is_completed', true);
        $this->deleteJson("/api/v1/milestones/{$milestone->id}/tasks/{$id}")->assertNoContent();
    }

    public function test_user_cannot_manage_another_users_task(): void
    {
        $task = Task::factory()->for(Milestone::factory()->for(Goal::factory()->for(User::factory())))->create();
        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/v1/milestones/{$task->milestone_id}/tasks/{$task->id}")->assertForbidden();
    }
}
