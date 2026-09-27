import Amount from '@/Components/Amount';
import EmptyState from '@/Components/EmptyState';
import FormField from '@/Components/FormField';
import PageHeader from '@/Components/PageHeader';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
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
import { formatDate, monthLabel } from '@/lib/format';
import type {
    Category,
    Paginated,
    Transaction,
    TransactionType,
} from '@/types/models';
import { Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import TransactionDialog from './TransactionDialog';

type AccountOption = { id: number; name: string; kind: string };

type Filters = {
    month: string;
    account: number | null;
    category: number | null;
    type: string | null;
};

const ALL = 'all';

/** How each type prints its amount: direction mark and ink. */
const amountStyle: Record<
    TransactionType,
    { sign: 'plus' | 'minus' | 'none'; tone: 'credit' | 'ink' | 'muted' }
> = {
    income: { sign: 'plus', tone: 'credit' },
    expense: { sign: 'minus', tone: 'ink' },
    transfer: { sign: 'none', tone: 'muted' },
    adjustment: { sign: 'none', tone: 'muted' },
};

function TypeStamp({ type }: { type: TransactionType }) {
    if (type === 'transfer') return <Badge variant="outline">Transfer</Badge>;
    if (type === 'adjustment')
        return <Badge variant="outline">Adjustment</Badge>;
    return null;
}

function AccountPath({ transaction }: { transaction: Transaction }) {
    const from = transaction.from_account?.name;
    const to = transaction.to_account?.name;
    if (!from && !to) return <span className="text-ink-3">—</span>;
    return (
        <span className="inline-flex items-center gap-1.5">
            {from}
            {from && to && (
                <ArrowRight className="text-ink-3 size-3.5" aria-label="to" />
            )}
            {to}
        </span>
    );
}

function destroy(transaction: Transaction) {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) {
        return;
    }
    router.delete(route('transactions.destroy', transaction.id), {
        preserveScroll: true,
    });
}

