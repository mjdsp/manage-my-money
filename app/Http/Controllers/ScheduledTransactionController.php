<?php

namespace App\Http\Controllers;

use App\Http\Requests\ScheduledTransactionRequest;
use App\Models\ScheduledTransaction;
use App\Services\ScheduledTransactionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduledTransactionController extends Controller
{
    public function __construct(private readonly ScheduledTransactionService $service) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        $items = $user->scheduledTransactions()
            ->with(['category:id,name,kind', 'fromAccount:id,name', 'toAccount:id,name'])
            ->orderByDesc('is_active')
            ->orderBy('next_due_date')
            ->get()
            ->map(fn (ScheduledTransaction $st) => [
                ...$st->only([
                    'id', 'description', 'type', 'day_of_month', 'lead_time_days', 'is_active',
                    'auto_post', 'category_id', 'from_account_id', 'to_account_id',
                ]),
                'amount' => $st->amount,
                'next_due_date' => $st->next_due_date->toDateString(),
                'last_posted_at' => $st->last_posted_at?->toDateString(),
                'remind_on' => $st->remindOn()->toDateString(),
                'category' => $st->category?->only(['id', 'name', 'kind']),
                'from_account' => $st->fromAccount?->only(['id', 'name']),
                'to_account' => $st->toAccount?->only(['id', 'name']),
            ]);

        return Inertia::render('ScheduledTransactions/Index', [
            'scheduledTransactions' => $items,
            'accounts' => $user->accounts()->active()->orderBy('name')->get(['id', 'name', 'kind']),
            'categories' => $user->categories()->orderBy('name')->get(['id', 'name', 'kind']),
        ]);
    }

    public function store(ScheduledTransactionRequest $request): RedirectResponse
    {
        $request->user()->scheduledTransactions()->create($request->toModelData());

        return to_route('scheduled-transactions.index')->with('status', 'Scheduled transaction added.');
    }

    public function update(ScheduledTransactionRequest $request, ScheduledTransaction $scheduledTransaction): RedirectResponse
    {
        abort_unless($scheduledTransaction->user_id === $request->user()->id, 403);

        $scheduledTransaction->update($request->toModelData());

        return to_route('scheduled-transactions.index')->with('status', 'Scheduled transaction updated.');
    }

    public function destroy(Request $request, ScheduledTransaction $scheduledTransaction): RedirectResponse
    {
        abort_unless($scheduledTransaction->user_id === $request->user()->id, 403);

        $scheduledTransaction->delete();

        return to_route('scheduled-transactions.index')->with('status', 'Scheduled transaction deleted.');
    }

    public function post(Request $request, ScheduledTransaction $scheduledTransaction): RedirectResponse
    {
        abort_unless($scheduledTransaction->user_id === $request->user()->id, 403);

        $this->service->post($scheduledTransaction);

        return back()->with('status', 'Posted to the ledger.');
    }

    public function skip(Request $request, ScheduledTransaction $scheduledTransaction): RedirectResponse
    {
        abort_unless($scheduledTransaction->user_id === $request->user()->id, 403);

        $this->service->skip($scheduledTransaction);

        return back()->with('status', 'Skipped this cycle.');
    }
}
