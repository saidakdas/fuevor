<?php

namespace App\Http\Requests;

use App\Models\Goal;
use App\Models\Milestone;
use Illuminate\Foundation\Http\FormRequest;

class ReorderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $owner = $this->route('milestone') ?? $this->route('goal');

        return ($owner instanceof Goal || $owner instanceof Milestone)
            && $this->user()?->can('update', $owner);
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'distinct'],
        ];
    }
}
