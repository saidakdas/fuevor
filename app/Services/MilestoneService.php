<?php

namespace App\Services;

use App\Models\Goal;
use App\Models\Milestone;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MilestoneService
{
    public function __construct(private readonly ProgressService $progress) {}

    public function create(Goal $goal, array $data): Milestone
    {
        return DB::transaction(function () use ($goal, $data) {
            $data['position'] = ((int) $goal->milestones()->max('position')) + 1;
            $milestone = $goal->milestones()->create($data);
            $this->progress->recalculateGoal($goal);

            return $milestone;
        });
    }

    public function update(Milestone $milestone, array $data): Milestone
    {
        $milestone->update($data);

        return $milestone->refresh();
    }

    public function delete(Milestone $milestone): void
    {
        DB::transaction(function () use ($milestone) {
            $goal = $milestone->goal;
            $milestone->delete();
            $this->progress->recalculateGoal($goal);
        });
    }

    public function reorder(Goal $goal, array $ids): void
    {
        $owned = $goal->milestones()->whereIn('id', $ids)->pluck('id')->map(fn ($id) => (int) $id)->all();
        if (count($owned) !== count($ids)) {
            throw ValidationException::withMessages(['ids' => 'Sıralama yalnızca bu hedefin kilometre taşlarını içerebilir.']);
        }
        DB::transaction(fn () => collect($ids)->each(
            fn ($id, $position) => $goal->milestones()->whereKey($id)->update(['position' => $position + 1])
        ));
    }
}
