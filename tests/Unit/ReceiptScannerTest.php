<?php

use App\Services\ReceiptScanner;

function parseReceipt(string $text): array
{
    return (new ReceiptScanner)->parse($text);
}

it('pulls line items out of typical receipt text', function () {
    $rows = parseReceipt(<<<'TXT'
    SM Hypermarket
    Makati City
    ------------------------------
    2 Coke 1.5L            170.00
    Tasty Bread             55.00
    Eggs Medium x12        120.00
    3 @ 25.00 Lucky Me      75.00
    Rice 5kg            1,250.00
    ------------------------------
    SUBTOTAL           1,670.00
    VAT 12%              178.93
    TOTAL              1,670.00
    CASH               2,000.00
    CHANGE               330.00
    Thank you!
    TXT);

    expect($rows)->toHaveCount(5);

    expect($rows[0])->toMatchArray(['quantity' => 2, 'item_name' => 'Coke 1.5L', 'unit_price' => '170.00']);
    expect($rows[1])->toMatchArray(['quantity' => 1, 'item_name' => 'Tasty Bread', 'unit_price' => '55.00']);
    expect($rows[2])->toMatchArray(['quantity' => 12, 'item_name' => 'Eggs Medium', 'unit_price' => '120.00']);
    expect($rows[3])->toMatchArray(['quantity' => 3, 'item_name' => 'Lucky Me', 'unit_price' => '25.00']);
    expect($rows[4])->toMatchArray(['quantity' => 1, 'item_name' => 'Rice 5kg', 'unit_price' => '1250.00']);
});

it('returns nothing when there are no item-looking lines', function () {
    expect(parseReceipt("SUBTOTAL 100.00\nTOTAL 100.00\nTHANK YOU"))->toBe([]);
    expect(parseReceipt(''))->toBe([]);
});

it('ignores lines without a two-decimal amount', function () {
    expect(parseReceipt("Some heading text\nStore 123 Main St"))->toBe([]);
});
