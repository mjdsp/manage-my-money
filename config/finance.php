<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    |
    | The application is single-currency: the Philippine peso. This is here for
    | display purposes only; there is no conversion logic anywhere.
    |
    */

    'currency' => 'PHP',
    'currency_symbol' => "\u{20B1}",

    /*
    |--------------------------------------------------------------------------
    | Reminder lead time
    |--------------------------------------------------------------------------
    |
    | Default number of days before a scheduled transaction's due date that it
    | starts showing up in the "Upcoming" list. Individual debts may override
    | this with their own lead time.
    |
    */

    'reminder_lead_days' => (int) env('FINANCE_REMINDER_LEAD_DAYS', 3),

    /*
    |--------------------------------------------------------------------------
    | Scheduled-transaction scan time
    |--------------------------------------------------------------------------
    |
    | Local time of day the daily scan runs (see routes/console.php). The app
    | timezone is Asia/Manila.
    |
    */

    'scan_time' => env('FINANCE_SCAN_TIME', '08:00'),

];
