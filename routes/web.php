<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GameScoreController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\MilestoneController;
use App\Http\Controllers\TaskController;
use App\Models\GameScore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$demoHome = fn () => Inertia::render('demo/home');

if (app()->environment('local', 'testing')) {
    Route::get('demo', $demoHome)->name('demo.preview');
}

Route::get('/', function (Request $request) {
    return Inertia::render('welcome', [
        'bestScoreMs' => GameScore::query()->max('duration_ms') ?? 0,
        'registrationSuccess' => $request->session()->get('registration_success'),
    ]);
})->name('home');

Route::post('game-scores', [GameScoreController::class, 'store'])
    ->middleware('throttle:20,1')
    ->name('game-scores.store');

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
