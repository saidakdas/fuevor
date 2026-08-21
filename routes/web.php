<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\BetaWorkspaceController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\CommunityGameController;
use App\Http\Controllers\CommunityInteractionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DemoTeamNotificationController;
use App\Http\Controllers\DemoTeamWorkspaceController;
use App\Http\Controllers\GameScoreController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\MilestoneController;
use App\Http\Controllers\TaskController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$demoHome = fn (Request $request) => Inertia::render('demo/home', app(CommunityController::class)->feedData($request));

if (app()->environment('local', 'testing')) {
    Route::get('demo', $demoHome)->name('demo.preview');

    Route::prefix('demo/team-workspaces')->name('demo.team-workspaces.')->group(function () {
        Route::get('/', [DemoTeamWorkspaceController::class, 'index'])->name('index');
        Route::post('/', [DemoTeamWorkspaceController::class, 'store'])->name('store');
        Route::post('{workspaceKey}/invitations', [DemoTeamWorkspaceController::class, 'invite'])->name('invite');
        Route::delete('{workspaceKey}/members/{memberUsername}', [DemoTeamWorkspaceController::class, 'removeMember'])->name('members.destroy');
        Route::delete('{workspaceKey}', [DemoTeamWorkspaceController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('demo/notifications')->name('demo.notifications.')->group(function () {
        Route::get('/', [DemoTeamNotificationController::class, 'index'])->name('index');
        Route::post('{notification}/accept', [DemoTeamNotificationController::class, 'accept'])->name('accept');
        Route::post('{notification}/reject', [DemoTeamNotificationController::class, 'reject'])->name('reject');
        Route::post('{notification}/read', [DemoTeamNotificationController::class, 'read'])->name('read');
    });

    Route::prefix('demo/community')->name('demo.community.')->group(function () {
        Route::post('goals', [CommunityInteractionController::class, 'storeGoal'])->name('goals.store');
        Route::post('goals/{post}/support', [CommunityInteractionController::class, 'toggleSupport'])->name('goals.support');
        Route::post('goals/{post}/ideas', [CommunityInteractionController::class, 'storeIdea'])->name('goals.ideas.store');
        Route::post('goals/{post}/ideas/{idea}/support', [CommunityInteractionController::class, 'toggleIdeaSupport'])->name('goals.ideas.support');
        Route::post('books/reviews', [CommunityInteractionController::class, 'storeBookReview'])->name('books.reviews.store');
        Route::post('books/reviews/{review}/replies', [CommunityInteractionController::class, 'storeBookReviewReply'])->name('books.reviews.replies.store');
        Route::post('books/sync', [CommunityInteractionController::class, 'syncDemoBooks'])->name('books.sync');
    });

    Route::get('demo/universities', function (Request $request) {
        $query = trim((string) $request->query('q', ''));

        if (mb_strlen($query) < 2) {
            return response()->json([]);
        }

        try {
            $response = Http::acceptJson()
                ->timeout(6)
                ->get('http://universities.hipolabs.com/search', [
                    'name' => mb_substr($query, 0, 100),
                ]);

            if ($response->failed() || ! is_array($response->json())) {
                return response()->json([], 503);
            }

            $universities = collect($response->json())
                ->filter(fn ($university) => is_array($university)
                    && is_string($university['name'] ?? null)
                    && is_string($university['country'] ?? null)
                    && is_string($university['alpha_two_code'] ?? null))
                ->map(fn ($university) => [
                    'name' => trim($university['name']),
                    'country' => trim($university['country']),
                    'alpha_two_code' => strtoupper(trim($university['alpha_two_code'])),
                ])
                ->unique(fn ($university) => mb_strtolower($university['name']).'|'.$university['alpha_two_code'])
                ->take(20)
                ->values();

            return response()
                ->json($universities)
                ->header('Cache-Control', 'private, max-age=86400');
        } catch (Throwable) {
            return response()->json([], 503);
        }
    })->middleware('throttle:30,1')->name('demo.universities');
}

Route::get('/', CommunityController::class)->name('home');

Route::middleware('auth')->prefix('community')->name('community.')->group(function () {
    Route::post('goals', [CommunityInteractionController::class, 'storeGoal'])->name('goals.store');
    Route::post('goals/{post}/support', [CommunityInteractionController::class, 'toggleSupport'])->name('goals.support');
    Route::post('goals/{post}/ideas', [CommunityInteractionController::class, 'storeIdea'])->name('goals.ideas.store');
    Route::post('goals/{post}/ideas/{idea}/support', [CommunityInteractionController::class, 'toggleIdeaSupport'])->name('goals.ideas.support');
    Route::post('books/reviews', [CommunityInteractionController::class, 'storeBookReview'])->name('books.reviews.store');
    Route::post('books/reviews/{review}/replies', [CommunityInteractionController::class, 'storeBookReviewReply'])->name('books.reviews.replies.store');
    Route::post('books/sync', [CommunityInteractionController::class, 'syncDemoBooks'])->name('books.sync');
});

Route::middleware('auth')->prefix('beta')->name('beta.')->group(function () {
    Route::get('/', [BetaWorkspaceController::class, 'show'])->name('show');
    Route::patch('state', [BetaWorkspaceController::class, 'update'])->name('state.update');
    Route::post('state', [BetaWorkspaceController::class, 'update'])->name('state.store');
});

Route::post('game-scores', [GameScoreController::class, 'store'])
    ->middleware('throttle:20,1')
    ->name('game-scores.store');

Route::prefix('community/game')->name('community.game.')->middleware('throttle:10,1')->group(function () {
    Route::post('plays', [CommunityGameController::class, 'start'])->name('plays.start');
    Route::patch('plays/{play}', [CommunityGameController::class, 'finish'])->name('plays.finish');
});

Route::middleware(['auth', 'user-panel'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::resource('goals', GoalController::class);
    Route::post('goals/{goal}/milestones', [MilestoneController::class, 'store'])->name('milestones.store');
    Route::put('goals/{goal}/milestones/reorder', [MilestoneController::class, 'reorder'])->name('milestones.reorder');
    Route::put('milestones/{milestone}', [MilestoneController::class, 'update'])->name('milestones.update');
    Route::delete('milestones/{milestone}', [MilestoneController::class, 'destroy'])->name('milestones.destroy');
    Route::post('milestones/{milestone}/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::put('milestones/{milestone}/tasks/reorder', [TaskController::class, 'reorder'])->name('tasks.reorder');
    Route::put('tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::patch('tasks/{task}/toggle', [TaskController::class, 'toggle'])->name('tasks.toggle');
    Route::delete('tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', AdminDashboardController::class)->name('index');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
