<?php

namespace App\Services;

use App\Enums\AccountKind;
use App\Enums\TransactionType;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ReportService
{
    public function __construct(
        private readonly LedgerService $ledger,
        private readonly ScheduledTransactionService $scheduled,
    ) {}

    /**
     * Everything the dashboard needs for a given month (defaults to now).
     *
     * @return array<string, mixed>
     */
    public function dashboard(User $user, ?Carbon $month = null): array
    {
        $month = ($month ?? Carbon::now())->copy()->startOfMonth();
        $lastMonth = $month->copy()->subMonthNoOverflow();

        $accounts = $user->accounts()->active()->orderBy('kind')->orderBy('name')->get();

        $assets = $this->sumBalances($accounts->where('kind', AccountKind::Asset));
        $receivables = $this->sumBalances($accounts->where('kind', AccountKind::Receivable));
        $liabilities = $this->sumBalances($accounts->where('kind', AccountKind::Liability));

        return [
            'month' => $month->format('Y-m'),
            'netPosition' => [
                'assets' => $assets,
                // Tracked and shown, but NOT part of net worth — an unpaid debt
                // owed to you only counts once it lands in a real account.
                'receivables' => $receivables,
                'liabilities' => $liabilities,
                'net' => $assets->minus($liabilities),
            ],
            'thisMonth' => $this->incomeExpense($user, $month),
            'lastMonth' => $this->incomeExpense($user, $lastMonth),
            'spendingByCategory' => $this->byCategory($user, $month, TransactionType::Expense),
            'upcoming' => $this->scheduled->upcoming($user)
                ->take(10)
                ->map(fn ($st) => [
                    'id' => $st->id,
                    'description' => $st->description,
                    'amount' => $st->amount,
                    'type' => $st->type,
                    'next_due_date' => $st->next_due_date->toDateString(),
                    'is_overdue' => $st->next_due_date->isPast(),
                ])->values(),
            'accounts' => $accounts->map(fn (Account $account) => [
                'id' => $account->id,
                'name' => $account->name,
                'kind' => $account->kind,
                'balance' => $this->ledger->balance($account),
                'payoff' => $account->hasRepaymentPlan() ? $this->payoff($account) : null,
            ])->values(),
        ];
    }

    /**
     * The monthly report data structure (six sections).
     *
     * @return array<string, mixed>
     */
    public function monthly(User $user, Carbon $month): array
    {
        $month = $month->copy()->startOfMonth();
        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();

        $incomeExpense = $this->incomeExpense($user, $month);
        $savingsAccounts = $user->accounts()
            ->where('kind', AccountKind::Asset)
            ->whereNotNull('interest_rate')
            ->orderBy('name')
            ->get();

        return [
            'month' => $month->format('Y-m'),
            'monthLabel' => $month->format('F Y'),
            'generatedAt' => Carbon::now()->toDayDateTimeString(),
            'summary' => [
                'income' => $incomeExpense['income'],
                'expense' => $incomeExpense['expense'],
                'net' => $incomeExpense['net'],
                'saved' => $this->netInto($user, $savingsAccounts->pluck('id')->all(), $start, $end),
                'interest' => $this->interestReceived($user, $start, $end),
                'netWorthStart' => $this->netWorth($user, $start->copy()->subDay()),
                'netWorthEnd' => $this->netWorth($user, $end),
            ],
            'spendingByCategory' => $this->byCategory($user, $month, TransactionType::Expense),
            'incomeByCategory' => $this->byCategory($user, $month, TransactionType::Income),
            'savings' => $savingsAccounts->map(fn (Account $account) => [
                'name' => $account->name,
                'opening' => $this->ledger->balance($account, $start->copy()->subDay()),
                'contributions' => $this->netInto($user, [$account->id], $start, $end),
                'interest' => $this->interestReceived($user, $start, $end, $account->id),
                'closing' => $this->ledger->balance($account, $end),
            ])->values(),
            'transactionsByCategory' => $this->transactionsByCategory($user, $start, $end),
        ];
    }

    /** @param Collection<int, Account> $accounts */
    private function sumBalances(Collection $accounts): Money
    {
        return $accounts->reduce(
            fn (Money $carry, Account $account) => $carry->plus($this->ledger->balance($account)),
            Money::zero(),
        );
    }

    /**
     * @return array{income: Money, expense: Money, net: Money}
     */
    private function incomeExpense(User $user, Carbon $month): array
    {
        $rows = $user->transactions()
            ->selectRaw('type, SUM(amount) as total')
            ->whereBetween('date', [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()])
            ->whereIn('type', [TransactionType::Income->value, TransactionType::Expense->value])
            ->groupBy('type')
            ->pluck('total', 'type');

        $income = Money::ofCents((int) ($rows[TransactionType::Income->value] ?? 0));
        $expense = Money::ofCents((int) ($rows[TransactionType::Expense->value] ?? 0));

        return ['income' => $income, 'expense' => $expense, 'net' => $income->minus($expense)];
    }

    /**
     * @return Collection<int, array{name: string, amount: Money, pct: float}>
     */
    private function byCategory(User $user, Carbon $month, TransactionType $type): Collection
    {
        $rows = $user->transactions()
            ->with('category:id,name')
            ->select('category_id')
            ->selectRaw('SUM(amount) as total')
            ->where('type', $type)
            ->whereBetween('date', [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()])
            ->groupBy('category_id')
            ->get();

        $grandTotal = max(1, (int) $rows->sum('total'));

        return $rows
            ->map(fn ($row) => [
                'name' => $row->category?->name ?? 'Uncategorised',
                'amount' => Money::ofCents((int) $row->total),
                'pct' => round(((int) $row->total) / $grandTotal * 100, 1),
            ])
            ->sortByDesc(fn ($row) => $row['amount']->cents)
            ->values();
    }

    /**
     * Net movement into a set of accounts over a date range (in minus out).
     * Adjustments (opening balances, corrections) are setup, not activity, so
     * they are excluded — this is "how much did you actually put in".
     *
     * @param  list<int>  $accountIds
     */
    private function netInto(User $user, array $accountIds, Carbon $start, Carbon $end): Money
    {
        if ($accountIds === []) {
            return Money::zero();
        }

        $base = $user->transactions()
            ->where('type', '!=', TransactionType::Adjustment->value)
            ->whereBetween('date', [$start, $end]);

        $in = (int) (clone $base)->whereIn('to_account_id', $accountIds)->sum('amount');
        $out = (int) (clone $base)->whereIn('from_account_id', $accountIds)->sum('amount');

        return Money::ofCents($in - $out);
    }

    private function interestReceived(User $user, Carbon $start, Carbon $end, ?int $toAccountId = null): Money
    {
        $cents = (int) $user->transactions()
            ->where('type', TransactionType::Income)
            ->whereBetween('date', [$start, $end])
            ->when($toAccountId, fn ($q) => $q->where('to_account_id', $toAccountId))
            ->whereHas('category', fn ($q) => $q->where('name', 'Interest'))
            ->sum('amount');

        return Money::ofCents($cents);
    }

    private function netWorth(User $user, Carbon $asOf): Money
    {
        return $user->accounts()->get()->reduce(function (Money $carry, Account $account) use ($asOf) {
            // A receivable is money you're still waiting on — it counts only
            // once it has actually been repaid into an asset account.
            if ($account->isReceivable()) {
                return $carry;
            }

            $balance = $this->ledger->balance($account, $asOf);

            return $account->isLiability() ? $carry->minus($balance) : $carry->plus($balance);
        }, Money::zero());
    }

    /**
     * Progress toward clearing a debt. The target is the total amount to be
     * paid (principal + interest) when that is set, otherwise just the starting
     * principal. "original" is that target, "owed" is what is still left on it.
     *
     * @return array{original: Money, owed: Money, paid: Money, pct: float}
     */
    private function payoff(Account $account): array
    {
        $principal = $account->starting_principal ?? Money::zero();
        $target = $account->total_repayment ?? $principal;

        // Every repayment is a transfer against the account, so the difference
        // between the opening principal and the current principal-side balance
        // is how much has been paid in so far.
        $paid = $principal->minus($this->ledger->balance($account));
        $owed = $paid->cents >= $target->cents ? Money::zero() : $target->minus($paid);

        $pct = $target->isPositive()
            ? round(max(0, min(100, $paid->cents / $target->cents * 100)), 1)
            : 0.0;

        return ['original' => $target, 'owed' => $owed, 'paid' => $paid, 'pct' => $pct];
    }

    /**
     * @return Collection<int, array{name: string, total: Money, transactions: Collection<int, array<string, mixed>>}>
     */
    private function transactionsByCategory(User $user, Carbon $start, Carbon $end): Collection
    {
        return $user->transactions()
            ->with(['category:id,name', 'fromAccount:id,name', 'toAccount:id,name'])
            ->where('type', '!=', TransactionType::Adjustment->value)
            ->whereBetween('date', [$start, $end])
            ->orderBy('date')
            ->orderBy('id')
            ->get()
            ->groupBy(fn (Transaction $t) => $t->category?->name ?? ucfirst($t->type->value))
            ->map(fn (Collection $group, string $name) => [
                'name' => $name,
                'total' => Money::ofCents((int) $group->sum(fn (Transaction $t) => $t->amount->cents)),
                'transactions' => $group->map(fn (Transaction $t) => [
                    'date' => $t->date->toDateString(),
                    'description' => $t->description,
                    'type' => $t->type->value,
                    'amount' => $t->amount,
                    'from' => $t->fromAccount?->name,
                    'to' => $t->toAccount?->name,
                ])->values(),
            ])
            ->sortKeys()
            ->values();
    }
}
