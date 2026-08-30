<?php

use App\Enums\TransactionType;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->bank = Account::factory()->for($this->user)->asset()->create(['name' => 'Bank']);
    $this->wallet = Account::factory()->for($this->user)->asset()->create(['name' => 'Wallet']);
    $this->food = Category::factory()->for($this->user)->expense()->create(['name' => 'Food']);
});

it('records an expense', function () {
    $this->actingAs($this->user)->post(route('transactions.store'), [
        'type' => 'expense',
        'amount' => '250.75',
        'date' => '2026-08-10',
        'from_account_id' => $this->bank->id,
        'category_id' => $this->food->id,
        'description' => 'Lunch',
    ])->assertRedirect();

    $txn = $this->user->transactions()->sole();
    expect($txn->type)->toBe(TransactionType::Expense)
        ->and($txn->amount->cents)->toBe(25_075)
        ->and($txn->category_id)->toBe($this->food->id);
});

it('records a transfer between two accounts', function () {
    $this->actingAs($this->user)->post(route('transactions.store'), [
        'type' => 'transfer',
        'amount' => '1000',
        'date' => '2026-08-11',
        'from_account_id' => $this->bank->id,
        'to_account_id' => $this->wallet->id,
    ])->assertRedirect();

    expect($this->user->transactions()->sole()->type)->toBe(TransactionType::Transfer);
});

it('rejects an expense with no source account', function () {
    $this->actingAs($this->user)->post(route('transactions.store'), [
        'type' => 'expense', 'amount' => '10', 'date' => '2026-08-10',
    ])->assertSessionHasErrors('from_account_id');
});

it('rejects an expense tagged with an income category', function () {
    $salary = Category::factory()->for($this->user)->income()->create(['name' => 'Salary']);

    $this->actingAs($this->user)->post(route('transactions.store'), [
        'type' => 'expense', 'amount' => '10', 'date' => '2026-08-10',
        'from_account_id' => $this->bank->id, 'category_id' => $salary->id,
    ])->assertSessionHasErrors('category_id');
});

it('will not use another user\'s account', function () {
    $theirs = Account::factory()->for(User::factory())->asset()->create();

    $this->actingAs($this->user)->post(route('transactions.store'), [
        'type' => 'expense', 'amount' => '10', 'date' => '2026-08-10',
        'from_account_id' => $theirs->id,
    ])->assertSessionHasErrors('from_account_id');
});

it('filters by month and type', function () {
    Transaction::factory()->for($this->user)->expense()->on('2026-08-05')
        ->state(['from_account_id' => $this->bank->id])->create();
    Transaction::factory()->for($this->user)->expense()->on('2026-07-05')
        ->state(['from_account_id' => $this->bank->id])->create();

    $this->actingAs($this->user)
        ->get(route('transactions.index', ['month' => '2026-08']))
        ->assertInertia(fn ($page) => $page->has('transactions.data', 1));
});

it('edits and deletes a transaction', function () {
    $txn = Transaction::factory()->for($this->user)->expense()
        ->state(['from_account_id' => $this->bank->id])->create();

    $this->actingAs($this->user)->put(route('transactions.update', $txn), [
        'type' => 'expense', 'amount' => '99', 'date' => '2026-08-12',
        'from_account_id' => $this->bank->id,
    ])->assertRedirect();

    expect($txn->refresh()->amount->cents)->toBe(9_900);

    $this->actingAs($this->user)->delete(route('transactions.destroy', $txn))->assertRedirect();
    expect(Transaction::find($txn->id))->toBeNull();
});
