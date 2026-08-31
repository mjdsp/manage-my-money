<?php

namespace App\Http\Controllers;

use App\Enums\AccountKind;
use App\Enums\TransactionType;
use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
use App\Models\ScheduledTransaction;
use App\Services\LedgerService;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function __construct(private readonly LedgerService $ledger) {}

    public function index(Request $request): Response
    {
        $accounts = $request->user()->accounts()
            ->orderBy('is_archived')
            ->orderBy('kind')
            ->orderBy('name')
            ->get()
            ->map(fn (Account $account) => [
                ...$account->only([
                    'id', 'name', 'kind', 'is_archived', 'bank_name', 'interest_rate',
                    'lender', 'monthly_interest_rate', 'due_day_of_month', 'term_months',
                ]),
                'borrowed_on' => $account->borrowed_on?->toDateString(),
                'scheduled_payment_amount' => $account->scheduled_payment_amount,
                'total_repayment' => $account->total_repayment,
                'starting_principal' => $account->starting_principal,
                'balance' => $this->ledger->balance($account),
                'in_use' => $this->hasActivity($account),
            ]);

        return Inertia::render('Accounts/Index', [
            'accounts' => $accounts,
        ]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $kind = AccountKind::from($data['kind']);
        $hasPlan = $kind->hasRepaymentPlan();
        $isReceivable = $kind === AccountKind::Receivable;
        $opening = Money::ofPesos($data['opening_balance'] ?? 0);

        $account = $request->user()->accounts()->create([
            'name' => $data['name'],
            'kind' => $data['kind'],
            'bank_name' => $hasPlan ? null : ($data['bank_name'] ?? null),
            'interest_rate' => $hasPlan ? null : ($data['interest_rate'] ?? null),
            'lender' => $hasPlan ? ($data['lender'] ?? null) : null,
            'borrowed_on' => $isReceivable ? ($data['borrowed_on'] ?? null) : null,
            'monthly_interest_rate' => $hasPlan ? ($data['monthly_interest_rate'] ?? null) : null,
            'due_day_of_month' => $hasPlan ? ($data['due_day_of_month'] ?? null) : null,
            'term_months' => $hasPlan ? ($data['term_months'] ?? null) : null,
            'scheduled_payment_amount' => $hasPlan && isset($data['scheduled_payment'])
                ? Money::ofPesos($data['scheduled_payment'])
                : null,
            'total_repayment' => $hasPlan && isset($data['total_repayment'])
                ? Money::ofPesos($data['total_repayment'])
                : null,
            'starting_principal' => $hasPlan ? $opening : null,
        ]);

        $this->ledger->recordOpeningBalance($account, $opening);

        return to_route('accounts.index')->with('status', "Account “{$account->name}” created.");
    }

    public function update(UpdateAccountRequest $request, Account $account): RedirectResponse
    {
        abort_unless($account->user_id === $request->user()->id, 403);

        $data = $request->validated();
        $hasPlan = $account->hasRepaymentPlan();
        $isReceivable = $account->isReceivable();

        $account->update([
            'name' => $data['name'],
            'is_archived' => $data['is_archived'] ?? $account->is_archived,
            'bank_name' => $hasPlan ? null : ($data['bank_name'] ?? null),
            'interest_rate' => $hasPlan ? null : ($data['interest_rate'] ?? null),
            'lender' => $hasPlan ? ($data['lender'] ?? null) : null,
            'borrowed_on' => $isReceivable ? ($data['borrowed_on'] ?? null) : null,
            'monthly_interest_rate' => $hasPlan ? ($data['monthly_interest_rate'] ?? null) : null,
            'due_day_of_month' => $hasPlan ? ($data['due_day_of_month'] ?? null) : null,
            'term_months' => $hasPlan ? ($data['term_months'] ?? $account->term_months) : null,
            'scheduled_payment_amount' => $hasPlan && isset($data['scheduled_payment'])
                ? Money::ofPesos($data['scheduled_payment'])
                : $account->scheduled_payment_amount,
            'total_repayment' => $hasPlan && isset($data['total_repayment'])
                ? Money::ofPesos($data['total_repayment'])
                : $account->total_repayment,
        ]);

        return to_route('accounts.index')->with('status', "Account “{$account->name}” updated.");
    }

    public function archive(Request $request, Account $account): RedirectResponse
    {
        abort_unless($account->user_id === $request->user()->id, 403);

        $account->update(['is_archived' => true]);

        return to_route('accounts.index')->with('status', "Account “{$account->name}” archived.");
    }

    public function restore(Request $request, Account $account): RedirectResponse
    {
        abort_unless($account->user_id === $request->user()->id, 403);

        $account->update(['is_archived' => false]);

        return to_route('accounts.index')->with('status', "Account “{$account->name}” restored.");
    }

    /**
     * Permanently delete an account. Only allowed when nothing but its opening
     * balance is attached — any real transaction or schedule means the user
     * should archive instead, so the ledger history stays intact.
     */
    public function destroy(Request $request, Account $account): RedirectResponse
    {
        abort_unless($account->user_id === $request->user()->id, 403);

        if ($this->hasActivity($account)) {
            return to_route('accounts.index')->with(
                'error',
                "“{$account->name}” has transactions or scheduled payments linked to it. Archive it instead."
            );
        }

        // The opening-balance adjustment is removed by the database FK cascade.
        $account->delete();

        return to_route('accounts.index')->with('status', "Account “{$account->name}” deleted.");
    }

    /**
     * Whether the account has any real activity (anything beyond the opening
     * balance adjustment): a manual transaction, a posted transfer, or a
     * scheduled transaction that points at it.
     */
    private function hasActivity(Account $account): bool
    {
        $realTransactions = fn ($query) => $query->where('type', '!=', TransactionType::Adjustment->value);

        return $account->outgoingTransactions()->where($realTransactions)->exists()
            || $account->incomingTransactions()->where($realTransactions)->exists()
            || ScheduledTransaction::query()
                ->where('user_id', $account->user_id)
                ->where(fn ($query) => $query
                    ->where('from_account_id', $account->id)
                    ->orWhere('to_account_id', $account->id))
                ->exists();
    }
}
