import PageHeader from '@/Components/PageHeader';
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
import { formatDate, peso, titleCase } from '@/lib/format';
import type {
    Category,
    Paginated,
    Transaction,
    TransactionType,
} from '@/types/models';
import { Head, router, useForm } from '@inertiajs/react';
import TransactionDialog from './TransactionDialog';

type AccountOption = { id: number; name: string; kind: string };

type Filters = {
    month: string;
    account: number | null;
    category: number | null;
    type: string | null;
};

const ALL = 'all';

const typeColor: Record<TransactionType, string> = {
    income: 'text-emerald-600',
    expense: 'text-red-600',
    transfer: 'text-gray-600',
    adjustment: 'text-amber-600',
};

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
    const del = useForm();

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
                        trigger={<Button>Add transaction</Button>}
                    />
                }
            />

            <Card className="mb-4">
                <CardContent className="flex flex-wrap gap-3 py-4">
                    <input
                        type="month"
                        value={filters.month}
                        onChange={(e) => apply({ month: e.target.value })}
                        className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
                    />
                    <Select
                        value={filters.type ?? ALL}
                        onValueChange={(v) =>
                            apply({ type: v === ALL ? null : v })
                        }
                    >
                        <SelectTrigger className="w-40">
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
                    <Select
                        value={filters.account ? String(filters.account) : ALL}
                        onValueChange={(v) =>
                            apply({ account: v === ALL ? null : v })
                        }
                    >
                        <SelectTrigger className="w-44">
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
                    <Select
                        value={
                            filters.category ? String(filters.category) : ALL
                        }
                        onValueChange={(v) =>
                            apply({ category: v === ALL ? null : v })
                        }
                    >
                        <SelectTrigger className="w-44">
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
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Accounts</TableHead>
                                <TableHead className="text-right">
                                    Amount
                                </TableHead>
                                <TableHead className="w-1" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="py-10 text-center text-sm text-gray-500"
                                    >
                                        No transactions for this filter.
                                    </TableCell>
                                </TableRow>
                            )}
                            {transactions.data.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell className="text-sm whitespace-nowrap">
                                        {formatDate(t.date)}
                                    </TableCell>
                                    <TableCell>
                                        {t.description || (
                                            <span className="text-gray-400">
                                                —
                                            </span>
                                        )}
                                        <Badge
                                            variant="outline"
                                            className="ml-2 align-middle text-[10px]"
                                        >
                                            {titleCase(t.type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {t.category?.name ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {[
                                            t.from_account?.name,
                                            t.to_account?.name,
                                        ]
                                            .filter(Boolean)
                                            .join(' → ') || '—'}
                                    </TableCell>
                                    <TableCell
                                        className={`text-right font-medium tabular-nums ${typeColor[t.type]}`}
                                    >
                                        {t.type === 'expense' ? '−' : ''}
                                        {peso(t.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <TransactionDialog
                                                transaction={t}
                                                accounts={accounts}
                                                categories={categories}
                                                trigger={
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        Edit
                                                    </Button>
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    del.delete(
                                                        route(
                                                            'transactions.destroy',
                                                            t.id,
                                                        ),
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {transactions.last_page > 1 && (
                <div className="mt-4 flex flex-wrap gap-1">
                    {transactions.links.map((link, i) => (
                        <Button
                            key={i}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            onClick={() =>
                                link.url &&
                                router.visit(link.url, {
                                    preserveScroll: true,
                                    preserveState: true,
                                })
                            }
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
