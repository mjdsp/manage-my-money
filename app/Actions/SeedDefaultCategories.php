<?php

namespace App\Actions;

use App\Enums\CategoryKind;
use App\Models\User;

/**
 * Gives a user the starter category set. Idempotent: existing categories with
 * the same (kind, name) are left alone. Run on registration and from the
 * database seeder.
 */
class SeedDefaultCategories
{
    /** @var list<string> */
    public const EXPENSE = [
        'Food', 'Groceries', 'Transport', 'Utilities', 'Rent', 'Dining',
        'Health', 'Shopping', 'Subscriptions', 'Savings', 'Debt Payment', 'Misc',
    ];

    /** @var list<string> */
    public const INCOME = ['Salary', 'Freelance', 'Interest', 'Other'];

    public function handle(User $user): void
    {
        foreach (self::EXPENSE as $name) {
            $user->categories()->firstOrCreate(
                ['kind' => CategoryKind::Expense, 'name' => $name],
                ['is_system' => true],
            );
        }

        foreach (self::INCOME as $name) {
            $user->categories()->firstOrCreate(
                ['kind' => CategoryKind::Income, 'name' => $name],
                ['is_system' => true],
            );
        }
    }
}
