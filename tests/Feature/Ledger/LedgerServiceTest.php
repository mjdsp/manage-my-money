<?php

use App\Enums\TransactionType;
use App\Models\Account;
use App\Models\Category;
use App\Models\User;
use App\Services\LedgerService;
use App\Support\Money;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->ledger = app(LedgerService::class);
});

function assetAccount(User $user, string $name = 'Bank'): Account
{
    return Account::factory()->for($user)->asset()->create(['name' => $name]);
}

function liabilityAccount(User $user, string $name = 'Loan'): Account
{
    return Account::factory()->for($user)->liability()->create(['name' => $name]);
}

it('treats an account balance as the sum of its transactions', function () {
    $bank = assetAccount($this->user);

    $this->ledger->post($this->user, [
        'type' => TransactionType::Income, 'amount' => Money::ofPesos('20000'),
        'date' => '2026-08-01', 'to_account_id' => $bank->id,
    ]);
    $this->ledger->post($this->user, [
        'type' => TransactionType::Expense, 'amount' => Money::ofPesos('1500.50'),
        'date' => '2026-08-05', 'from_account_id' => $bank->id,
    ]);

    expect($this->ledger->balance($bank)->cents)->toBe(1_849_950);
});

it('records an opening balance as a one-sided adjustment', function () {
    $bank = assetAccount($this->user);
    $loan = liabilityAccount($this->user);

    $this->ledger->recordOpeningBalance($bank, Money::ofPesos('10000'));
    $this->ledger->recordOpeningBalance($loan, Money::ofPesos('300000'));

    expect($this->ledger->balance($bank)->formatted())->toBe("\u{20B1}10,000.00")
        ->and($this->ledger->balance($loan)->formatted())->toBe("\u{20B1}300,000.00")
        ->and($this->user->transactions()->where('type', TransactionType::Adjustment)->count())->toBe(2);
});

it('reduces the liability balance when a debt is repaid by transfer', function () {
    $bank = assetAccount($this->user);
    $loan = liabilityAccount($this->user);
    $this->ledger->recordOpeningBalance($bank, Money::ofPesos('50000'));
    $this->ledger->recordOpeningBalance($loan, Money::ofPesos('300000'));

    $this->ledger->post($this->user, [
        'type' => TransactionType::Transfer, 'amount' => Money::ofPesos('12500'),
        'date' => '2026-08-15', 'from_account_id' => $bank->id, 'to_account_id' => $loan->id,
        'description' => 'August payment',
    ]);

    expect($this->ledger->balance($bank)->cents)->toBe(3_750_000)
        ->and($this->ledger->balance($loan)->cents)->toBe(28_750_000);
});

it('rejects an income transaction that has a source account', function () {
    $bank = assetAccount($this->user);

    $this->ledger->post($this->user, [
        'type' => TransactionType::Income, 'amount' => Money::ofPesos('100'),
        'date' => '2026-08-01', 'from_account_id' => $bank->id,
    ]);
})->throws(InvalidArgumentException::class);

it('rejects a transfer between the same account', function () {
    $bank = assetAccount($this->user);

    $this->ledger->post($this->user, [
        'type' => TransactionType::Transfer, 'amount' => Money::ofPesos('100'),
        'date' => '2026-08-01', 'from_account_id' => $bank->id, 'to_account_id' => $bank->id,
    ]);
})->throws(InvalidArgumentException::class);

it('rejects a zero or negative amount', function () {
    $bank = assetAccount($this->user);

    $this->ledger->post($this->user, [
        'type' => TransactionType::Expense, 'amount' => Money::zero(),
        'date' => '2026-08-01', 'from_account_id' => $bank->id,
    ]);
})->throws(InvalidArgumentException::class);

it('refuses to use another user\'s account', function () {
    $mine = assetAccount($this->user);
    $theirs = assetAccount(User::factory()->create());

    $this->ledger->post($this->user, [
        'type' => TransactionType::Transfer, 'amount' => Money::ofPesos('100'),
        'date' => '2026-08-01', 'from_account_id' => $mine->id, 'to_account_id' => $theirs->id,
    ]);
})->throws(InvalidArgumentException::class);

it('refuses a category whose kind does not match the transaction type', function () {
    $bank = assetAccount($this->user);
    $incomeCategory = Category::factory()->for($this->user)->income()->create();

    $this->ledger->post($this->user, [
        'type' => TransactionType::Expense, 'amount' => Money::ofPesos('100'),
        'date' => '2026-08-01', 'from_account_id' => $bank->id, 'category_id' => $incomeCategory->id,
    ]);
})->throws(InvalidArgumentException::class);
