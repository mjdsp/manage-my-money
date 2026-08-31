<?php

namespace App\Http\Controllers;

use App\Http\Requests\TransactionRequest;
use App\Models\Transaction;
use App\Services\LedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function __construct(private readonly LedgerService $ledger) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        $month = $this->resolveMonth($request->query('month'));
        $accountId = $request->integer('account') ?: null;
        $categoryId = $request->integer('category') ?: null;
        $type = $request->query('type') ?: null;

        $transactions = $user->transactions()
            ->with(['category:id,name,kind', 'fromAccount:id,name', 'toAccount:id,name'])
            ->whereBetween('date', [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()])
            ->when($accountId, fn ($q) => $q->where(fn ($q) => $q
                ->where('from_account_id', $accountId)->orWhere('to_account_id', $accountId)))
            ->when($categoryId, fn ($q) => $q->where('category_id', $categoryId))
            ->when($type, fn ($q) => $q->where('type', $type))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (Transaction $t) => [
                'id' => $t->id,
                'date' => $t->date->toDateString(),
                'amount' => $t->amount,
                'type' => $t->type,
                'description' => $t->description,
                'category_id' => $t->category_id,
                'from_account_id' => $t->from_account_id,
                'to_account_id' => $t->to_account_id,
                'category' => $t->category?->only(['id', 'name', 'kind']),
                'from_account' => $t->fromAccount?->only(['id', 'name']),
                'to_account' => $t->toAccount?->only(['id', 'name']),
            ]);

        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions,
            'filters' => [
                'month' => $month->format('Y-m'),
                'account' => $accountId,
                'category' => $categoryId,
                'type' => $type,
            ],
            'accounts' => $user->accounts()->active()->orderBy('name')->get(['id', 'name', 'kind']),
            'categories' => $user->categories()->orderBy('name')->get(['id', 'name', 'kind']),
        ]);
    }

    public function store(TransactionRequest $request): RedirectResponse
    {
        $this->ledger->post($request->user(), $request->toLedgerData());

        return back()->with('status', 'Transaction added.');
    }

    public function update(TransactionRequest $request, Transaction $transaction): RedirectResponse
    {
        abort_unless($transaction->user_id === $request->user()->id, 403);

        $this->ledger->rewrite($transaction, $request->toLedgerData());

        return back()->with('status', 'Transaction updated.');
    }

    public function destroy(Request $request, Transaction $transaction): RedirectResponse
    {
        abort_unless($transaction->user_id === $request->user()->id, 403);

        $transaction->delete();

        return back()->with('status', 'Transaction deleted.');
    }

    private function resolveMonth(?string $value): Carbon
    {
        try {
            // The leading "!" resets the day to the 1st; without it a value like
            // "2026-09" is read as "Sep <today's day>" and overflows into the
            // next month whenever today is the 29th–31st.
            return $value
                ? Carbon::createFromFormat('!Y-m', $value)->startOfMonth()
                : Carbon::now()->startOfMonth();
        } catch (\Throwable) {
            return Carbon::now()->startOfMonth();
        }
    }
}
