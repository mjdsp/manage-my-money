import PageHeader from '@/Components/PageHeader';
import PieChart from '@/Components/PieChart';
import { Badge } from '@/Components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate, monthLabel, peso } from '@/lib/format';
import type { Money } from '@/types/models';
import { Head, Link } from '@inertiajs/react';

type IE = { income: Money; expense: Money; net: Money };

type DashboardData = {
    month: string;
    netPosition: {
        assets: Money;
        receivables: Money;
        liabilities: Money;
        net: Money;
    };
    thisMonth: IE;
    lastMonth: IE;
    spendingByCategory: { name: string; amount: Money; pct: number }[];
    upcoming: {
        id: number;
        description: string;
        amount: Money;
        type: string;
        next_due_date: string;
        is_overdue: boolean;
    }[];
    accounts: {
        id: number;
        name: string;
        kind: 'asset' | 'liability' | 'receivable';
        balance: Money;
        payoff: {
            original: Money;
            owed: Money;
            paid: Money;
            pct: number;
        } | null;
    }[];
};

function Stat({
    label,
    value,
    hint,
    tone = 'default',
}: {
    label: string;
    value: string;
    hint?: string;
    tone?: 'default' | 'positive' | 'negative';
}) {
    const color =
        tone === 'positive'
            ? 'text-emerald-600'
            : tone === 'negative'
              ? 'text-red-600'
              : 'text-gray-900';
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className={`text-2xl tabular-nums ${color}`}>
                    {value}
                </CardTitle>
            </CardHeader>
            {hint && (
                <CardContent className="pt-0 text-xs text-gray-500">
                    {hint}
                </CardContent>
            )}
        </Card>
    );
}

export default function Dashboard({ data }: { data: DashboardData }) {
    const spendingTotal = data.spendingByCategory.reduce(
        (sum, r) => sum + r.amount.cents,
        0,
    );
    const deltaExpense =
        data.thisMonth.expense.cents - data.lastMonth.expense.cents;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <PageHeader
                title="Dashboard"
                description={monthLabel(data.month)}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                    label="Net worth"
                    value={peso(data.netPosition.net)}
                    tone={
                        data.netPosition.net.cents >= 0
                            ? 'positive'
                            : 'negative'
                    }
                    hint={`${peso(data.netPosition.assets)} assets − ${peso(
                        data.netPosition.liabilities,
                    )} liabilities`}
                />
                <Stat
                    label="Income this month"
                    value={peso(data.thisMonth.income)}
                    tone="positive"
                    hint={`last month ${peso(data.lastMonth.income)}`}
                />
                <Stat
                    label="Expenses this month"
                    value={peso(data.thisMonth.expense)}
                    tone="negative"
                    hint={
                        deltaExpense === 0
                            ? 'same as last month'
                            : `${deltaExpense > 0 ? '+' : '−'}${peso(
                                  Math.abs(deltaExpense),
                              )} vs last month`
                    }
                />
                <Stat
                    label="Net this month"
                    value={peso(data.thisMonth.net)}
                    tone={
                        data.thisMonth.net.cents >= 0 ? 'positive' : 'negative'
                    }
                />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Expenses by category</CardTitle>
                        <CardDescription>
                            {monthLabel(data.month)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <PieChart
                            data={data.spendingByCategory.map((row) => ({
                                name: row.name,
                                value: row.amount.cents,
                            }))}
                            formatValue={(cents) => peso(cents)}
                            emptyLabel="No expenses recorded yet."
                        />
                        {data.spendingByCategory.map((row) => (
                            <div key={row.name}>
                                <div className="flex justify-between text-sm">
                                    <span>{row.name}</span>
                                    <span className="text-gray-600 tabular-nums">
                                        {peso(row.amount)} · {row.pct}%
                                    </span>
                                </div>
                                <div className="mt-1 h-2 overflow-hidden rounded bg-gray-100">
                                    <div
                                        className="h-full rounded bg-gray-800"
                                        style={{
                                            width: `${
                                                spendingTotal
                                                    ? (row.amount.cents /
                                                          spendingTotal) *
                                                      100
                                                    : 0
                                            }%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming</CardTitle>
                        <CardDescription>
                            Scheduled payments in their reminder window
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {data.upcoming.length === 0 && (
                            <p className="text-sm text-gray-500">
                                Nothing due soon.
                            </p>
                        )}
                        {data.upcoming.map((u) => (
                            <div
                                key={u.id}
                                className="flex items-center justify-between border-b py-2 last:border-0"
                            >
                                <div>
                                    <div className="text-sm font-medium">
                                        {u.description}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        due {formatDate(u.next_due_date)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {u.is_overdue && (
                                        <Badge variant="destructive">
                                            overdue
                                        </Badge>
                                    )}
                                    <span className="text-sm tabular-nums">
                                        {peso(u.amount)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <Link
                            href={route('scheduled-transactions.index')}
                            className="inline-block pt-2 text-sm text-gray-500 underline"
                        >
                            Manage schedules
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Accounts</CardTitle>
                    <CardDescription>
                        Current balances and debt payoff progress
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {data.accounts.length === 0 && (
                        <p className="text-sm text-gray-500">
                            <Link
                                href={route('accounts.index')}
                                className="underline"
                            >
                                Add your first account
                            </Link>{' '}
                            to get started.
                        </p>
                    )}
                    {data.accounts.map((a) => (
                        <div key={a.id}>
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">
                                    {a.name}
                                    <Badge
                                        variant="outline"
                                        className="ml-2 text-[10px]"
                                    >
                                        {a.kind}
                                    </Badge>
                                </span>
                                <span className="tabular-nums">
                                    {a.payoff
                                        ? peso(a.payoff.owed)
                                        : peso(a.balance)}
                                    {a.payoff &&
                                        (a.kind === 'receivable'
                                            ? ' to collect'
                                            : ' left to pay')}
                                </span>
                            </div>
                            {a.payoff && a.payoff.original.cents > 0 && (
                                <div className="mt-1">
                                    <div className="h-2 overflow-hidden rounded bg-gray-100">
                                        <div
                                            className="h-full rounded bg-emerald-600"
                                            style={{
                                                width: `${a.payoff.pct}%`,
                                            }}
                                        />
                                    </div>
                                    <div className="mt-0.5 text-xs text-gray-500">
                                        {peso(a.payoff.paid)} of{' '}
                                        {peso(a.payoff.original)}{' '}
                                        {a.kind === 'receivable'
                                            ? 'collected'
                                            : 'paid'}{' '}
                                        ({a.payoff.pct}%)
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
