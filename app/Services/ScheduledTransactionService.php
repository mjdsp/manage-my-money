<?php

namespace App\Services;

use App\Models\ScheduledTransaction;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ScheduledTransactionService
{
    public function __construct(private readonly LedgerService $ledger) {}

    /**
     * Active schedules for a user that have entered their reminder window
     * (including any that are already overdue), soonest due first.
     *
     * @return Collection<int, ScheduledTransaction>
     */
    public function upcoming(User $user, Carbon|string|null $asOf = null): Collection
    {
        $asOf = $asOf ? Carbon::parse($asOf) : Carbon::now();

        return $user->scheduledTransactions()
            ->active()
            ->with(['category:id,name,kind', 'fromAccount:id,name', 'toAccount:id,name'])
            ->orderBy('next_due_date')
            ->get()
            ->filter(fn (ScheduledTransaction $st) => $st->remindOn()->lessThanOrEqualTo($asOf))
            ->values();
    }

    /**
     * Post the current cycle to the ledger, then roll the schedule forward one
     * month. Returns the transaction that was created.
     */
    public function post(ScheduledTransaction $scheduled, Carbon|string|null $date = null): Transaction
    {
        return DB::transaction(function () use ($scheduled, $date) {
            $transaction = $this->ledger->post($scheduled->user, [
                'type' => $scheduled->type,
                'amount' => $scheduled->amount,
                'date' => $date ? Carbon::parse($date)->toDateString() : $scheduled->next_due_date->toDateString(),
                'description' => $scheduled->description,
                'category_id' => $scheduled->category_id,
                'from_account_id' => $scheduled->from_account_id,
                'to_account_id' => $scheduled->to_account_id,
                'scheduled_transaction_id' => $scheduled->id,
            ]);

            $scheduled->last_posted_at = now();
            $scheduled->advanceDueDate();
            $scheduled->save();

            return $transaction;
        });
    }

    /**
     * Roll the schedule forward one month without posting anything.
     */
    public function skip(ScheduledTransaction $scheduled): void
    {
        $scheduled->advanceDueDate();
        $scheduled->save();
    }
}
