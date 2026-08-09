<?php

namespace App\Http\Requests;

use App\Models\Milestone;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMilestoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        $milestone = $this->route('milestone');

        return $milestone instanceof Milestone && $this->user()?->can('update', $milestone);
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'target_date' => ['nullable', 'date'],
        ];
    }
}
