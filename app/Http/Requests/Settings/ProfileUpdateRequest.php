<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use App\Support\PhoneNormalizer;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => mb_strtolower(trim((string) $this->email)),
            'phone' => PhoneNormalizer::normalize($this->phone),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],

            'phone' => [
                'nullable',
                'string',
                'regex:/^\+?[0-9]{7,20}$/',
                Rule::unique(User::class)->ignore($this->user()->id),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (PhoneNormalizer::isInUse((string) $value, $this->user()->id)) {
                        $fail('Bu telefon numarası başka bir hesapta kullanılıyor.');
                    }
                },
            ],

            'show_fu_publicly' => ['required', 'boolean'],

            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }
}
