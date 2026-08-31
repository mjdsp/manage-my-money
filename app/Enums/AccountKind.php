<?php

namespace App\Enums;

enum AccountKind: string
{
    case Asset = 'asset';
    case Liability = 'liability';
    case Receivable = 'receivable';

    public function label(): string
    {
        return match ($this) {
            self::Asset => 'Asset',
            self::Liability => 'Liability',
            self::Receivable => 'Money owed to me',
        };
    }

    /**
     * Kinds that carry a borrower, a repayment plan and a starting principal
     * (a debt owed by someone — either you owe it, or someone owes you).
     */
    public function hasRepaymentPlan(): bool
    {
        return $this === self::Liability || $this === self::Receivable;
    }
}
