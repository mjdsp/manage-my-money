import Amount from '@/Components/Amount';
import EmptyState from '@/Components/EmptyState';
import Fold from '@/Components/Fold';
import Itemized, { type ItemizedRow } from '@/Components/Itemized';
import StatementField from '@/Components/StatementField';
import Stub from '@/Components/Stub';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    daysUntil,
    dueLabel,
    formatDate,
    formatMonthDay,
    MINUS,
    monthLabel,
    peso,
    todayISO,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AccountKind, Money } from '@/types/models';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { ReactNode, useState } from 'react';

type IE = { income: Money; expense: Money; net: Money };

type Upcoming = {
    id: number;
    description: string;
    amount: Money;
    type: string;
    next_due_date: string;
    is_overdue: boolean;
};

type DashboardAccount = {
    id: number;
    name: string;
    kind: AccountKind;
    balance: Money;
    payoff: {
        original: Money;
        owed: Money;
        paid: Money;
        pct: number;
    } | null;
};

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
    spendingByCategory: ItemizedRow[];
    passiveIncome: ItemizedRow[];
    interestPaid: ItemizedRow[];
    upcoming: Upcoming[];
    accounts: DashboardAccount[];
};

/** "Sep 1 – Sep 30" for a "2026-09" month. */
function periodLabel(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    return `${formatMonthDay(`${month}-01`)} – ${formatMonthDay(`${month}-${lastDay}`)}`;
}

function sumCents(rows: { amount: Money }[]): number {
    return rows.reduce((sum, row) => sum + row.amount.cents, 0);
}

/**
 * One line of the summary ladder: operator, label, figure. The figure wraps
 * under the label when a phone is too narrow to hold both.
 */
function LadderLine({
    operator,
    label,
    note,
    children,
    className,
}: {
    operator?: string;
    label: string;
    note?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2.5',
                className,
            )}
        >
            <span
                className="text-ink-2 figures w-5 shrink-0 text-[0.9375rem]"
                aria-hidden
            >
                {operator}
            </span>
            <dt className="mr-auto">
                <span className="text-[0.9375rem] font-semibold">{label}</span>
                {note && (
                    <span className="text-ink-2 ml-2 text-sm">{note}</span>
                )}
            </dt>
            <dd className="ml-auto text-right">{children}</dd>
        </div>
    );
}

/** Where you stand: what you have, less what you owe, ruled off as net worth. */
function SummaryLadder({ data }: { data: DashboardData }) {
    const { assets, liabilities, net, receivables } = data.netPosition;
    const negative = net.cents < 0;

    return (
        <section aria-labelledby="standing-heading" className="@container">
            <h2
                id="standing-heading"
                className="text-[1.0625rem] font-semibold tracking-[-0.01em]"
            >
                Where you stand
            </h2>

            <dl className="mt-3">
                <LadderLine label="Assets" note="money you have">
                    <Amount value={assets} size="md" />
                </LadderLine>
                <LadderLine
                    operator={MINUS}
                    label="Liabilities"
                    note="money you owe"
                    className="border-ink border-b"
                >
                    <Amount value={liabilities} size="md" sign="none" />
                </LadderLine>
                <LadderLine
                    operator="="
                    label="Net worth"
                    className="rule-double pt-4 pb-4"
                >
                    <Amount
                        value={net}
                        size="display"
                        tone={negative ? 'past-due' : 'ink'}
                    />
                </LadderLine>
            </dl>

            <p className="text-ink-2 mt-3 text-sm text-pretty">
                Owed to you{' '}
                <span className="text-ink figures font-semibold">
                    {peso(receivables)}
                </span>
                , not counted until it's collected.
            </p>
        </section>
    );
}

/** This month's movement against last month's, as three statement fields. */
function ThisPeriod({ data }: { data: DashboardData }) {
    const { thisMonth, lastMonth } = data;
    const deltaExpense = thisMonth.expense.cents - lastMonth.expense.cents;

    return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            <StatementField label="Money in">
                <Amount value={thisMonth.income} tone="credit" />
                <p className="text-ink-2 mt-0.5 text-xs">
                    Last month {peso(lastMonth.income)}
                </p>
            </StatementField>
            <StatementField label="Money out">
                <Amount value={thisMonth.expense} />
                <p className="text-ink-2 mt-0.5 text-xs">
                    {deltaExpense === 0
                        ? 'Same as last month'
                        : `${deltaExpense > 0 ? '+' : MINUS}${peso(
                              Math.abs(deltaExpense),
                          )} vs last month`}
                </p>
            </StatementField>
            <StatementField label="Net this month">
                <Amount
                    value={thisMonth.net}
                    tone={thisMonth.net.cents >= 0 ? 'credit' : 'past-due'}
                    sign={thisMonth.net.cents > 0 ? 'plus' : 'auto'}
                />
            </StatementField>
        </dl>
    );
}

