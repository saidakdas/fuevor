<?php

namespace App\Http\Requests;

use App\Enums\GoalStatus;
use App\Enums\Priority;
use App\Models\Goal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        $goal = $this->route('goal');

        return $goal instanceof Goal && $this->user()?->can('update', $goal);
    }

    public function rules(): array
    {
        $goal = $this->route('goal');
        $startDate = $this->input('start_date', $goal instanceof Goal ? $goal->start_date->toDateString() : null);

        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'start_date' => ['sometimes', 'required', 'date'],
            'target_date' => ['sometimes', 'required', 'date', 'after_or_equal:'.$startDate],
            'status' => ['sometimes', Rule::enum(GoalStatus::class)],
            'priority' => ['sometimes', Rule::enum(Priority::class)],
            'motivation' => ['nullable', 'string', 'max:5000'],
            'reward' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
