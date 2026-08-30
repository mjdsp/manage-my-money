<?php

use App\Enums\TransactionType;
use App\Models\Account;
use App\Models\User;
use App\Services\LedgerService;

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
        'apr' => '9.5',
        'due_day_of_month' => 5,
        'scheduled_payment' => '12500',
    ])->assertRedirect();

    $loan = $this->user->accounts()->sole();

    expect($loan->starting_principal->cents)->toBe(30_000_000)
        ->and($loan->scheduled_payment_amount->cents)->toBe(1_250_000)
        ->and($loan->due_day_of_month)->toBe(5)
        ->and(app(LedgerService::class)->balance($loan)->cents)->toBe(30_000_000);
});

it('requires a due day for a liability', function () {
    $this->actingAs($this->user)->post(route('accounts.store'), [
        'name' => 'Loan', 'kind' => 'liability', 'opening_balance' => '1000',
    ])->assertSessionHasErrors('due_day_of_month');
});

it('archives an account', function () {
    $account = Account::factory()->for($this->user)->asset()->create();

    $this->actingAs($this->user)
        ->delete(route('accounts.destroy', $account))
        ->assertRedirect();

    expect($account->refresh()->is_archived)->toBeTrue();
});

it('forbids touching another user\'s account', function () {
    $theirs = Account::factory()->for(User::factory())->asset()->create();

    $this->actingAs($this->user)
        ->put(route('accounts.update', $theirs), ['name' => 'Hacked'])
        ->assertForbidden();
});
