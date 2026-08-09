<?php

namespace App\Http\Controllers;

use App\Http\Resources\TaskResource;
use App\Repositories\GoalRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, GoalRepository $repository): Response
    {
        $summary = $repository->dashboard($request->user());
        $summary['upcoming_tasks'] = TaskResource::collection($summary['upcoming_tasks'])->resolve();

        return Inertia::render('dashboard', ['summary' => $summary]);
    }
}
