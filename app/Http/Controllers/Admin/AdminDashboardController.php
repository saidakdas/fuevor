<?php

namespace App\Http\Controllers\Admin;

use App\Enums\GoalStatus;
use App\Http\Controllers\Controller;
use App\Models\BetaFeedback;
use App\Models\Goal;
use App\Models\SupportTicket;
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
        $section = in_array($request->query('section'), ['users', 'support', 'feedback'], true)
            ? $request->query('section')
            : 'users';

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

        $supportTickets = SupportTicket::query()
            ->with([
                'user:id,name,email,phone',
                'messages:id,support_ticket_id,user_id,is_admin,body,created_at',
            ])
            ->latest('updated_at')
            ->paginate(20, ['*'], 'support_page')
            ->withQueryString()
            ->through(fn (SupportTicket $ticket) => [
                'id' => $ticket->id,
                'status' => $ticket->status,
                'created_at' => $ticket->created_at?->toISOString(),
                'updated_at' => $ticket->updated_at?->toISOString(),
                'user' => [
                    'id' => $ticket->user->id,
                    'name' => $ticket->user->name,
                    'email' => $ticket->user->email,
                    'phone' => $ticket->user->phone,
                ],
                'messages' => $ticket->messages->map(fn ($message) => [
                    'id' => $message->id,
                    'body' => $message->body,
                    'is_admin' => $message->is_admin,
                    'created_at' => $message->created_at?->toISOString(),
                ])->values(),
            ]);

        $feedbackEntries = BetaFeedback::query()
            ->with('user:id,name,email')
            ->latest()
            ->paginate(20, ['*'], 'feedback_page')
            ->withQueryString()
            ->through(fn (BetaFeedback $feedback) => [
                'id' => $feedback->id,
                'rating' => $feedback->rating,
                'comment' => $feedback->comment,
                'created_at' => $feedback->created_at?->toISOString(),
                'user' => [
                    'id' => $feedback->user->id,
                    'name' => $feedback->user->name,
                    'email' => $feedback->user->email,
                ],
            ]);

        return Inertia::render('admin/index', [
            'section' => $section,
            'filters' => ['q' => $search],
            'stats' => [
                'total_users' => User::query()->where('role', 'user')->count(),
                'total_goals' => Goal::query()->count(),
                'active_goals' => Goal::query()->where('status', GoalStatus::Active->value)->count(),
                'completed_goals' => Goal::query()->where('status', GoalStatus::Completed->value)->count(),
                'support_messages' => SupportTicket::query()->count(),
                'open_support' => SupportTicket::query()->where('status', 'open')->count(),
                'feedback_count' => BetaFeedback::query()->count(),
                'average_rating' => round((float) (BetaFeedback::query()->avg('rating') ?? 0), 1),
            ],
            'users' => $users,
            'supportTickets' => $supportTickets,
            'feedbackEntries' => $feedbackEntries,
        ]);
    }
}
