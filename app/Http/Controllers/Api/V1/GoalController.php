<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\StoreGoalRequest;
use App\Http\Requests\UpdateGoalRequest;
use App\Http\Resources\GoalResource;
use App\Models\Goal;
use App\Repositories\GoalRepository;
use App\Services\GoalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class GoalController extends ApiController
{
    public function __construct(private readonly GoalService $service, private readonly GoalRepository $repository) {}

    public function index(Request $request): JsonResponse
    {
        return $this->success(GoalResource::collection($this->repository->forUser($request->user())));
    }

    public function store(StoreGoalRequest $request): JsonResponse
    {
        $goal = $this->service->create($request->user(), $request->validated());

        return $this->success(new GoalResource($goal), 'Hedef oluşturuldu.', Response::HTTP_CREATED);
    }

    public function show(Goal $goal): JsonResponse
    {
        Gate::authorize('view', $goal);

        return $this->success(new GoalResource($goal->load('milestones.tasks')));
    }

    public function update(UpdateGoalRequest $request, Goal $goal): JsonResponse
    {
        return $this->success(new GoalResource($this->service->update($goal, $request->validated())), 'Hedef güncellendi.');
    }

    public function destroy(Goal $goal): JsonResponse
    {
        Gate::authorize('delete', $goal);
        $this->service->delete($goal);

        return $this->noContent();
    }
}
