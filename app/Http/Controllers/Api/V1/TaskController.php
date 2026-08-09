<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ReorderRequest;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Milestone;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class TaskController extends ApiController
{
    public function __construct(private readonly TaskService $service) {}

    public function index(Milestone $milestone): JsonResponse
    {
        Gate::authorize('view', $milestone);

        return $this->success(TaskResource::collection($milestone->tasks()->get()));
    }

    public function store(StoreTaskRequest $request, Milestone $milestone): JsonResponse
    {
        return $this->success(new TaskResource($this->service->create($milestone, $request->validated())), 'Görev oluşturuldu.', Response::HTTP_CREATED);
    }

    public function show(Milestone $milestone, Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        return $this->success(new TaskResource($task));
    }

    public function update(UpdateTaskRequest $request, Milestone $milestone, Task $task): JsonResponse
    {
        return $this->success(new TaskResource($this->service->update($task, $request->validated())), 'Görev güncellendi.');
    }

    public function destroy(Milestone $milestone, Task $task): JsonResponse
    {
        Gate::authorize('delete', $task);
        $this->service->delete($task);

        return $this->noContent();
    }

    public function toggle(Milestone $milestone, Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        return $this->success(new TaskResource($this->service->toggle($task)), 'Görev durumu güncellendi.');
    }

    public function reorder(ReorderRequest $request, Milestone $milestone): JsonResponse
    {
        $this->service->reorder($milestone, $request->validated('ids'));

        return $this->success(null, 'Görevler sıralandı.');
    }
}