/** The one box on the statement you have to act on. */
function AmountDue({ upcoming }: { upcoming: Upcoming[] }) {
    const bills = upcoming.filter((u) => u.type !== 'income');
    const incoming = upcoming.filter((u) => u.type === 'income');
    const pastDue = bills.filter((u) => daysUntil(u.next_due_date) < 0);
    const next = bills[0];

    return (
        <section
            aria-labelledby="due-heading"
            className="flex h-full flex-col gap-4"
        >
            <h2 id="due-heading" className="sr-only">
                Amount due
            </h2>

            {next ? (
                <div className="border-ink bg-due overflow-hidden rounded-[3px] border-[1.5px]">
                    {pastDue.length > 0 && (
                        <p className="bg-past-due label-caps px-4 py-1.5 text-white">
                            Past due · {pastDue.length}{' '}
                            {pastDue.length === 1 ? 'bill' : 'bills'} ·{' '}
                            {peso(sumCents(pastDue))}
                        </p>
                    )}
                    <dl className="@container grid gap-5 p-5 sm:p-6">
                        <StatementField
                            label={
                                <span className="text-due-ink">Amount due</span>
                            }
                        >
                            <Amount value={sumCents(bills)} size="display" />
                        </StatementField>
                        <div className="border-ink/15 grid grid-cols-2 gap-4 border-t pt-4">
                            <StatementField
                                label={
                                    <span className="text-due-ink">Pay by</span>
                                }
                            >
                                <span className="font-semibold">
                                    {formatDate(next.next_due_date)}
                                </span>
                                <span
                                    className={cn(
                                        'block text-[0.8125rem]',
                                        daysUntil(next.next_due_date) < 0
                                            ? 'text-past-due font-semibold'
                                            : 'text-due-ink',
                                    )}
                                >
                                    {dueLabel(next.next_due_date)}
                                </span>
                            </StatementField>
                            <StatementField
                                label={
                                    <span className="text-due-ink">Bills</span>
                                }
                            >
                                <span className="font-semibold">
                                    {bills.length}{' '}
                                    {bills.length === 1 ? 'bill' : 'bills'}
                                </span>
                                <span className="text-due-ink block text-[0.8125rem]">
                                    in their reminder window
                                </span>
                            </StatementField>
                        </div>
                    </dl>
                </div>
            ) : (
                <div className="border-rule flex-1 rounded-[3px] border-[1.5px] border-dashed p-5 sm:p-6">
                    <p className="text-[0.9375rem] font-semibold">
                        Nothing due
                    </p>
                    <p className="text-ink-2 mt-1 text-sm text-pretty">
                        No bills are inside their reminder window. Scheduled
                        payments show up here as their due dates come near.
                    </p>
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-4"
                    >
                        <Link href={route('scheduled-transactions.index')}>
                            Manage schedules
                        </Link>
                    </Button>
                </div>
            )}

            {incoming.length > 0 && (
                <p className="text-ink-2 text-sm">
                    Expected in{' '}
                    <span className="text-credit figures font-semibold">
                        +{peso(sumCents(incoming))}
                    </span>{' '}
                    from {incoming.length}{' '}
                    {incoming.length === 1 ? 'schedule' : 'schedules'}
                </p>
            )}
        </section>
    );
}

function UpcomingStub({ item }: { item: Upcoming }) {
    const [tearing, setTearing] = useState(false);
    const [busy, setBusy] = useState(false);

    function post() {
        setTearing(true);
        setBusy(true);
        router.post(
            route('scheduled-transactions.post', item.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setTearing(false);
                    setBusy(false);
                },
            },
        );
    }

    function skip() {
        setBusy(true);
        router.post(
            route('scheduled-transactions.skip', item.id),
            {},
            { preserveScroll: true, onFinish: () => setBusy(false) },
        );
    }

    return (
        <Stub
            title={item.description}
            amount={item.amount}
            dueDate={item.next_due_date}
            incoming={item.type === 'income'}
            stamps={
                item.type === 'transfer' ? (
                    <Badge variant="outline">Transfer</Badge>
                ) : undefined
            }
            tearing={tearing}
            actions={
                <>
                    <Button size="sm" onClick={post} disabled={busy}>
                        Post
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={skip}
                        disabled={busy}
                        title="Skip this cycle and roll the schedule forward"
                    >
                        Skip
                    </Button>
                </>
            }
        />
    );
}

