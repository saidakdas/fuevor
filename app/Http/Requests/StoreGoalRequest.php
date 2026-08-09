<?php

namespace App\Http\Requests;

use App\Enums\GoalStatus;
use App\Enums\Priority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'start_date' => ['required', 'date'],
            'target_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['sometimes', Rule::enum(GoalStatus::class)],
            'priority' => ['required', Rule::enum(Priority::class)],
            'motivation' => ['nullable', 'string', 'max:5000'],
            'reward' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
