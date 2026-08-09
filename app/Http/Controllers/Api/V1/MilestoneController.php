<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ReorderRequest;
use App\Http\Requests\StoreMilestoneRequest;
use App\Http\Requests\UpdateMilestoneRequest;
use App\Http\Resources\MilestoneResource;
use App\Models\Goal;
use App\Models\Milestone;
use App\Services\MilestoneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class MilestoneController extends ApiController
{
    public function __construct(private readonly MilestoneService $service) {}

    public function index(Goal $goal): JsonResponse
    {
        Gate::authorize('view', $goal);

        return $this->success(MilestoneResource::collection($goal->milestones()->with('tasks')->get()));
    }

    public function store(StoreMilestoneRequest $request, Goal $goal): JsonResponse
    {
        return $this->success(new MilestoneResource($this->service->create($goal, $request->validated())), 'Kilometre taşı oluşturuldu.', Response::HTTP_CREATED);
    }

    public function show(Goal $goal, Milestone $milestone): JsonResponse
    {
        Gate::authorize('view', $milestone);

        return $this->success(new MilestoneResource($milestone->load('tasks')));
    }

    public function update(UpdateMilestoneRequest $request, Goal $goal, Milestone $milestone): JsonResponse
    {
        return $this->success(new MilestoneResource($this->service->update($milestone, $request->validated())), 'Kilometre taşı güncellendi.');
    }

    public function destroy(Goal $goal, Milestone $milestone): JsonResponse
    {
        Gate::authorize('delete', $milestone);
        $this->service->delete($milestone);

        return $this->noContent();
    }

    public function reorder(ReorderRequest $request, Goal $goal): JsonResponse
    {
        $this->service->reorder($goal, $request->validated('ids'));

        return $this->success(null, 'Kilometre taşları sıralandı.');
    }
}
