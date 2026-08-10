<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReorderRequest;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Milestone;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    public function __construct(private readonly TaskService $service) {}

    public function store(StoreTaskRequest $request, Milestone $milestone): RedirectResponse
    {
        $this->service->create($milestone, $request->validated());

        return back()->with('success', __('messages.task_created'));
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $this->service->update($task, $request->validated());

        return back()->with('success', __('messages.task_updated'));
    }

    public function destroy(Task $task): RedirectResponse
    {
        Gate::authorize('delete', $task);
        $this->service->delete($task);

        return back()->with('success', __('messages.task_deleted'));
    }

    public function toggle(Task $task): RedirectResponse
    {
        Gate::authorize('update', $task);
        $this->service->toggle($task);

        return back();
    }

    public function reorder(ReorderRequest $request, Milestone $milestone): RedirectResponse
    {
        $this->service->reorder($milestone, $request->validated('ids'));

        return back()->with('success', __('messages.order_updated'));
    }
}
