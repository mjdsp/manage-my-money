<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Monthly report — {{ $report['monthLabel'] }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; color: #1a1a1a; font-size: 12px; margin: 0; }
        h1 { font-size: 20px; margin: 0 0 2px; }
        h2 { font-size: 13px; margin: 22px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #999; text-transform: uppercase; letter-spacing: .04em; }
        .muted { color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        th, td { text-align: left; padding: 4px 6px; }
        thead th { border-bottom: 1px solid #bbb; font-size: 10px; text-transform: uppercase; color: #555; }
        tbody tr:nth-child(even) { background: #f5f5f5; }
        .num { text-align: right; white-space: nowrap; }
        .summary td { padding: 5px 6px; border-bottom: 1px solid #eee; }
        .summary .label { color: #555; width: 60%; }
        .total-row td { border-top: 1px solid #bbb; font-weight: bold; background: #eee; }
        .group-header td { background: #e8e8e8; font-weight: bold; }
        .neg { color: #b00020; }
    </style>
</head>
<body>
    <h1>Monthly Report</h1>
    <div class="muted">{{ $report['monthLabel'] }} &nbsp;·&nbsp; {{ $user->name }} &nbsp;·&nbsp; generated {{ $report['generatedAt'] }}</div>

    <h2>Summary</h2>
    <table class="summary">
        <tr><td class="label">Total income</td><td class="num">{{ $report['summary']['income']->formatted() }}</td></tr>
        <tr><td class="label">Total expenses</td><td class="num">{{ $report['summary']['expense']->formatted() }}</td></tr>
        <tr class="total-row"><td class="label">Net</td><td class="num @if($report['summary']['net']->isNegative()) neg @endif">{{ $report['summary']['net']->formatted() }}</td></tr>
        <tr><td class="label">Saved into savings accounts</td><td class="num">{{ $report['summary']['saved']->formatted() }}</td></tr>
        <tr><td class="label">Interest received</td><td class="num">{{ $report['summary']['interest']->formatted() }}</td></tr>
        <tr><td class="label">Net worth — start of month</td><td class="num">{{ $report['summary']['netWorthStart']->formatted() }}</td></tr>
        <tr><td class="label">Net worth — end of month</td><td class="num">{{ $report['summary']['netWorthEnd']->formatted() }}</td></tr>
    </table>

    <h2>Spending by category</h2>
    @if($report['spendingByCategory']->isEmpty())
        <p class="muted">No expenses recorded this month.</p>
    @else
        <table>
            <thead><tr><th>Category</th><th class="num">Amount</th><th class="num">% of expenses</th></tr></thead>
            <tbody>
                @foreach($report['spendingByCategory'] as $row)
                    <tr><td>{{ $row['name'] }}</td><td class="num">{{ $row['amount']->formatted() }}</td><td class="num">{{ number_format($row['pct'], 1) }}%</td></tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <h2>Income by category</h2>
    @if($report['incomeByCategory']->isEmpty())
        <p class="muted">No income recorded this month.</p>
    @else
        <table>
            <thead><tr><th>Category</th><th class="num">Amount</th><th class="num">% of income</th></tr></thead>
            <tbody>
                @foreach($report['incomeByCategory'] as $row)
                    <tr><td>{{ $row['name'] }}</td><td class="num">{{ $row['amount']->formatted() }}</td><td class="num">{{ number_format($row['pct'], 1) }}%</td></tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <h2>Savings &amp; interest</h2>
    @if($report['savings']->isEmpty())
        <p class="muted">No savings accounts.</p>
    @else
        <table>
            <thead><tr><th>Account</th><th class="num">Opening</th><th class="num">Contributions</th><th class="num">Interest</th><th class="num">Closing</th></tr></thead>
            <tbody>
                @foreach($report['savings'] as $row)
                    <tr>
                        <td>{{ $row['name'] }}</td>
                        <td class="num">{{ $row['opening']->formatted() }}</td>
                        <td class="num">{{ $row['contributions']->formatted() }}</td>
                        <td class="num">{{ $row['interest']->formatted() }}</td>
                        <td class="num">{{ $row['closing']->formatted() }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <h2>Transactions by category</h2>
    @if($report['transactionsByCategory']->isEmpty())
        <p class="muted">No transactions this month.</p>
    @else
        <table>
            <thead><tr><th>Date</th><th>Description</th><th>Accounts</th><th class="num">Amount</th></tr></thead>
            <tbody>
                @foreach($report['transactionsByCategory'] as $group)
                    <tr class="group-header"><td colspan="3">{{ $group['name'] }}</td><td class="num">{{ $group['total']->formatted() }}</td></tr>
                    @foreach($group['transactions'] as $t)
                        <tr>
                            <td>{{ $t['date'] }}</td>
                            <td>{{ $t['description'] ?: '—' }}</td>
                            <td class="muted">{{ $t['from'] ? $t['from'] : '' }}{{ $t['from'] && $t['to'] ? ' → ' : '' }}{{ $t['to'] ? $t['to'] : '' }}</td>
                            <td class="num">{{ $t['amount']->formatted() }}</td>
                        </tr>
                    @endforeach
                @endforeach
            </tbody>
        </table>
    @endif
</body>
</html>
