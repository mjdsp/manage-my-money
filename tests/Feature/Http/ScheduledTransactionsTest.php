<?php

use App\Models\Account;
use App\Models\ScheduledTransaction;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->bank = Account::factory()->for($this->user)->asset()->create();
});

it('creates a scheduled expense', function () {
    $this->actingAs($this->user)->post(route('scheduled-transactions.store'), [
        'description' => 'Rent',
        'type' => 'expense',
        'amount' => '15000',
        'day_of_month' => 1,
        'next_due_date' => '2026-09-01',
        'from_account_id' => $this->bank->id,
    ])->assertRedirect();

    expect($this->user->scheduledTransactions()->sole()->description)->toBe('Rent');
});

it('posts a due schedule to the ledger and rolls it forward', function () {
    $st = ScheduledTransaction::factory()->for($this->user)->create([
        'from_account_id' => $this->bank->id,
        'to_account_id' => null,
        'day_of_month' => 1,
        'next_due_date' => '2026-09-01',
    ]);

    $this->actingAs($this->user)
        ->post(route('scheduled-transactions.post', $st))
        ->assertRedirect();

    $st->refresh();
    expect($this->user->transactions()->where('scheduled_transaction_id', $st->id)->count())->toBe(1)
        ->and($st->next_due_date->toDateString())->toBe('2026-10-01')
        ->and($st->last_posted_at)->not->toBeNull();
});

it('skips a schedule without posting', function () {
    $st = ScheduledTransaction::factory()->for($this->user)->create([
        'from_account_id' => $this->bank->id,
        'to_account_id' => null,
        'day_of_month' => 15,
        'next_due_date' => '2026-09-15',
    ]);

    $this->actingAs($this->user)
        ->post(route('scheduled-transactions.skip', $st))
        ->assertRedirect();

    expect($this->user->transactions()->count())->toBe(0)
        ->and($st->refresh()->next_due_date->toDateString())->toBe('2026-10-15');
});

it('forbids posting another user\'s schedule', function () {
    $st = ScheduledTransaction::factory()->for(User::factory())->create();

    $this->actingAs($this->user)
        ->post(route('scheduled-transactions.post', $st))
        ->assertForbidden();
});
