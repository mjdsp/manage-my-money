import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate, peso, titleCase } from '@/lib/format';
import type { Money } from '@/types/models';
import { Head, router } from '@inertiajs/react';

type CategoryRow = { name: string; amount: Money; pct: number };

type Report = {
    month: string;
    monthLabel: string;
    generatedAt: string;
    summary: {
        income: Money;
        expense: Money;
        net: Money;
        saved: Money;
        interest: Money;
        netWorthStart: Money;
        netWorthEnd: Money;
    };
    spendingByCategory: CategoryRow[];
    incomeByCategory: CategoryRow[];
    savings: {
        name: string;
        opening: Money;
        contributions: Money;
        interest: Money;
        closing: Money;
    }[];
    transactionsByCategory: {
        name: string;
        total: Money;
        transactions: {
            date: string;
            description: string | null;
            type: string;
            amount: Money;
            from: string | null;
            to: string | null;
        }[];
    }[];
};

function CategoryTable({ rows, unit }: { rows: CategoryRow[]; unit: string }) {
    if (rows.length === 0) {
        return <p className="text-sm text-gray-500">Nothing recorded.</p>;
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">% of {unit}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((r) => (
                    <TableRow key={r.name}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-right tabular-nums">
                            {peso(r.amount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                            {r.pct}%
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function MonthlyReport({
    report,
    availableMonths,
    selectedMonth,
}: {
    report: Report;
    availableMonths: { value: string; label: string }[];
    selectedMonth: string;
}) {
    function pick(month: string) {
        router.get(
            route('reports.monthly'),
            { month },
            { preserveState: true, replace: true },
        );
    }

    const s = report.summary;

    return (
        <AuthenticatedLayout>
            <Head title={`Report — ${report.monthLabel}`} />
            <PageHeader
                title="Monthly report"
                description={`Generated ${report.generatedAt}`}
                actions={
                    <div className="flex gap-2">
                        <Select value={selectedMonth} onValueChange={pick}>
                            <SelectTrigger className="w-44">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMonths.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button asChild>
                            <a
                                href={`${route('reports.monthly.pdf')}?month=${report.month}`}
                            >
                                Download PDF
                            </a>
                        </Button>
                    </div>
                }
            />

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Summary — {report.monthLabel}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-3 sm:grid-cols-2">
                            {[
                                ['Total income', s.income],
                                ['Total expenses', s.expense],
                                ['Net', s.net],
                                ['Saved into savings', s.saved],
                                ['Interest received', s.interest],
                                ['Net worth — start', s.netWorthStart],
                                ['Net worth — end', s.netWorthEnd],
                            ].map(([label, value]) => (
                                <div
                                    key={label as string}
                                    className="flex justify-between border-b pb-2 text-sm"
                                >
                                    <dt className="text-gray-500">
                                        {label as string}
                                    </dt>
                                    <dd className="font-medium tabular-nums">
                                        {peso(value as Money)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Spending by category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CategoryTable
                                rows={report.spendingByCategory}
                                unit="expenses"
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Income by category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CategoryTable
                                rows={report.incomeByCategory}
                                unit="income"
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Savings &amp; interest</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {report.savings.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No savings accounts. Mark an asset account with
                                an interest rate to track it here.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Account</TableHead>
                                        <TableHead className="text-right">
                                            Opening
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Contributions
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Interest
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Closing
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.savings.map((row) => (
                                        <TableRow key={row.name}>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {peso(row.opening)}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {peso(row.contributions)}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {peso(row.interest)}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {peso(row.closing)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Transactions by category</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {report.transactionsByCategory.length === 0 && (
                            <p className="text-sm text-gray-500">
                                No transactions this month.
                            </p>
                        )}
                        {report.transactionsByCategory.map((group) => (
                            <div key={group.name}>
                                <div className="mb-1 flex justify-between text-sm font-semibold">
                                    <span>{group.name}</span>
                                    <span className="tabular-nums">
                                        {peso(group.total)}
                                    </span>
                                </div>
                                <Table>
                                    <TableBody>
                                        {group.transactions.map((t, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="w-28 text-sm whitespace-nowrap">
                                                    {formatDate(t.date)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {t.description || '—'}
                                                    <span className="ml-2 text-xs text-gray-400">
                                                        {titleCase(t.type)}
                                                        {t.from || t.to
                                                            ? ` · ${[t.from, t.to].filter(Boolean).join(' → ')}`
                                                            : ''}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {peso(t.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
