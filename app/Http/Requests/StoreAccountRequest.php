<?php

namespace App\Http\Requests;

use App\Enums\AccountKind;
use Illuminate\Database\Query\Builder;
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

            // Liability / debt / receivable
            'lender' => ['nullable', 'string', 'max:100'],
            'borrowed_on' => ['nullable', 'date'],
            'monthly_interest_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'due_day_of_month' => [
                Rule::requiredIf($isLiability),
                'nullable', 'integer', 'between:1,31',
            ],
            'term_months' => ['nullable', 'integer', 'between:1,600'],
            'scheduled_payment' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'total_repayment' => ['nullable', 'numeric', 'min:0', 'max:999999999'],

            // Liability: the asset account the borrowed money was paid into.
            'deposit_account_id' => [
                'exclude_unless:kind,'.AccountKind::Liability->value,
                'nullable',
                'integer',
                Rule::exists('accounts', 'id')->where(fn (Builder $query) => $query
                    ->where('user_id', $this->user()->id)
                    ->where('kind', AccountKind::Asset->value)
                    ->where('is_archived', false)),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'deposit_account_id.exists' => 'Choose one of your asset accounts.',
        ];
    }
}
