<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\TaskResource;
use App\Repositories\GoalRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    public function __invoke(Request $request, GoalRepository $repository): JsonResponse
    {
        $summary = $repository->dashboard($request->user());
        $summary['upcoming_tasks'] = TaskResource::collection($summary['upcoming_tasks']);

        return $this->success($summary);
    }
}
