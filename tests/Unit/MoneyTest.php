<?php

use App\Support\Money;

it('constructs from centavos and pesos', function () {
    expect(Money::ofCents(123_456)->cents)->toBe(123_456)
        ->and(Money::ofPesos(1234.56)->cents)->toBe(123_456)
        ->and(Money::ofPesos('1,234.56')->cents)->toBe(123_456)
        ->and(Money::ofPesos("\u{20B1}1,234.56")->cents)->toBe(123_456)
        ->and(Money::ofPesos('-42')->cents)->toBe(-4_200);
});

it('rounds pesos to the nearest centavo without float drift', function () {
    expect(Money::ofPesos('0.1')->plus(Money::ofPesos('0.2'))->cents)->toBe(30)
        ->and(Money::ofPesos(19.99)->cents)->toBe(1_999)
        ->and(Money::ofPesos('2.005')->cents)->toBe(201);
});

it('rejects non-numeric peso input', function () {
    Money::ofPesos('not money');
})->throws(InvalidArgumentException::class);

it('does exact arithmetic', function () {
    $sum = Money::ofCents(100)->plus(Money::ofCents(250))->minus(Money::ofCents(50));

    expect($sum->cents)->toBe(300)
        ->and($sum->negated()->cents)->toBe(-300)
        ->and($sum->negated()->abs()->cents)->toBe(300);
});

it('reports sign', function () {
    expect(Money::zero()->isZero())->toBeTrue()
        ->and(Money::ofCents(1)->isPositive())->toBeTrue()
        ->and(Money::ofCents(-1)->isNegative())->toBeTrue();
});

it('formats as pesos with grouping and two decimals', function () {
    expect(Money::ofCents(123_456)->formatted())->toBe("\u{20B1}1,234.56")
        ->and(Money::ofCents(0)->formatted())->toBe("\u{20B1}0.00")
        ->and(Money::ofCents(-99_900)->formatted())->toBe("-\u{20B1}999.00")
        ->and(Money::ofCents(5)->formatted())->toBe("\u{20B1}0.05");
});

it('serialises to json with cents, pesos and formatted string', function () {
    expect(Money::ofCents(123_456)->jsonSerialize())->toBe([
        'cents' => 123_456,
        'pesos' => 1234.56,
        'formatted' => "\u{20B1}1,234.56",
    ]);
});
