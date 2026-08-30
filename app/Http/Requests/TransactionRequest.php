<?php

namespace App\Http\Requests;

use App\Enums\CategoryKind;
use App\Enums\TransactionType;
use App\Models\Category;
use App\Services\LedgerService;
use App\Support\Money;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Shared rules for creating and updating a manual transaction. Only the three
 * user-facing types are accepted here; adjustments are created by the system
 * for opening balances.
 */
class TransactionRequest extends FormRequest
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
            'type' => ['required', Rule::in(['income', 'expense', 'transfer'])],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999'],
            'date' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:255'],

            'category_id' => ['nullable', 'exists:categories,id', $ownedCategory],
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

            if ($type === null) {
                return;
            }

            if ($type === TransactionType::Income && $this->filled('from_account_id')) {
                $validator->errors()->add('from_account_id', 'Income has no source account.');
            }

            if ($type === TransactionType::Expense && $this->filled('to_account_id')) {
                $validator->errors()->add('to_account_id', 'An expense has no destination account.');
            }

            if ($type === TransactionType::Transfer && $this->filled('category_id')) {
                $validator->errors()->add('category_id', 'Transfers are not categorised.');
            }

            if ($this->filled('category_id') && $type->isCategorised()) {
                $category = Category::find($this->input('category_id'));
                $expected = $type === TransactionType::Income ? CategoryKind::Income : CategoryKind::Expense;

                if ($category && $category->kind !== $expected) {
                    $validator->errors()->add('category_id', "Choose a {$expected->value} category.");
                }
            }
        });
    }

    /**
     * Shape the payload the way {@see LedgerService} expects it.
     *
     * @return array<string, mixed>
     */
    public function toLedgerData(): array
    {
        $validated = $this->validated();

        return [
            'type' => TransactionType::from($validated['type']),
            'amount' => Money::ofPesos($validated['amount']),
            'date' => $validated['date'],
            'description' => $validated['description'] ?? null,
            'category_id' => $validated['category_id'] ?? null,
            'from_account_id' => $validated['from_account_id'] ?? null,
            'to_account_id' => $validated['to_account_id'] ?? null,
        ];
    }
}
