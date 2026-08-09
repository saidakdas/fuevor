<?php

namespace Database\Factories;

use App\Enums\MilestoneStatus;
use App\Models\Goal;
use App\Models\Milestone;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Milestone> */
class MilestoneFactory extends Factory
{
    public function definition(): array
    {
        return [
            'goal_id' => Goal::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->sentence(),
            'target_date' => fake()->dateTimeBetween('now', '+6 months'),
            'position' => 1,
            'status' => MilestoneStatus::Pending,
            'progress' => 0,
        ];
    }
}
