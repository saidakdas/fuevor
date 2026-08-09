<?php

namespace App\Services;

use App\Enums\GoalStatus;
use App\Enums\MilestoneStatus;
use App\Models\Goal;
use App\Models\Milestone;
use Illuminate\Support\Facades\DB;

class ProgressService
{
    public function recalculateForMilestone(Milestone $milestone): Goal
    {
        return DB::transaction(function () use ($milestone) {
            $lockedGoal = Goal::query()->lockForUpdate()->findOrFail($milestone->goal_id);
            $lockedMilestone = Milestone::query()->lockForUpdate()->findOrFail($milestone->id);
            $tasks = $lockedMilestone->tasks()->lockForUpdate()->get(['is_completed']);
            $total = $tasks->count();
            $completed = $tasks->where('is_completed', true)->count();
            $progress = $total === 0 ? 0 : (int) round(($completed / $total) * 100);

            $lockedMilestone->forceFill([
                'progress' => $progress,
                'status' => match (true) {
                    $progress === 100 => MilestoneStatus::Completed,
                    $progress > 0 => MilestoneStatus::InProgress,
                    default => MilestoneStatus::Pending,
                },
                'completed_at' => $progress === 100 ? ($lockedMilestone->completed_at ?? now()) : null,
            ])->save();

            return $this->recalculateGoal($lockedGoal);
        });
    }

    public function recalculateGoal(Goal $goal): Goal
    {
        $lockedGoal = Goal::query()->lockForUpdate()->findOrFail($goal->id);
        $milestones = $lockedGoal->milestones()->lockForUpdate()->get(['progress']);
        $progress = (int) round((float) ($milestones->avg('progress') ?? 0));
        $attributes = ['progress' => $progress];

        if ($progress === 100) {
            $attributes['status'] = GoalStatus::Completed;
            $attributes['completed_at'] = $lockedGoal->completed_at ?? now();
        } elseif ($lockedGoal->status === GoalStatus::Completed) {
            $attributes['status'] = GoalStatus::Active;
            $attributes['completed_at'] = null;
        }

        $lockedGoal->forceFill($attributes)->save();

        return $lockedGoal->refresh();
    }
}
