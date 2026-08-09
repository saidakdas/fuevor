<?php

namespace App\Services;

use App\Models\Goal;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class GoalService
{
    public function create(User $user, array $data): Goal
    {
        return DB::transaction(fn () => $user->goals()->create($data));
    }

    public function update(Goal $goal, array $data): Goal
    {
        return DB::transaction(function () use ($goal, $data) {
            $goal->update($data);

            return $goal->refresh();
        });
    }

    public function delete(Goal $goal): void
    {
        DB::transaction(fn () => $goal->delete());
    }
}
