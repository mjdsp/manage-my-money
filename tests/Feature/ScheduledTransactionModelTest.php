<?php

use App\Models\ScheduledTransaction;

function scheduled(array $attributes): ScheduledTransaction
{
    return new ScheduledTransaction($attributes);
}

it('advances the due date by one month', function () {
    $st = scheduled(['day_of_month' => 15, 'next_due_date' => '2026-01-15']);

    $st->advanceDueDate();

    expect($st->next_due_date->toDateString())->toBe('2026-02-15');
});

it('clamps the day of month to the length of the target month', function () {
    $st = scheduled(['day_of_month' => 31, 'next_due_date' => '2026-01-31']);

    $st->advanceDueDate();
    expect($st->next_due_date->toDateString())->toBe('2026-02-28'); // 2026 is not a leap year

    $st->advanceDueDate();
    expect($st->next_due_date->toDateString())->toBe('2026-03-31'); // original day restored when it fits
});

it('restores the requested day after a short month', function () {
    $st = scheduled(['day_of_month' => 30, 'next_due_date' => '2028-01-30']);

    $st->advanceDueDate(); // Feb 2028 is a leap year -> 29 days
    expect($st->next_due_date->toDateString())->toBe('2028-02-29');

    $st->advanceDueDate();
    expect($st->next_due_date->toDateString())->toBe('2028-03-30');
});

it('uses the configured default lead time unless overridden', function () {
    config()->set('finance.reminder_lead_days', 3);

    $default = scheduled(['lead_time_days' => null, 'next_due_date' => '2026-06-10']);
    $override = scheduled(['lead_time_days' => 7, 'next_due_date' => '2026-06-10']);

    expect($default->effectiveLeadDays())->toBe(3)
        ->and($default->remindOn()->toDateString())->toBe('2026-06-07')
        ->and($override->effectiveLeadDays())->toBe(7)
        ->and($override->remindOn()->toDateString())->toBe('2026-06-03');
});
