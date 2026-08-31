import PageHeader from '@/Components/PageHeader';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
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
import { formatDate, peso, titleCase, todayISO } from '@/lib/format';
import type {
    Category,
    ScheduledTransaction,
    TransactionType,
} from '@/types/models';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';

type AccountOption = { id: number; name: string; kind: string };
const NONE = 'none';

type FormShape = {
    description: string;
    type: Exclude<TransactionType, 'adjustment'>;
    amount: string;
    day_of_month: string;
    next_due_date: string;
    lead_time_days: string;
    category_id: string;
    from_account_id: string;
    to_account_id: string;
    is_active: boolean;
    auto_post: boolean;
};

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}

function ScheduleDialog({
    trigger,
    item,
    accounts,
    categories,
}: {
    trigger: ReactNode;
    item?: ScheduledTransaction;
    accounts: AccountOption[];
    categories: Category[];
}) {
    const [open, setOpen] = useState(false);
    const editing = Boolean(item);
    const today = todayISO();

    const form = useForm<FormShape>({
        description: item?.description ?? '',
        type: (item?.type as FormShape['type']) ?? 'expense',
        amount: item ? String(item.amount.pesos) : '',
        day_of_month: item ? String(item.day_of_month) : '1',
        next_due_date: item?.next_due_date ?? today,
        lead_time_days:
            item?.lead_time_days != null ? String(item.lead_time_days) : '',
        category_id: item?.category_id ? String(item.category_id) : NONE,
        from_account_id: item?.from_account_id
            ? String(item.from_account_id)
            : NONE,
        to_account_id: item?.to_account_id ? String(item.to_account_id) : NONE,
        is_active: item?.is_active ?? true,
        auto_post: item?.auto_post ?? false,
    });

    const { type } = form.data;
    const showFrom = type === 'expense' || type === 'transfer';
    const showTo = type === 'income' || type === 'transfer';
    const showCategory = type === 'income' || type === 'expense';

    // Changing the type changes which of category / from / to even apply, so
    // clear the ones that are about to disappear. Otherwise a stale value from
    // the previous type is submitted, fails validation on a field that is no
    // longer on screen, and the form just silently refuses to save.
    function changeType(next: FormShape['type']) {
        form.setData((data) => ({
            ...data,
            type: next,
            category_id: NONE,
            from_account_id: NONE,
            to_account_id: NONE,
        }));
        form.clearErrors(
            'category_id',
            'from_account_id',
            'to_account_id',
            'type',
        );
    }

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) {
            form.clearErrors();
            if (!editing) form.reset();
        }
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        // Only ever send the fields that apply to the chosen type.
        form.transform((data) => ({
            ...data,
            category_id:
                showCategory && data.category_id !== NONE
                    ? data.category_id
                    : '',
            from_account_id:
                showFrom && data.from_account_id !== NONE
                    ? data.from_account_id
                    : '',
            to_account_id:
                showTo && data.to_account_id !== NONE ? data.to_account_id : '',
        }));
        const opts = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                if (!editing) form.reset();
            },
        };
        if (editing) {
            form.put(route('scheduled-transactions.update', item!.id), opts);
        } else {
            form.post(route('scheduled-transactions.store'), opts);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {editing
                            ? 'Edit schedule'
                            : 'New scheduled transaction'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Description" error={form.errors.description}>
                        <Input
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            autoFocus
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Type" error={form.errors.type}>
                            <Select
                                value={type}
                                onValueChange={(v) =>
                                    changeType(v as FormShape['type'])
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expense">
                                        Expense
                                    </SelectItem>
                                    <SelectItem value="income">
                                        Income
                                    </SelectItem>
                                    <SelectItem value="transfer">
                                        Transfer
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Amount" error={form.errors.amount}>
                            <Input
                                inputMode="decimal"
                                placeholder="0.00"
                                value={form.data.amount}
                                onChange={(e) =>
                                    form.setData('amount', e.target.value)
                                }
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Field
                            label="Day of month"
                            error={form.errors.day_of_month}
                        >
                            <Input
                                inputMode="numeric"
                                value={form.data.day_of_month}
                                onChange={(e) =>
                                    form.setData('day_of_month', e.target.value)
                                }
                            />
                        </Field>
                        <Field
                            label="Next due"
                            error={form.errors.next_due_date}
                        >
                            <Input
                                type="date"
                                value={form.data.next_due_date}
                                onChange={(e) =>
                                    form.setData(
                                        'next_due_date',
                                        e.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field
                            label="Lead days"
                            error={form.errors.lead_time_days}
                        >
                            <Input
                                inputMode="numeric"
                                placeholder="default"
                                value={form.data.lead_time_days}
                                onChange={(e) =>
                                    form.setData(
                                        'lead_time_days',
                                        e.target.value,
                                    )
                                }
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {showCategory && (
                            <Field
                                label="Category"
                                error={form.errors.category_id}
                            >
                                <Select
                                    value={form.data.category_id}
                                    onValueChange={(v) =>
                                        form.setData('category_id', v)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Uncategorised" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE}>
                                            Uncategorised
                                        </SelectItem>
                                        {categories
                                            .filter((c) => c.kind === type)
                                            .map((c) => (
                                                <SelectItem
                                                    key={c.id}
                                                    value={String(c.id)}
                                                >
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                        {showFrom && (
                            <Field
                                label="From account"
                                error={form.errors.from_account_id}
                            >
                                <Select
                                    value={form.data.from_account_id}
                                    onValueChange={(v) =>
                                        form.setData('from_account_id', v)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((a) => (
                                            <SelectItem
                                                key={a.id}
                                                value={String(a.id)}
                                            >
                                                {a.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                        {showTo && (
                            <Field
                                label="To account"
                                error={form.errors.to_account_id}
                            >
                                <Select
                                    value={form.data.to_account_id}
                                    onValueChange={(v) =>
                                        form.setData('to_account_id', v)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((a) => (
                                            <SelectItem
                                                key={a.id}
                                                value={String(a.id)}
                                            >
                                                {a.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(e) =>
                                    form.setData('is_active', e.target.checked)
                                }
                            />
                            Active
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.data.auto_post}
                                onChange={(e) =>
                                    form.setData('auto_post', e.target.checked)
                                }
                            />
                            Auto-post when due
                        </label>
                        {form.data.auto_post && (
                            <p className="text-xs text-gray-500">
                                Posts itself to the ledger on its due date
                                (catching up any missed months) and rolls
                                forward — no need to press Post.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>
                            {editing ? 'Save changes' : 'Create schedule'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function ScheduledIndex({
    scheduledTransactions,
    accounts,
    categories,
}: {
    scheduledTransactions: ScheduledTransaction[];
    accounts: AccountOption[];
    categories: Category[];
}) {
    const action = useForm();
    const today = todayISO();

    return (
        <AuthenticatedLayout>
            <Head title="Scheduled" />
            <PageHeader
                title="Scheduled transactions"
                description="Recurring bills, subscriptions and debt payments. These drive the Upcoming list."
                actions={
                    <ScheduleDialog
                        accounts={accounts}
                        categories={categories}
                        trigger={<Button>Add schedule</Button>}
                    />
                }
            />

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Next due</TableHead>
                                <TableHead className="text-right">
                                    Amount
                                </TableHead>
                                <TableHead className="w-1" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scheduledTransactions.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-10 text-center text-sm text-gray-500"
                                    >
                                        Nothing scheduled yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {scheduledTransactions.map((s) => {
                                const overdue = s.next_due_date <= today;
                                return (
                                    <TableRow
                                        key={s.id}
                                        className={
                                            s.is_active ? '' : 'opacity-50'
                                        }
                                    >
                                        <TableCell>
                                            <div className="font-medium">
                                                {s.description}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {titleCase(s.type)} · day{' '}
                                                {s.day_of_month}
                                                {s.category
                                                    ? ` · ${s.category.name}`
                                                    : ''}
                                                {s.auto_post && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="ml-2 text-[10px]"
                                                    >
                                                        auto-post
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm whitespace-nowrap">
                                            {formatDate(s.next_due_date)}
                                            {s.is_active && overdue && (
                                                <Badge
                                                    variant="destructive"
                                                    className="ml-2"
                                                >
                                                    due
                                                </Badge>
                                            )}
                                            {!s.is_active && (
                                                <Badge
                                                    variant="outline"
                                                    className="ml-2"
                                                >
                                                    paused
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium tabular-nums">
                                            {peso(s.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap justify-end gap-1">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={action.processing}
                                                    onClick={() =>
                                                        action.post(
                                                            route(
                                                                'scheduled-transactions.post',
                                                                s.id,
                                                            ),
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    Post
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        action.post(
                                                            route(
                                                                'scheduled-transactions.skip',
                                                                s.id,
                                                            ),
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    Skip
                                                </Button>
                                                <ScheduleDialog
                                                    item={s}
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
                                                        action.delete(
                                                            route(
                                                                'scheduled-transactions.destroy',
                                                                s.id,
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
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
