<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The account's kind and opening balance are fixed once created; only the
 * descriptive fields can change here.
 */
class UpdateAccountRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:100'],
            'is_archived' => ['boolean'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'interest_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lender' => ['nullable', 'string', 'max:100'],
            'apr' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'due_day_of_month' => ['nullable', 'integer', 'between:1,31'],
            'scheduled_payment' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
        ];
    }
}
