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

    $this->bank = Account::factory()->for($this->user)->asset()->create(['name' => 'Bank']);
    $this->salary = Category::factory()->for($this->user)->income()->create(['name' => 'Salary']);
    $this->food = Category::factory()->for($this->user)->expense()->create(['name' => 'Food']);

    $this->ledger->post($this->user, [
        'type' => TransactionType::Income, 'amount' => Money::ofPesos('40000'),
        'date' => '2026-08-02', 'to_account_id' => $this->bank->id, 'category_id' => $this->salary->id,
    ]);
    $this->ledger->post($this->user, [
        'type' => TransactionType::Expense, 'amount' => Money::ofPesos('5000'),
        'date' => '2026-08-06', 'from_account_id' => $this->bank->id, 'category_id' => $this->food->id,
    ]);
});

it('renders the dashboard with computed data', function () {
    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->has('data.netPosition')
            ->has('data.thisMonth')
            ->has('data.spendingByCategory'));
});

it('builds a monthly report whose category totals reconcile with the summary', function () {
    $this->actingAs($this->user)
        ->get(route('reports.monthly', ['month' => '2026-08']))
        ->assertInertia(function ($page) {
            $page->component('Reports/Monthly')
                ->where('report.summary.income.cents', 4_000_000)
                ->where('report.summary.expense.cents', 500_000)
                ->where('report.summary.net.cents', 3_500_000);

            $spending = collect($page->toArray()['props']['report']['spendingByCategory']);
            expect($spending->sum('amount.cents'))->toBe(500_000);
        });
});

it('downloads the report as a PDF', function () {
    $response = $this->actingAs($this->user)
        ->get(route('reports.monthly.pdf', ['month' => '2026-08']));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf');
});
