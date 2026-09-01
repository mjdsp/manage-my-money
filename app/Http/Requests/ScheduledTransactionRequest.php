<?php

namespace App\Http\Requests;

use App\Enums\CategoryKind;
use App\Enums\TransactionType;
use App\Models\Category;
use App\Support\Money;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ScheduledTransactionRequest extends FormRequest
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
        $type = $this->input('type');
        $ownedAccount = Rule::exists('accounts', 'id')->where('user_id', $this->user()->id);
        $ownedCategory = Rule::exists('categories', 'id')->where('user_id', $this->user()->id);

        return [
            'description' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['income', 'expense', 'transfer'])],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999'],
            'day_of_month' => ['required', 'integer', 'between:1,31'],
            'next_due_date' => ['required', 'date'],
            'lead_time_days' => ['nullable', 'integer', 'between:0,60'],
            'is_active' => ['boolean'],
            'auto_post' => ['boolean'],

            'category_id' => ['nullable', $ownedCategory],
            'from_account_id' => [
                Rule::requiredIf(in_array($type, ['expense', 'transfer'], true)),
                'nullable', $ownedAccount,
            ],
            'to_account_id' => [
                Rule::requiredIf(in_array($type, ['income', 'transfer'], true)),
                'nullable', 'different:from_account_id', $ownedAccount,
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $type = TransactionType::tryFrom((string) $this->input('type'));

            if ($type === TransactionType::Transfer && $this->filled('category_id')) {
                $validator->errors()->add('category_id', 'Transfers are not categorised.');
            }

            if ($this->filled('category_id') && $type?->isCategorised()) {
                $category = Category::find($this->input('category_id'));
                $expected = $type === TransactionType::Income ? CategoryKind::Income : CategoryKind::Expense;

                if ($category && $category->kind !== $expected) {
                    $validator->errors()->add('category_id', "Choose a {$expected->value} category.");
                }
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function toModelData(): array
    {
        $v = $this->validated();

        return [
            'description' => $v['description'],
            'type' => TransactionType::from($v['type']),
            'amount' => Money::ofPesos($v['amount']),
            'day_of_month' => (int) $v['day_of_month'],
            'next_due_date' => $v['next_due_date'],
            'lead_time_days' => $v['lead_time_days'] ?? null,
            'is_active' => $this->boolean('is_active', true),
            'auto_post' => $this->boolean('auto_post'),
            'category_id' => $v['category_id'] ?? null,
            'from_account_id' => $v['from_account_id'] ?? null,
            'to_account_id' => $v['to_account_id'] ?? null,
        ];
    }
}
