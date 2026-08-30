<?php

use App\Console\Commands\ScanScheduledTransactions;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(ScanScheduledTransactions::class)
    ->dailyAt(config('finance.scan_time'))
    ->timezone(config('app.timezone'));