const KIND_LABEL: Record<AccountKind, string> = {
    asset: 'Assets',
    liability: 'Liabilities',
    receivable: 'Owed to me',
};

function AccountLines({ accounts }: { accounts: DashboardAccount[] }) {
    const groups = (['asset', 'liability', 'receivable'] as AccountKind[])
        .map((kind) => ({
            kind,
            rows: accounts.filter((a) => a.kind === kind),
        }))
        .filter((group) => group.rows.length > 0);

    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
                <div key={group.kind}>
                    <h3 className="label-caps text-ink-2 border-ink border-b pb-2">
                        {KIND_LABEL[group.kind]}
                    </h3>
                    <ul className="divide-rule divide-y">
                        {group.rows.map((account) => (
                            <li key={account.id} className="py-3">
                                <div className="flex items-baseline justify-between gap-4">
                                    <span className="min-w-0 truncate text-[0.9375rem] font-medium">
                                        {account.name}
                                    </span>
                                    <span className="shrink-0 text-right">
                                        <Amount
                                            value={
                                                account.payoff
                                                    ? account.payoff.owed
                                                    : account.balance
                                            }
                                            size="sm"
                                        />
                                        {account.payoff && (
                                            <span className="text-ink-2 ml-1.5 text-xs">
                                                {account.kind === 'receivable'
                                                    ? 'to collect'
                                                    : 'left to pay'}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                {account.payoff &&
                                    account.payoff.original.cents > 0 && (
                                        <div className="mt-2">
                                            <div
                                                className="bg-rule-soft h-[5px] overflow-hidden rounded-[1px]"
                                                role="progressbar"
                                                aria-valuenow={
                                                    account.payoff.pct
                                                }
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-label={`${account.name} ${
                                                    account.kind ===
                                                    'receivable'
                                                        ? 'collected'
                                                        : 'paid off'
                                                }`}
                                            >
                                                <div
                                                    className={cn(
                                                        'h-full rounded-[1px]',
                                                        account.kind ===
                                                            'receivable'
                                                            ? 'bg-credit'
                                                            : 'bg-band',
                                                    )}
                                                    style={{
                                                        width: `${account.payoff.pct}%`,
                                                    }}
                                                />
                                            </div>
                                            <p className="text-ink-2 figures mt-1.5 text-xs">
                                                {peso(account.payoff.paid)} of{' '}
                                                {peso(account.payoff.original)}{' '}
                                                {account.kind === 'receivable'
                                                    ? 'collected'
                                                    : 'paid'}{' '}
                                                · {account.payoff.pct}%
                                            </p>
                                        </div>
                                    )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

function SectionLink({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="text-band hover:text-band-hover inline-flex items-center gap-1 rounded-sm text-sm font-semibold whitespace-nowrap"
        >
            {children}
            <ArrowRight className="size-3.5" aria-hidden />
        </Link>
    );
}

export default function Dashboard({ data }: { data: DashboardData }) {
    const user = usePage().props.auth.user;
    const passiveTotal = sumCents(data.passiveIncome);
    const interestPaidTotal = sumCents(data.interestPaid);
    const hasAccounts = data.accounts.length > 0;

    const dueColumn = (
        <div className="border-rule border-t p-5 sm:p-7 lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:border-t-0 lg:border-l xl:col-span-5 xl:col-start-8">
            <AmountDue upcoming={data.upcoming} />
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <header className="mb-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-4 sm:mb-8">
                <div className="min-w-0">
                    <h1 className="text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.025em] [font-stretch:106%] sm:text-[2rem]">
                        {monthLabel(data.month)}
                    </h1>
                    <p className="text-ink-2 mt-2 text-[0.9375rem]">
                        Statement for {user.name}
                    </p>
                </div>
                <dl className="flex gap-8">
                    <StatementField label="Issued">
                        <span className="figures text-sm font-medium">
                            {formatDate(todayISO())}
                        </span>
                    </StatementField>
                    <StatementField label="Period">
                        <span className="figures text-sm font-medium">
                            {periodLabel(data.month)}
                        </span>
                    </StatementField>
                </dl>
            </header>

            {/* On a phone the sheet reads top to bottom: what you stand on,
                what is due, then this month's movement. From lg the due box
                takes its own column beside the other two. */}
            <Card className="gap-0 p-0 sm:p-0 lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
                {hasAccounts ? (
                    <>
                        <div className="p-5 sm:p-7 lg:col-span-6 lg:row-start-1 xl:col-span-7">
                            <SummaryLadder data={data} />
                        </div>
                        {dueColumn}
                        <div className="border-rule border-t p-5 sm:p-7 lg:col-span-6 lg:col-start-1 lg:row-start-2 xl:col-span-7">
                            <ThisPeriod data={data} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="px-5 sm:px-7 lg:col-span-6 lg:row-span-2 xl:col-span-7">
                            <EmptyState
                                title="Nothing on your statement yet"
                                action={
                                    <Button asChild>
                                        <Link href={route('accounts.index')}>
                                            Add an account
                                        </Link>
                                    </Button>
                                }
                            >
                                Add the accounts you keep money in, the loans
                                you're paying off, and anything people owe you.
                                Your net worth and bills will be worked out
                                here.
                            </EmptyState>
                        </div>
                        {dueColumn}
                    </>
                )}
            </Card>

            {data.upcoming.length > 0 && (
                <section aria-labelledby="upcoming-heading" className="mt-10">
                    <div className="flex items-baseline justify-between gap-4">
                        <h2
                            id="upcoming-heading"
                            className="text-[1.0625rem] font-semibold tracking-[-0.01em]"
                        >
                            Upcoming
                        </h2>
                        <SectionLink
                            href={route('scheduled-transactions.index')}
                        >
                            Manage schedules
                        </SectionLink>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {data.upcoming.map((item) => (
                            <UpcomingStub key={item.id} item={item} />
                        ))}
                    </div>
                </section>
            )}

            <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:items-start">
                <Card>
                    <Fold
                        title="Expenses by category"
                        className="px-(--card-spacing)"
                        summary={
                            <Amount
                                value={data.thisMonth.expense}
                                size="sm"
                                className="text-ink-2"
                            />
                        }
                        action={
                            <SectionLink href={route('transactions.index')}>
                                Transactions
                            </SectionLink>
                        }
                    >
                        <p className="text-ink-2 mb-3 text-sm">
                            {monthLabel(data.month)}
                        </p>
                        <Itemized
                            rows={data.spendingByCategory}
                            totalLabel="Total expenses"
                            empty={`No expenses recorded in ${monthLabel(data.month)} yet.`}
                        />
                    </Fold>
                </Card>

                {/* Interest both ways, side by side: what loans earn you and what debts cost you. */}
                <div className="grid gap-6">
                    <Card>
                        <Fold
                            title="Passive income"
                            className="px-(--card-spacing)"
                            summary={
                                passiveTotal > 0 ? (
                                    <span className="text-credit figures text-sm font-medium">
                                        +{peso(passiveTotal)}/mo
                                    </span>
                                ) : undefined
                            }
                        >
                            <p className="text-ink-2 mb-3 text-sm">
                                Monthly interest on money owed to you
                            </p>
                            <Itemized
                                rows={data.passiveIncome}
                                totalLabel="Per month"
                                empty="No interest on money owed to you yet."
                            />
                        </Fold>
                    </Card>

                    <Card>
                        <Fold
                            title="Interest you pay"
                            className="px-(--card-spacing)"
                            summary={
                                interestPaidTotal > 0 ? (
                                    <span className="figures text-sm font-medium">
                                        {MINUS}
                                        {peso(interestPaidTotal)}/mo
                                    </span>
                                ) : undefined
                            }
                        >
                            <p className="text-ink-2 mb-3 text-sm">
                                Monthly interest on money you owe
                            </p>
                            <Itemized
                                rows={data.interestPaid}
                                totalLabel="Per month"
                                empty="You're not paying interest on any debts right now."
                            />
                        </Fold>
                    </Card>
                </div>
            </div>

            {hasAccounts && (
                <Card className="mt-6">
                    <Fold
                        title="Accounts"
                        className="px-(--card-spacing)"
                        summary={
                            <span className="text-ink-2 text-sm">
                                {data.accounts.length}{' '}
                                {data.accounts.length === 1
                                    ? 'account'
                                    : 'accounts'}
                            </span>
                        }
                        action={
                            <SectionLink href={route('accounts.index')}>
                                All accounts
                            </SectionLink>
                        }
                    >
                        <p className="text-ink-2 mb-4 text-sm">
                            Current balances and debt payoff progress
                        </p>
                        <AccountLines accounts={data.accounts} />
                    </Fold>
                </Card>
            )}
        </AuthenticatedLayout>
    );
}
