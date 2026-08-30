<?php

use App\Models\Account;
use App\Models\ScheduledTransaction;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->bank = Account::factory()->for($this->user)->asset()->create();
    config()->set('finance.reminder_lead_days', 3);
});

function schedule(User $user, Account $bank, string $due, ?int $lead = null): ScheduledTransaction
{
    return ScheduledTransaction::factory()->for($user)->create([
        'from_account_id' => $bank->id,
        'to_account_id' => null,
        'next_due_date' => $due,
        'day_of_month' => (int) substr($due, 8, 2),
        'lead_time_days' => $lead,
    ]);
}

it('lists a schedule once it is inside the default lead window', function () {
    schedule($this->user, $this->bank, '2026-06-10'); // lead 3 => window opens 2026-06-07

    $this->artisan('finance:scan-scheduled --as-of=2026-06-08')
        ->expectsOutputToContain('1 item(s)')
        ->assertSuccessful();
});

it('ignores a schedule still outside the lead window', function () {
    schedule($this->user, $this->bank, '2026-06-10');

    $this->artisan('finance:scan-scheduled --as-of=2026-06-05')
        ->expectsOutputToContain('0 item(s)')
        ->assertSuccessful();
});

it('honours a per-schedule lead-time override', function () {
    schedule($this->user, $this->bank, '2026-06-10', lead: 7);

    $this->artisan('finance:scan-scheduled --as-of=2026-06-04')
        ->expectsOutputToContain('1 item(s)')
        ->assertSuccessful();
});

it('skips inactive schedules', function () {
    schedule($this->user, $this->bank, '2026-06-10')->update(['is_active' => false]);

    $this->artisan('finance:scan-scheduled --as-of=2026-06-09')
        ->expectsOutputToContain('0 item(s)')
        ->assertSuccessful();
});
