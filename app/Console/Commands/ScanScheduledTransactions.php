<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\ScheduledTransactionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Daily sweep for scheduled transactions that have entered their reminder
 * window. For the MVP this only surfaces a summary (the "Upcoming" list on the
 * dashboard is a live query); e-mail delivery hangs off the same loop later.
 */
class ScanScheduledTransactions extends Command
{
    protected $signature = 'finance:scan-scheduled {--as-of= : Pretend "today" is this date (YYYY-MM-DD)}';

    protected $description = 'Report scheduled transactions that are due or coming up soon';

    public function handle(ScheduledTransactionService $service): int
    {
        $asOf = $this->option('as-of');
        $total = 0;

        User::query()->each(function (User $user) use ($service, $asOf, &$total) {
            $due = $service->upcoming($user, $asOf);

            if ($due->isEmpty()) {
                return;
            }

            $total += $due->count();
            $this->line("{$user->email}: {$due->count()} scheduled payment(s) need attention");

            foreach ($due as $item) {
                $this->line(sprintf(
                    '  - %s  %s  due %s',
                    $item->description,
                    $item->amount->formatted(),
                    $item->next_due_date->toDateString(),
                ));
            }

            Log::info('Scheduled-transaction reminders', [
                'user_id' => $user->id,
                'count' => $due->count(),
            ]);
        });

        $this->info("Done. {$total} item(s) across all users.");

        return self::SUCCESS;
    }
}
