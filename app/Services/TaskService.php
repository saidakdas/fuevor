<?php

namespace App\Services;

use App\Models\Milestone;
use App\Models\Task;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskService
{
    public function __construct(private readonly ProgressService $progress) {}

    public function create(Milestone $milestone, array $data): Task
    {
        return DB::transaction(function () use ($milestone, $data) {
            $data['position'] = ((int) $milestone->tasks()->max('position')) + 1;
            $task = $milestone->tasks()->create($data);
            $this->progress->recalculateForMilestone($milestone);

            return $task;
        });
    }

    public function update(Task $task, array $data): Task
    {
        return DB::transaction(function () use ($task, $data) {
            if (array_key_exists('is_completed', $data)) {
                $data['completed_at'] = $data['is_completed'] ? ($task->completed_at ?? now()) : null;
            }
            $task->update($data);
            $this->progress->recalculateForMilestone($task->milestone);

            return $task->refresh();
        });
    }

    public function toggle(Task $task): Task
    {
        return $this->update($task, ['is_completed' => ! $task->is_completed]);
    }

    public function delete(Task $task): void
    {
        DB::transaction(function () use ($task) {
            $milestone = $task->milestone;
            $task->delete();
            $this->progress->recalculateForMilestone($milestone);
        });
    }

    public function reorder(Milestone $milestone, array $ids): void
    {
        $owned = $milestone->tasks()->whereIn('id', $ids)->pluck('id')->map(fn ($id) => (int) $id)->all();
        if (count($owned) !== count($ids)) {
            throw ValidationException::withMessages(['ids' => __('messages.invalid_task_order')]);
        }
        DB::transaction(fn () => collect($ids)->each(
            fn ($id, $position) => $milestone->tasks()->whereKey($id)->update(['position' => $position + 1])
        ));
    }
}
