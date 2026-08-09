<?php

namespace Database\Factories;

use App\Enums\Priority;
use App\Models\Milestone;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Task> */
class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'milestone_id' => Milestone::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(),
            'due_date' => fake()->dateTimeBetween('now', '+3 months'),
            'priority' => fake()->randomElement(Priority::cases()),
            'is_completed' => false,
            'position' => 1,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn () => ['is_completed' => true, 'completed_at' => now()]);
    }
}
