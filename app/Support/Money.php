<?php

namespace App\Support;

use App\Casts\MoneyCast;
use Illuminate\Contracts\Database\Eloquent\Castable;
use InvalidArgumentException;
use JsonSerializable;
use Stringable;

/**
 * An immutable amount of money, stored internally as an integer number of
 * centavos to keep arithmetic exact. The application currency is the
 * Philippine peso; there is deliberately no multi-currency support.
 */
final readonly class Money implements Castable, JsonSerializable, Stringable
{
    public function __construct(public int $cents) {}

    public static function ofCents(int $cents): self
    {
        return new self($cents);
    }

    public static function zero(): self
    {
        return new self(0);
    }

    /**
     * Build from a peso amount entered by a human: accepts 1234.5, "1,234.56",
     * "₱1,234.56", "-1234". Rounds half away from zero to the nearest centavo,
     * using string math so values like "2.005" are not lost to float drift.
     */
    public static function ofPesos(int|float|string $pesos): self
    {
        $clean = is_string($pesos)
            ? preg_replace('/[^0-9.\-]/', '', $pesos)
            : rtrim(rtrim(number_format((float) $pesos, 6, '.', ''), '0'), '.');

        if ($clean === '' || $clean === '-' || $clean === '.' || ! is_numeric($clean)) {
            throw new InvalidArgumentException("Not a valid peso amount: {$pesos}");
        }

        $negative = str_starts_with($clean, '-');
        [$whole, $fraction] = array_pad(explode('.', ltrim($clean, '-'), 2), 2, '');

        // Keep three fractional digits, then round the third into the centavos.
        $fraction = substr(str_pad($fraction, 3, '0'), 0, 3);
        $cents = (int) $whole * 100
            + (int) substr($fraction, 0, 2)
            + (int) ($fraction[2] >= '5' ? 1 : 0);

        return new self($negative ? -$cents : $cents);
    }

    public function pesos(): float
    {
        return $this->cents / 100;
    }

    public function plus(self $other): self
    {
        return new self($this->cents + $other->cents);
    }

    public function minus(self $other): self
    {
        return new self($this->cents - $other->cents);
    }

    public function negated(): self
    {
        return new self(-$this->cents);
    }

    public function abs(): self
    {
        return new self(abs($this->cents));
    }

    public function isZero(): bool
    {
        return $this->cents === 0;
    }

    public function isNegative(): bool
    {
        return $this->cents < 0;
    }

    public function isPositive(): bool
    {
        return $this->cents > 0;
    }

    public function equals(self $other): bool
    {
        return $this->cents === $other->cents;
    }

    /**
     * e.g. "₱1,234.56" or "-₱1,234.56".
     */
    public function formatted(): string
    {
        $sign = $this->cents < 0 ? '-' : '';
        $pesos = number_format(abs($this->cents) / 100, 2, '.', ',');

        return "{$sign}\u{20B1}{$pesos}";
    }

    public function __toString(): string
    {
        return $this->formatted();
    }

    /**
     * @return array{cents: int, pesos: float, formatted: string}
     */
    public function jsonSerialize(): array
    {
        return [
            'cents' => $this->cents,
            'pesos' => $this->pesos(),
            'formatted' => $this->formatted(),
        ];
    }

    public static function castUsing(array $arguments): string
    {
        return MoneyCast::class;
    }
}
