<?php

namespace Tests\Feature;

use App\Enums\GoalStatus;
use App\Enums\MilestoneStatus;
use App\Models\Goal;
use App\Models\Milestone;
use App\Models\Task;
use App\Models\User;
use App\Services\TaskService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgressCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_task_completion_recalculates_milestone_and_goal_progress(): void
    {
        $goal = Goal::factory()->for(User::factory())->create();
        $first = Milestone::factory()->for($goal)->create(['position' => 1]);
        $second = Milestone::factory()->for($goal)->create(['position' => 2]);
        $firstTasks = Task::factory(2)->for($first)->sequence(['position' => 1], ['position' => 2])->create();
        $secondTasks = Task::factory(2)->for($second)->sequence(['position' => 1], ['position' => 2])->create();
        $service = app(TaskService::class);

        $service->toggle($firstTasks[0]);
        $this->assertSame(50, $first->refresh()->progress);
        $this->assertSame(25, $goal->refresh()->progress);

        $service->toggle($firstTasks[1]);
        $this->assertSame(MilestoneStatus::Completed, $first->refresh()->status);
        $this->assertSame(50, $goal->refresh()->progress);

        $service->toggle($secondTasks[0]);
        $service->toggle($secondTasks[1]);
        $this->assertSame(100, $goal->refresh()->progress);
        $this->assertSame(GoalStatus::Completed, $goal->status);
        $this->assertNotNull($goal->fu_awarded_at);
        $this->assertSame(1, $goal->user->refresh()->fu_balance);

        $service->toggle($secondTasks[0]->refresh());
        $this->assertSame(75, $goal->refresh()->progress);
        $this->assertSame(GoalStatus::Active, $goal->status);
        $this->assertSame(1, $goal->user->refresh()->fu_balance);

        $service->toggle($secondTasks[0]->refresh());
        $this->assertSame(GoalStatus::Completed, $goal->refresh()->status);
        $this->assertSame(1, $goal->user->refresh()->fu_balance);
    }
}
