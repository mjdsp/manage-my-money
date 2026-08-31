<?php

use App\Enums\TransactionType;
use App\Models\Account;
use App\Models\User;
use App\Services\LedgerService;
use App\Support\Money;

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('requires authentication', function () {
    $this->get(route('accounts.index'))->assertRedirect(route('login'));
});

it('lists the current user\'s accounts only', function () {
    Account::factory()->for($this->user)->asset()->create(['name' => 'Mine']);
    Account::factory()->for(User::factory())->asset()->create(['name' => 'Theirs']);

    $this->actingAs($this->user)
        ->get(route('accounts.index'))
        ->assertInertia(fn ($page) => $page
            ->component('Accounts/Index')
            ->has('accounts', 1)
            ->where('accounts.0.name', 'Mine'));
});

it('creates an asset account and records the opening balance', function () {
    $this->actingAs($this->user)->post(route('accounts.store'), [
        'name' => 'BPI Savings',
        'kind' => 'asset',
        'opening_balance' => '15000.50',
        'bank_name' => 'BPI',
        'interest_rate' => '2.5',
    ])->assertRedirect(route('accounts.index'));

    $account = $this->user->accounts()->sole();

    expect($account->name)->toBe('BPI Savings')
        ->and($account->bank_name)->toBe('BPI')
        ->and($this->user->transactions()->where('type', TransactionType::Adjustment)->count())->toBe(1)
        ->and(app(LedgerService::class)->balance($account)->cents)->toBe(1_500_050);
});

it('creates a liability with a starting principal and due day', function () {
    $this->actingAs($this->user)->post(route('accounts.store'), [
        'name' => 'Car Loan',
        'kind' => 'liability',
        'opening_balance' => '300000',
        'lender' => 'Toyota Financial',
        'monthly_interest_rate' => '2.5',
        'due_day_of_month' => 5,
        'term_months' => 12,
        'scheduled_payment' => '12500',
        'total_repayment' => '390000',
    ])->assertRedirect();

    $loan = $this->user->accounts()->sole();

    expect($loan->starting_principal->cents)->toBe(30_000_000)
        ->and($loan->scheduled_payment_amount->cents)->toBe(1_250_000)
        ->and($loan->due_day_of_month)->toBe(5)
        ->and($loan->term_months)->toBe(12)
        ->and($loan->total_repayment->cents)->toBe(39_000_000)
        ->and((float) $loan->monthly_interest_rate)->toBe(2.5)
        ->and(app(LedgerService::class)->balance($loan)->cents)->toBe(30_000_000);
});

it('requires a due day for a liability', function () {
    $this->actingAs($this->user)->post(route('accounts.store'), [
        'name' => 'Loan', 'kind' => 'liability', 'opening_balance' => '1000',
    ])->assertSessionHasErrors('due_day_of_month');
});

it('creates a receivable but keeps it out of net worth until repaid', function () {
    $ledger = app(LedgerService::class);

    Account::factory()->for($this->user)->asset()->create(); // some cash on hand

    $this->actingAs($this->user)->post(route('accounts.store'), [
        'name' => 'Cousin Jun',
        'kind' => 'receivable',
        'opening_balance' => '250000',
        'lender' => 'Jun Dela Cruz',
        'borrowed_on' => '2026-05-14',
        'term_months' => 10,
    ])->assertRedirect(route('accounts.index'));

    $receivable = $this->user->accounts()->where('kind', 'receivable')->sole();

    // Positive balance = amount still owed TO the user.
    expect($receivable->starting_principal->cents)->toBe(25_000_000)
        ->and($ledger->balance($receivable)->cents)->toBe(25_000_000)
        ->and($receivable->lender)->toBe('Jun Dela Cruz')
        ->and($receivable->borrowed_on->toDateString())->toBe('2026-05-14');

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('data.netPosition.receivables.cents', 25_000_000) // shown
            ->where('data.netPosition.net.cents', 0));                // but not in net worth
});

it('folds a receivable repayment into net worth as it lands in cash', function () {
    $ledger = app(LedgerService::class);
    $bank = Account::factory()->for($this->user)->asset()->create();
    $receivable = Account::factory()->for($this->user)->receivable()->create();
    $ledger->recordOpeningBalance($receivable, Money::ofPesos('100000'), '2026-08-01');
    $ledger->post($this->user, [
        'type' => TransactionType::Transfer,
        'amount' => Money::ofPesos('40000'),
        'date' => '2026-08-20',
        'from_account_id' => $receivable->id,
        'to_account_id' => $bank->id,
    ]);

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('data.netPosition.net.cents', 4_000_000)           // the ₱40k that was repaid into cash
            ->where('data.netPosition.receivables.cents', 6_000_000)); // ₱60k still outstanding
});

it('repaying a receivable moves money into cash and shrinks the balance', function () {
    $ledger = app(LedgerService::class);
    $bank = Account::factory()->for($this->user)->asset()->create();
    $receivable = Account::factory()->for($this->user)->receivable()->create();
    $ledger->recordOpeningBalance($receivable, Money::ofPesos('100000'), '2026-08-01');

    $ledger->post($this->user, [
        'type' => TransactionType::Transfer,
        'amount' => Money::ofPesos('30000'),
        'date' => '2026-08-20',
        'from_account_id' => $receivable->id,
        'to_account_id' => $bank->id,
    ]);

    expect($ledger->balance($receivable)->cents)->toBe(7_000_000)
        ->and($ledger->balance($bank)->cents)->toBe(3_000_000);
});

it('archives and restores an account', function () {
    $account = Account::factory()->for($this->user)->asset()->create();

    $this->actingAs($this->user)
        ->patch(route('accounts.archive', $account))
        ->assertRedirect();

    expect($account->refresh()->is_archived)->toBeTrue();

    $this->actingAs($this->user)
        ->patch(route('accounts.restore', $account))
        ->assertRedirect();

    expect($account->refresh()->is_archived)->toBeFalse();
});

it('permanently deletes an account that has only its opening balance', function () {
    $this->actingAs($this->user)->post(route('accounts.store'), [
        'name' => 'Petty Cash',
        'kind' => 'asset',
        'opening_balance' => '500',
    ])->assertRedirect();

    $account = $this->user->accounts()->sole();

    $this->actingAs($this->user)
        ->delete(route('accounts.destroy', $account))
        ->assertRedirect()
        ->assertSessionHas('status');

    expect(Account::find($account->id))->toBeNull()
        ->and($this->user->transactions()->count())->toBe(0);
});

it('refuses to delete an account that has real transactions', function () {
    $account = Account::factory()->for($this->user)->asset()->create();
    $other = Account::factory()->for($this->user)->asset()->create();

    app(LedgerService::class)->post($this->user, [
        'type' => TransactionType::Transfer,
        'amount' => 10_00,
        'date' => now(),
        'from_account_id' => $account->id,
        'to_account_id' => $other->id,
    ]);

    $this->actingAs($this->user)
        ->delete(route('accounts.destroy', $account))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(Account::find($account->id))->not->toBeNull();
});

it('forbids touching another user\'s account', function () {
    $theirs = Account::factory()->for(User::factory())->asset()->create();

    $this->actingAs($this->user)
        ->put(route('accounts.update', $theirs), ['name' => 'Hacked'])
        ->assertForbidden();
});
