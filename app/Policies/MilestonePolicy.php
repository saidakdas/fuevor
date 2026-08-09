<?php

namespace App\Policies;

use App\Models\Milestone;
use App\Models\User;

class MilestonePolicy
{
    public function view(User $user, Milestone $milestone): bool
    {
        return $milestone->goal->user_id === $user->id;
    }

    public function update(User $user, Milestone $milestone): bool
    {
        return $this->view($user, $milestone);
    }

    public function delete(User $user, Milestone $milestone): bool
    {
        return $this->view($user, $milestone);
    }
}
