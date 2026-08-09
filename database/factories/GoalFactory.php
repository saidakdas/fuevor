<?php

namespace Database\Factories;

use App\Enums\GoalStatus;
use App\Enums\Priority;
use App\Models\Goal;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Goal> */
class GoalFactory extends Factory
{
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-1 month', 'now');

        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'start_date' => $start,
            'target_date' => fake()->dateTimeBetween($start, '+1 year'),
            'status' => GoalStatus::Active,
            'priority' => fake()->randomElement(Priority::cases()),
            'motivation' => fake()->sentence(),
            'reward' => fake()->sentence(),
            'progress' => 0,
        ];
    }
}
