<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\GoalController;
use App\Http\Controllers\Api\V1\MilestoneController;
use App\Http\Controllers\Api\V1\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('auth/login', [AuthController::class, 'login'])->name('auth.login');

    Route::middleware('auth:sanctum')->scopeBindings()->group(function () {
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('dashboard', DashboardController::class)->name('dashboard');

        Route::apiResource('goals', GoalController::class);
        Route::put('goals/{goal}/milestones/reorder', [MilestoneController::class, 'reorder'])->name('goals.milestones.reorder');
        Route::apiResource('goals.milestones', MilestoneController::class);
        Route::put('milestones/{milestone}/tasks/reorder', [TaskController::class, 'reorder'])->name('milestones.tasks.reorder');
        Route::patch('milestones/{milestone}/tasks/{task}/toggle', [TaskController::class, 'toggle'])->name('milestones.tasks.toggle');
        Route::apiResource('milestones.tasks', TaskController::class);
    });
});
