<?php

namespace App\Repositories;

use App\Enums\GoalStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class GoalRepository
{
    public function forUser(User $user): Collection
    {
        return $user->goals()->withCount('milestones')->latest()->get();
    }

    public function dashboard(User $user): array
    {
        $goals = $user->goals();
        $upcoming = Task::query()
            ->whereHas('milestone.goal', fn ($query) => $query->where('user_id', $user->id))
            ->where('is_completed', false)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '>=', today())
            ->with('milestone.goal')
            ->orderBy('due_date')
            ->limit(6)
            ->get();

        return [
            'active_goals' => (clone $goals)->where('status', GoalStatus::Active)->count(),
            'completed_goals' => (clone $goals)->where('status', GoalStatus::Completed)->count(),
            'average_progress' => (int) round((float) ((clone $goals)->avg('progress') ?? 0)),
            'upcoming_tasks' => $upcoming,
        ];
    }
}
