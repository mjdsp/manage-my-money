<?php

namespace App\Http\Requests;

use App\Enums\AccountKind;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isLiability = $this->input('kind') === AccountKind::Liability->value;

        return [
            'name' => ['required', 'string', 'max:100'],
            'kind' => ['required', new Enum(AccountKind::class)],
            'opening_balance' => ['nullable', 'numeric', 'min:0', 'max:999999999'],

            // Asset / savings
            'bank_name' => ['nullable', 'string', 'max:100'],
            'interest_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],

            // Liability / debt
            'lender' => ['nullable', 'string', 'max:100'],
            'apr' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'due_day_of_month' => [
                Rule::requiredIf($isLiability),
                'nullable', 'integer', 'between:1,31',
            ],
            'scheduled_payment' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
        ];
    }
}
