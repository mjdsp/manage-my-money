<?php

namespace App\Enums;

enum AccountKind: string
{
    case Asset = 'asset';
    case Liability = 'liability';

    public function label(): string
    {
        return match ($this) {
            self::Asset => 'Asset',
            self::Liability => 'Liability',
        };
    }
}
