import Amount from '@/Components/Amount';
import PageHeader from '@/Components/PageHeader';
import PieChart from '@/Components/PieChart';
import StatementField from '@/Components/StatementField';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
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
import { formatDate, formatMonthDay, peso, titleCase } from '@/lib/format';
import type { Money } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { ArrowRight, Download } from 'lucide-react';
import { ReactNode } from 'react';

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

function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
            {children}
        </h2>
    );
}

/** A statement line: label on the left, the figure ruled off on the right. */
function SummaryLine({
    label,
    children,
    strong = false,
}: {
    label: string;
    children: ReactNode;
    strong?: boolean;
}) {
    return (
        <div
            className={
                strong
                    ? 'border-ink rule-double flex items-baseline justify-between gap-4 border-t py-3'
                    : 'border-rule flex items-baseline justify-between gap-4 border-b py-2.5'
            }
        >
            <dt className={strong ? 'font-semibold' : 'text-ink-2'}>{label}</dt>
            <dd>{children}</dd>
        </div>
    );
}

function Breakdown({
    rows,
    label,
    empty,
}: {
    rows: CategoryRow[];
    label: string;
    empty: string;
}) {
    if (rows.length === 0) {
        return <p className="text-ink-2 py-6 text-sm">{empty}</p>;
    }
    return (
        <PieChart
            label={label}
            data={rows.map((r) => ({ name: r.name, value: r.amount.cents }))}
            formatValue={(cents) => peso(cents)}
        />
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
    const worthChange = s.netWorthEnd.cents - s.netWorthStart.cents;

    // The report can show a month older than the first transaction (it defaults
    // to last month); keep that month in the picker so it never reads blank.
    const months = availableMonths.some((m) => m.value === selectedMonth)
        ? availableMonths
        : [
              { value: selectedMonth, label: report.monthLabel },
              ...availableMonths,
          ].sort((a, b) => b.value.localeCompare(a.value));

    return (
        <AuthenticatedLayout>
            <Head title={`Report — ${report.monthLabel}`} />
            <PageHeader
                title="Monthly report"
                description={`Generated ${report.generatedAt}`}
                actions={
                    <>
                        <Select value={selectedMonth} onValueChange={pick}>
                            <SelectTrigger
                                className="w-44"
                                aria-label="Report month"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m) => (
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
                                <Download />
                                Download PDF
                            </a>
                        </Button>
                    </>
                }
            />

            <div className="grid gap-6">
                <Card className="gap-0 p-0 sm:p-0 lg:grid lg:grid-cols-12">
                    <section className="p-5 sm:p-7 lg:col-span-7">
                        <SectionTitle>
                            Summary — {report.monthLabel}
                        </SectionTitle>
                        <dl className="mt-3">
                            <SummaryLine label="Total income">
                                <Amount value={s.income} tone="credit" />
                            </SummaryLine>
                            <SummaryLine label="Total expenses">
                                <Amount value={s.expense} />
                            </SummaryLine>
                            <SummaryLine label="Saved into savings">
                                <Amount value={s.saved} />
                            </SummaryLine>
                            <SummaryLine label="Interest received">
                                <Amount value={s.interest} tone="credit" />
                            </SummaryLine>
                            <SummaryLine label="Net" strong>
                                <Amount
                                    value={s.net}
                                    size="lg"
                                    tone={s.net.cents < 0 ? 'past-due' : 'ink'}
                                />
                            </SummaryLine>
                        </dl>
                    </section>
                    <section className="border-rule @container border-t p-5 sm:p-7 lg:col-span-5 lg:border-t-0 lg:border-l">
                        <SectionTitle>Net worth</SectionTitle>
                        <dl className="mt-4 grid gap-5">
                            <div className="flex items-end gap-3">
                                <StatementField label="Start of month">
                                    <Amount value={s.netWorthStart} size="lg" />
                                </StatementField>
                                <ArrowRight
                                    className="text-ink-3 mb-1 size-4 shrink-0"
                                    aria-label="to"
                                />
                                <StatementField label="End of month">
                                    <Amount value={s.netWorthEnd} size="lg" />
                                </StatementField>
                            </div>
                            <StatementField label="Change">
                                <Amount
                                    value={worthChange}
                                    size="display"
                                    sign={worthChange > 0 ? 'plus' : 'auto'}
                                    tone={
                                        worthChange < 0
                                            ? 'past-due'
                                            : worthChange > 0
                                              ? 'credit'
                                              : 'ink'
                                    }
                                />
                            </StatementField>
                        </dl>
                    </section>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardContent className="grid gap-4">
                            <SectionTitle>Spending by category</SectionTitle>
                            <Breakdown
                                rows={report.spendingByCategory}
                                label="Spending by category"
                                empty="Nothing spent this month."
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="grid gap-4">
                            <SectionTitle>Income by category</SectionTitle>
                            <Breakdown
                                rows={report.incomeByCategory}
                                label="Income by category"
                                empty="No income recorded this month."
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="grid gap-4">
                        <SectionTitle>Savings &amp; interest</SectionTitle>
                        {report.savings.length === 0 ? (
                            <p className="text-ink-2 text-sm">
                                No savings accounts. Mark an asset account with
                                an interest rate to track it here.
                            </p>
                        ) : (
                            <>
                                <ul className="divide-rule divide-y md:hidden">
                                    {report.savings.map((row) => (
                                        <li
                                            key={row.name}
                                            className="py-3 first:pt-0"
                                        >
                                            <p className="font-semibold">
                                                {row.name}
                                            </p>
                                            <dl className="mt-2 grid grid-cols-2 gap-3">
                                                <StatementField label="Opening">
                                                    <Amount
                                                        value={row.opening}
                                                        size="sm"
                                                    />
                                                </StatementField>
                                                <StatementField label="Contributions">
                                                    <Amount
                                                        value={
                                                            row.contributions
                                                        }
                                                        size="sm"
                                                    />
                                                </StatementField>
                                                <StatementField label="Interest">
                                                    <Amount
                                                        value={row.interest}
                                                        size="sm"
                                                        tone="credit"
                                                    />
                                                </StatementField>
                                                <StatementField label="Closing">
                                                    <Amount
                                                        value={row.closing}
                                                        size="sm"
                                                    />
                                                </StatementField>
                                            </dl>
                                        </li>
                                    ))}
                                </ul>
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
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
                                                    <TableCell className="font-medium">
                                                        {row.name}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Amount
                                                            value={row.opening}
                                                            size="sm"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Amount
                                                            value={
                                                                row.contributions
                                                            }
                                                            size="sm"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Amount
                                                            value={row.interest}
                                                            size="sm"
                                                            tone="credit"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Amount
                                                            value={row.closing}
                                                            size="md"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="grid gap-6">
                        <SectionTitle>Transactions by category</SectionTitle>
                        {report.transactionsByCategory.length === 0 && (
                            <p className="text-ink-2 text-sm">
                                No transactions this month.
                            </p>
                        )}
                        {report.transactionsByCategory.map((group) => (
                            <section key={group.name}>
                                <h3 className="border-ink flex items-baseline justify-between gap-4 border-b pb-2">
                                    <span className="font-semibold">
                                        {group.name}
                                    </span>
                                    <Amount value={group.total} size="md" />
                                </h3>
                                <ul className="divide-rule divide-y">
                                    {group.transactions.map((t, i) => (
                                        <li
                                            key={i}
                                            className="flex items-baseline gap-3 py-2.5 md:gap-6"
                                        >
                                            <time
                                                dateTime={t.date}
                                                className="text-ink-2 figures w-14 shrink-0 text-[0.8125rem] md:w-28"
                                            >
                                                <span className="md:hidden">
                                                    {formatMonthDay(t.date)}
                                                </span>
                                                <span className="hidden md:inline">
                                                    {formatDate(t.date)}
                                                </span>
                                            </time>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm">
                                                    {t.description || (
                                                        <span className="text-ink-3">
                                                            —
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-ink-2 mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
                                                    {t.type === 'transfer' ||
                                                    t.type === 'adjustment' ? (
                                                        <Badge variant="outline">
                                                            {titleCase(t.type)}
                                                        </Badge>
                                                    ) : (
                                                        titleCase(t.type)
                                                    )}
                                                    {(t.from || t.to) && (
                                                        <span className="inline-flex items-center gap-1">
                                                            · {t.from}
                                                            {t.from && t.to && (
                                                                <ArrowRight
                                                                    className="size-3"
                                                                    aria-label="to"
                                                                />
                                                            )}
                                                            {t.to}
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                            <Amount
                                                value={t.amount}
                                                size="sm"
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
