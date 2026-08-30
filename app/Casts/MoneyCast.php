<?php

namespace App\Casts;

use App\Support\Money;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

/**
 * Casts an integer centavo column to/from a {@see Money} value object.
 *
 * @implements CastsAttributes<Money|null, Money|int|null>
 */
class MoneyCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?Money
    {
        if ($value === null) {
            return null;
        }

        return Money::ofCents((int) $value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?int
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof Money) {
            return $value->cents;
        }

        if (is_int($value)) {
            return $value;
        }

        throw new InvalidArgumentException(
            "The [{$key}] attribute must be an App\\Support\\Money instance or an integer number of centavos."
        );
    }
}
