<?php

namespace App\Http\Requests;

use App\Enums\Priority;
use App\Models\Milestone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $milestone = $this->route('milestone');

        return $milestone instanceof Milestone && $this->user()?->can('update', $milestone);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'due_date' => ['nullable', 'date'],
            'priority' => ['required', Rule::enum(Priority::class)],
        ];
    }
}
