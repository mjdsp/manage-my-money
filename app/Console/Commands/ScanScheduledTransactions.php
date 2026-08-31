<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\ScheduledTransactionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Daily sweep for scheduled transactions. Schedules flagged "auto-post" are
 * posted to the ledger (catching up any missed months); everything else that
 * has entered its reminder window is just listed. The "Upcoming" list on the
 * dashboard remains a live query.
 */
class ScanScheduledTransactions extends Command
{
    protected $signature = 'finance:scan-scheduled {--as-of= : Pretend "today" is this date (YYYY-MM-DD)}';

    protected $description = 'Post due auto-post schedules and report the rest';

    public function handle(ScheduledTransactionService $service): int
    {
        $asOf = $this->option('as-of');
        $total = 0;
        $autoPosted = 0;

        User::query()->each(function (User $user) use ($service, $asOf, &$total, &$autoPosted) {
            $posted = $service->postDue($user, $asOf);

            if ($posted > 0) {
                $autoPosted += $posted;
                $this->line("{$user->email}: auto-posted {$posted} scheduled transaction(s)");
                Log::info('Scheduled-transaction auto-post', [
                    'user_id' => $user->id,
                    'count' => $posted,
                ]);
            }

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

        $this->info("Done. {$total} item(s) across all users, {$autoPosted} auto-posted.");

        return self::SUCCESS;
    }
}