export default function TransactionsIndex({
    transactions,
    filters,
    accounts,
    categories,
}: {
    transactions: Paginated<Transaction>;
    filters: Filters;
    accounts: AccountOption[];
    categories: Category[];
}) {
    // The dialog stays mounted after closing so it can animate out.
    const [editing, setEditing] = useState<Transaction | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    function edit(transaction: Transaction) {
        setEditing(transaction);
        setEditOpen(true);
    }
    const hasFilters = Boolean(
        filters.account || filters.category || filters.type,
    );

    function apply(patch: Partial<Record<string, string | null>>) {
        const next: Record<string, string> = {
            month: filters.month,
            account: filters.account ? String(filters.account) : '',
            category: filters.category ? String(filters.category) : '',
            type: filters.type ?? '',
            ...Object.fromEntries(
                Object.entries(patch).map(([k, v]) => [k, v ?? '']),
            ),
        };
        router.get(route('transactions.index'), next, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

    const rows = transactions.data;
    const first = (transactions.current_page - 1) * transactions.per_page + 1;
    const last = first + rows.length - 1;

    return (
        <AuthenticatedLayout>
            <Head title="Transactions" />
            <PageHeader
                title="Transactions"
                description="Every peso in and out, one row at a time."
                actions={
                    <TransactionDialog
                        accounts={accounts}
                        categories={categories}
                        trigger={
                            <Button>
                                <Plus />
                                Add transaction
                            </Button>
                        }
                    />
                }
            />

            <div className="mb-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
                <FormField label="Month" className="sm:w-44">
                    <Input
                        type="month"
                        value={filters.month}
                        onChange={(e) => apply({ month: e.target.value })}
                    />
                </FormField>
                <FormField label="Type" className="sm:w-40">
                    <Select
                        value={filters.type ?? ALL}
                        onValueChange={(v) =>
                            apply({ type: v === ALL ? null : v })
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Any type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Any type</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                            <SelectItem value="adjustment">
                                Adjustment
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </FormField>
                <FormField label="Account" className="sm:w-48">
                    <Select
                        value={filters.account ? String(filters.account) : ALL}
                        onValueChange={(v) =>
                            apply({ account: v === ALL ? null : v })
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Any account" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Any account</SelectItem>
                            {accounts.map((a) => (
                                <SelectItem key={a.id} value={String(a.id)}>
                                    {a.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>
                <FormField label="Category" className="sm:w-48">
                    <Select
                        value={
                            filters.category ? String(filters.category) : ALL
                        }
                        onValueChange={(v) =>
                            apply({ category: v === ALL ? null : v })
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Any category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Any category</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>
                {hasFilters && (
                    <Button
                        variant="ghost"
                        className="col-span-2 justify-self-start sm:mb-0"
                        onClick={() =>
                            apply({ account: null, category: null, type: null })
                        }
                    >
                        Clear filters
                    </Button>
                )}
            </div>

            <Card>
                <CardContent>
                    <p className="text-ink-2 mb-3 text-sm">
                        {transactions.total === 0
                            ? 'No transactions'
                            : `${first}–${last} of ${transactions.total}`}
                        {filters.month && <> · {monthLabel(filters.month)}</>}
                    </p>

                    {rows.length === 0 ? (
                        <EmptyState
                            title={
                                hasFilters
                                    ? 'Nothing matches these filters'
                                    : 'No transactions this month'
                            }
                            action={
                                hasFilters ? (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            apply({
                                                account: null,
                                                category: null,
                                                type: null,
                                            })
                                        }
                                    >
                                        Clear filters
                                    </Button>
                                ) : undefined
                            }
                        >
                            {hasFilters
                                ? 'Try another month, or clear the filters to see everything.'
                                : 'Record income, expenses and transfers as they happen, or post a scheduled payment.'}
                        </EmptyState>
                    ) : (
                        <>
                            {/* Phone: a ledger grouped by day; tap a line to edit it. */}
                            <ol className="md:hidden">
                                {rows.map((t, i) => {
                                    const style = amountStyle[t.type];
                                    const newDay =
                                        i === 0 ||
                                        rows[i - 1].date.slice(0, 10) !==
                                            t.date.slice(0, 10);
                                    return (
                                        <Fragment key={t.id}>
                                            {newDay && (
                                                <li
                                                    aria-hidden
                                                    className="label-caps text-ink-2 border-ink border-b pt-4 pb-1.5 first:pt-0"
                                                >
                                                    {formatDate(t.date)}
                                                </li>
                                            )}
                                            <li className="border-rule border-b last:border-0">
                                                <button
                                                    type="button"
                                                    onClick={() => edit(t)}
                                                    className="active:bg-muted -mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-sm px-2 py-3 text-left"
                                                >
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-[0.9375rem] font-medium">
                                                            {t.description ||
                                                                t.category
                                                                    ?.name ||
                                                                'Untitled'}
                                                        </span>
                                                        <span className="text-ink-2 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem]">
                                                            <span className="sr-only">
                                                                {formatDate(
                                                                    t.date,
                                                                )}
                                                            </span>
                                                            {t.category && (
                                                                <>
                                                                    <span>
                                                                        {
                                                                            t
                                                                                .category
                                                                                .name
                                                                        }
                                                                    </span>
                                                                    <span
                                                                        aria-hidden
                                                                    >
                                                                        ·
                                                                    </span>
                                                                </>
                                                            )}
                                                            <AccountPath
                                                                transaction={t}
                                                            />
                                                            <TypeStamp
                                                                type={t.type}
                                                            />
                                                        </span>
                                                    </span>
                                                    <Amount
                                                        value={t.amount}
                                                        sign={style.sign}
                                                        tone={style.tone}
                                                    />
                                                </button>
                                            </li>
                                        </Fragment>
                                    );
                                })}
                            </ol>

                            {/* From md: the full ledger table. */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-32">
                                                Date
                                            </TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Accounts</TableHead>
                                            <TableHead className="text-right">
                                                Amount
                                            </TableHead>
                                            <TableHead className="w-20">
                                                <span className="sr-only">
                                                    Actions
                                                </span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((t) => {
                                            const style = amountStyle[t.type];
                                            return (
                                                <TableRow key={t.id}>
                                                    <TableCell className="text-ink-2">
                                                        {formatDate(t.date)}
                                                    </TableCell>
                                                    <TableCell className="max-w-72 whitespace-normal">
                                                        <span className="mr-2 font-medium">
                                                            {t.description || (
                                                                <span className="text-ink-3">
                                                                    —
                                                                </span>
                                                            )}
                                                        </span>
                                                        <TypeStamp
                                                            type={t.type}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-ink-2">
                                                        {t.category?.name ?? (
                                                            <span className="text-ink-3">
                                                                —
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-ink-2">
                                                        <AccountPath
                                                            transaction={t}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Amount
                                                            value={t.amount}
                                                            sign={style.sign}
                                                            tone={style.tone}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end gap-0.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                className="text-ink-2"
                                                                onClick={() =>
                                                                    edit(t)
                                                                }
                                                                aria-label={`Edit ${t.description || 'transaction'}`}
                                                                title="Edit"
                                                            >
                                                                <Pencil />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                className="text-ink-2 hover:text-past-due"
                                                                onClick={() =>
                                                                    destroy(t)
                                                                }
                                                                aria-label={`Delete ${t.description || 'transaction'}`}
                                                                title="Delete"
                                                            >
                                                                <Trash2 />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {transactions.last_page > 1 && (
                <nav
                    aria-label="Pages"
                    className="mt-5 flex flex-wrap items-center justify-between gap-3"
                >
                    <p className="text-ink-2 text-sm">
                        Page {transactions.current_page} of{' '}
                        {transactions.last_page}
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {transactions.links.map((link, i) => {
                            const isPrev = i === 0;
                            const isNext = i === transactions.links.length - 1;
                            const label = isPrev
                                ? 'Previous'
                                : isNext
                                  ? 'Next'
                                  : link.label;
                            return (
                                <Button
                                    key={i}
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    disabled={!link.url}
                                    aria-current={
                                        link.active ? 'page' : undefined
                                    }
                                    className={
                                        isPrev || isNext
                                            ? ''
                                            : 'figures hidden min-w-8 sm:inline-flex'
                                    }
                                    onClick={() =>
                                        link.url &&
                                        router.visit(link.url, {
                                            preserveScroll: true,
                                            preserveState: true,
                                        })
                                    }
                                >
                                    {isPrev && <ChevronLeft />}
                                    {label}
                                    {isNext && <ChevronRight />}
                                </Button>
                            );
                        })}
                    </div>
                </nav>
            )}

            {editing && (
                <TransactionDialog
                    key={editing.id}
                    transaction={editing}
                    accounts={accounts}
                    categories={categories}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                />
            )}
        </AuthenticatedLayout>
    );
}
