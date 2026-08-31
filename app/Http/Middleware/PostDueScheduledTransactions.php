<?php

namespace App\Http\Middleware;

use App\Services\ScheduledTransactionService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Herd has no cron, so scheduled transactions marked "auto-post" are also
 * caught up here: once per day, on the first ordinary page load, the current
 * user's due auto-post schedules are posted to the ledger. Failures are logged
 * and swallowed so a page never breaks over it.
 */
class PostDueScheduledTransactions
{
    public function __construct(private readonly ScheduledTransactionService $service) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $request->isMethod('GET') && ! $request->headers->has('X-Inertia-Partial-Data')) {
            $key = "autopost:{$user->id}:".now()->toDateString();

            if (Cache::add($key, true, now()->addDay())) {
                try {
                    $this->service->postDue($user);
                } catch (\Throwable $e) {
                    Log::warning('Auto-post of scheduled transactions failed', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        return $next($request);
    }
}
