<?php

namespace App\Http\Controllers\Admin;

use App\Enums\GoalStatus;
use App\Http\Controllers\Controller;
use App\Models\Goal;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = mb_substr(trim((string) $request->query('q', '')), 0, 100);

        $users = User::query()
            ->select(['id', 'name', 'email', 'phone', 'role', 'email_verified_at', 'created_at'])
            ->with(['goals' => fn ($query) => $query
                ->select(['id', 'user_id', 'title', 'status', 'priority', 'progress', 'target_date', 'created_at'])
                ->latest()])
            ->withCount('goals')
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'created_at' => $user->created_at?->toISOString(),
                'goals_count' => $user->goals_count,
                'goals' => $user->goals->map(fn (Goal $goal) => [
                    'id' => $goal->id,
                    'title' => $goal->title,
                    'status' => $goal->status->value,
                    'priority' => $goal->priority->value,
                    'progress' => $goal->progress,
                    'target_date' => $goal->target_date?->toDateString(),
                ]),
            ]);

        return Inertia::render('admin/index', [
            'filters' => ['q' => $search],
            'stats' => [
                'total_users' => User::query()->where('role', 'user')->count(),
                'total_goals' => Goal::query()->count(),
                'active_goals' => Goal::query()->where('status', GoalStatus::Active->value)->count(),
                'completed_goals' => Goal::query()->where('status', GoalStatus::Completed->value)->count(),
            ],
            'users' => $users,
        ]);
    }
}
