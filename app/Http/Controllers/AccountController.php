<?php

namespace App\Http\Controllers;

use App\Enums\AccountKind;
use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
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
                    'lender', 'apr', 'due_day_of_month',
                ]),
                'scheduled_payment_amount' => $account->scheduled_payment_amount,
                'starting_principal' => $account->starting_principal,
                'balance' => $this->ledger->balance($account),
            ]);

        return Inertia::render('Accounts/Index', [
            'accounts' => $accounts,
        ]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $isLiability = $data['kind'] === AccountKind::Liability->value;
        $opening = Money::ofPesos($data['opening_balance'] ?? 0);

        $account = $request->user()->accounts()->create([
            'name' => $data['name'],
            'kind' => $data['kind'],
            'bank_name' => $isLiability ? null : ($data['bank_name'] ?? null),
            'interest_rate' => $isLiability ? null : ($data['interest_rate'] ?? null),
            'lender' => $isLiability ? ($data['lender'] ?? null) : null,
            'apr' => $isLiability ? ($data['apr'] ?? null) : null,
            'due_day_of_month' => $isLiability ? ($data['due_day_of_month'] ?? null) : null,
            'scheduled_payment_amount' => $isLiability && isset($data['scheduled_payment'])
                ? Money::ofPesos($data['scheduled_payment'])
                : null,
            'starting_principal' => $isLiability ? $opening : null,
        ]);

        $this->ledger->recordOpeningBalance($account, $opening);

        return to_route('accounts.index')->with('status', "Account “{$account->name}” created.");
    }

    public function update(UpdateAccountRequest $request, Account $account): RedirectResponse
    {
        abort_unless($account->user_id === $request->user()->id, 403);

        $data = $request->validated();
        $isLiability = $account->isLiability();

        $account->update([
            'name' => $data['name'],
            'is_archived' => $data['is_archived'] ?? $account->is_archived,
            'bank_name' => $isLiability ? null : ($data['bank_name'] ?? null),
            'interest_rate' => $isLiability ? null : ($data['interest_rate'] ?? null),
            'lender' => $isLiability ? ($data['lender'] ?? null) : null,
            'apr' => $isLiability ? ($data['apr'] ?? null) : null,
            'due_day_of_month' => $isLiability ? ($data['due_day_of_month'] ?? null) : null,
            'scheduled_payment_amount' => $isLiability && isset($data['scheduled_payment'])
                ? Money::ofPesos($data['scheduled_payment'])
                : $account->scheduled_payment_amount,
        ]);

        return to_route('accounts.index')->with('status', "Account “{$account->name}” updated.");
    }

    public function destroy(Request $request, Account $account): RedirectResponse
    {
        abort_unless($account->user_id === $request->user()->id, 403);

        $account->update(['is_archived' => true]);

        return to_route('accounts.index')->with('status', "Account “{$account->name}” archived.");
    }
}
