<?php

namespace App\Enums;

enum TransactionType: string
{
    case Income = 'income';
    case Expense = 'expense';
    case Transfer = 'transfer';
    case Adjustment = 'adjustment';

    public function label(): string
    {
        return match ($this) {
            self::Income => 'Income',
            self::Expense => 'Expense',
            self::Transfer => 'Transfer',
            self::Adjustment => 'Adjustment',
        };
    }

    /**
     * Whether a transaction of this type always requires a source account.
     * (An adjustment requires exactly one side, so it is not "always".)
     */
    public function requiresSource(): bool
    {
        return $this === self::Expense || $this === self::Transfer;
    }

    /**
     * Whether a transaction of this type always requires a destination account.
     */
    public function requiresDestination(): bool
    {
        return $this === self::Income || $this === self::Transfer;
    }

    /**
     * Types that count as real spending/earning for category reports.
     */
    public function isCategorised(): bool
    {
        return $this === self::Income || $this === self::Expense;
    }
}
