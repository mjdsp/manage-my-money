<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Reimbursement — {{ $reimbursement->title }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; color: #1a1a1a; font-size: 12px; margin: 0; }
        h1 { font-size: 20px; margin: 0 0 2px; }
        .muted { color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th, td { text-align: left; padding: 6px 8px; }
        thead th { border-bottom: 1px solid #bbb; font-size: 10px; text-transform: uppercase; color: #555; }
        tbody tr:nth-child(even) { background: #f5f5f5; }
        .num { text-align: right; white-space: nowrap; }
        .idx { color: #999; width: 6%; }
        .total-row td { border-top: 2px solid #bbb; font-weight: bold; background: #eee; font-size: 13px; }
        .notes { margin-top: 18px; padding: 10px 12px; background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>{{ $reimbursement->title }}</h1>
    <div class="muted">
        {{ $user->name }}
        &nbsp;·&nbsp; {{ $reimbursement->created_at->toDayDateTimeString() }}
    </div>

    <table>
        <thead>
            <tr>
                <th class="idx">#</th>
                <th class="num" style="width: 12%;">Quantity</th>
                <th>Item name</th>
                <th class="num" style="width: 20%;">Price per quantity</th>
                <th class="num" style="width: 20%;">Total amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($reimbursement->items as $item)
                <tr>
                    <td class="idx">{{ $loop->iteration }}</td>
                    <td class="num">{{ $item->quantity }}</td>
                    <td>{{ $item->item_name }}</td>
                    <td class="num">{{ $item->unit_price->formatted() }}</td>
                    <td class="num">{{ $item->line_total->formatted() }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="4">Total amount</td>
                <td class="num">{{ $reimbursement->total_amount->formatted() }}</td>
            </tr>
        </tbody>
    </table>

    @if ($reimbursement->notes)
        <div class="notes">
            <strong>Notes</strong><br>
            {{ $reimbursement->notes }}
        </div>
    @endif
</body>
</html>
