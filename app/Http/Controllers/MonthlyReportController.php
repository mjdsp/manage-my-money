<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class MonthlyReportController extends Controller
{
    public function __construct(private readonly ReportService $reports) {}

    public function show(Request $request): Response
    {
        $month = $this->resolveMonth($request->query('month'));

        return Inertia::render('Reports/Monthly', [
            'report' => $this->reports->monthly($request->user(), $month),
            'availableMonths' => $this->availableMonths($request),
            'selectedMonth' => $month->format('Y-m'),
        ]);
    }

    public function download(Request $request): SymfonyResponse
    {
        $month = $this->resolveMonth($request->query('month'));
        $report = $this->reports->monthly($request->user(), $month);

        $pdf = Pdf::loadView('reports.monthly', [
            'report' => $report,
            'user' => $request->user(),
        ])->setPaper('a4');

        return $pdf->download("monthly-report-{$month->format('Y-m')}.pdf");
    }

    private function resolveMonth(?string $value): Carbon
    {
        try {
            $month = $value
                ? Carbon::createFromFormat('Y-m', $value)->startOfMonth()
                : Carbon::now()->startOfMonth()->subMonthNoOverflow();
        } catch (\Throwable) {
            $month = Carbon::now()->startOfMonth()->subMonthNoOverflow();
        }

        return $month->isFuture() ? Carbon::now()->startOfMonth() : $month;
    }

    /**
     * The last 12 months plus the current one, newest first, for the picker.
     *
     * @return list<array{value: string, label: string}>
     */
    private function availableMonths(Request $request): array
    {
        $earliest = $request->user()->transactions()->min('date');
        $cursor = Carbon::now()->startOfMonth();
        $floor = $earliest ? Carbon::parse($earliest)->startOfMonth() : $cursor->copy()->subMonths(11);
        $months = [];

        while ($cursor->greaterThanOrEqualTo($floor) && count($months) < 60) {
            $months[] = ['value' => $cursor->format('Y-m'), 'label' => $cursor->format('F Y')];
            $cursor->subMonthNoOverflow();
        }

        return $months;
    }
}
