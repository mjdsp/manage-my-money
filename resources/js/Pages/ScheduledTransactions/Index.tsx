import Checkbox from '@/Components/Checkbox';
import EmptyState from '@/Components/EmptyState';
import FormField from '@/Components/FormField';
import PageHeader from '@/Components/PageHeader';
import Stub from '@/Components/Stub';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { titleCase, todayISO } from '@/lib/format';
import type {
    Category,
    ScheduledTransaction,
    TransactionType,
} from '@/types/models';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowRight, Pencil, Plus, Trash2 } from 'lucide-react';
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
                    <DialogDescription>
                        A bill, subscription or payment that repeats every month
                        on the same day.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <FormField
                        label="Description"
                        error={form.errors.description}
                    >
                        <Input
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            autoFocus
                        />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Type" error={form.errors.type}>
                            <Select
                                value={type}
                                onValueChange={(v) =>
                                    changeType(v as FormShape['type'])
                                }
                            >
                                <SelectTrigger className="w-full">
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
                        </FormField>
                        <FormField label="Amount" error={form.errors.amount}>
                            <Input
                                inputMode="decimal"
                                placeholder="0.00"
                                className="figures"
                                value={form.data.amount}
                                onChange={(e) =>
                                    form.setData('amount', e.target.value)
                                }
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <FormField
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
                        </FormField>
                        <FormField
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
                        </FormField>
                        <FormField
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
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {showCategory && (
                            <FormField
                                label="Category"
                                error={form.errors.category_id}
                            >
                                <Select
                                    value={form.data.category_id}
                                    onValueChange={(v) =>
                                        form.setData('category_id', v)
                                    }
                                >
                                    <SelectTrigger className="w-full">
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
                            </FormField>
                        )}
                        {showFrom && (
                            <FormField
                                label="From account"
                                error={form.errors.from_account_id}
                            >
                                <Select
                                    value={
                                        form.data.from_account_id === NONE
                                            ? ''
                                            : form.data.from_account_id
                                    }
                                    onValueChange={(v) =>
                                        form.setData('from_account_id', v)
                                    }
                                >
                                    <SelectTrigger className="w-full">
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
                            </FormField>
                        )}
                        {showTo && (
                            <FormField
                                label="To account"
                                error={form.errors.to_account_id}
                            >
                                <Select
                                    value={
                                        form.data.to_account_id === NONE
                                            ? ''
                                            : form.data.to_account_id
                                    }
                                    onValueChange={(v) =>
                                        form.setData('to_account_id', v)
                                    }
                                >
                                    <SelectTrigger className="w-full">
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
                            </FormField>
                        )}
                    </div>

                    <div className="border-rule grid gap-3 border-t pt-4">
                        <label className="flex items-center gap-2.5 text-sm">
                            <Checkbox
                                checked={form.data.is_active}
                                onChange={(e) =>
                                    form.setData('is_active', e.target.checked)
                                }
                            />
                            Active
                        </label>
                        <label className="flex items-center gap-2.5 text-sm">
                            <Checkbox
                                checked={form.data.auto_post}
                                onChange={(e) =>
                                    form.setData('auto_post', e.target.checked)
                                }
                            />
                            Auto-post when due
                        </label>
                        {form.data.auto_post && (
                            <p className="text-ink-2 text-[0.8125rem] text-pretty">
                                Posts itself to the ledger on its due date
                                (catching up any missed months) and rolls
                                forward — no need to press Post.
                            </p>
                        )}
                    </div>

                    <DialogFooter className="mt-2">
                        <Button type="submit" disabled={form.processing}>
                            {editing ? 'Save changes' : 'Create schedule'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/** The account line a payment stub prints: where the money leaves or lands. */
function accountLine(item: ScheduledTransaction): ReactNode {
    const from = item.from_account?.name;
    const to = item.to_account?.name;
    if (item.type === 'transfer' && from && to) {
        return (
            <span className="inline-flex items-center gap-1">
                {from}
                <ArrowRight className="size-3" aria-label="to" />
                {to}
            </span>
        );
    }
    if (from) return `From ${from}`;
    if (to) return `Into ${to}`;
    return null;
}

/** One schedule as a payment stub; posting tears its slip off. */
function ScheduleStub({
    item,
    accounts,
    categories,
}: {
    item: ScheduledTransaction;
    accounts: AccountOption[];
    categories: Category[];
}) {
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

    function destroy() {
        if (
            !window.confirm(
                `Delete the schedule “${item.description}”? Transactions it already posted stay in the ledger.`,
            )
        ) {
            return;
        }
        setBusy(true);
        router.delete(route('scheduled-transactions.destroy', item.id), {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    }

    return (
        <Stub
            title={item.description}
            amount={item.amount}
            dueDate={item.next_due_date}
            incoming={item.type === 'income'}
            paused={!item.is_active}
            tearing={tearing}
            meta={
                <>
                    {titleCase(item.type)} · every month on day{' '}
                    {item.day_of_month}
                    {item.category ? ` · ${item.category.name}` : ''}
                    {accountLine(item) && (
                        <span className="mt-0.5 block">
                            {accountLine(item)}
                        </span>
                    )}
                </>
            }
            stamps={
                <>
                    {!item.is_active && <Badge variant="outline">Paused</Badge>}
                    {item.auto_post && (
                        <Badge variant="secondary">Auto-post</Badge>
                    )}
                </>
            }
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
                    <span className="ml-auto flex gap-0.5">
                        <ScheduleDialog
                            item={item}
                            accounts={accounts}
                            categories={categories}
                            trigger={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-ink-2"
                                    aria-label={`Edit ${item.description}`}
                                    title="Edit"
                                >
                                    <Pencil />
                                </Button>
                            }
                        />
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-ink-2 hover:text-past-due"
                            onClick={destroy}
                            disabled={busy}
                            aria-label={`Delete ${item.description}`}
                            title="Delete"
                        >
                            <Trash2 />
                        </Button>
                    </span>
                </>
            }
        />
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
    const active = scheduledTransactions.filter((s) => s.is_active);
    const paused = scheduledTransactions.filter((s) => !s.is_active);

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
                        trigger={
                            <Button>
                                <Plus />
                                Add schedule
                            </Button>
                        }
                    />
                }
            />

            {scheduledTransactions.length === 0 ? (
                <div className="bg-paper shadow-sheet rounded-[5px] px-5">
                    <EmptyState
                        title="Nothing scheduled yet"
                        action={
                            <ScheduleDialog
                                accounts={accounts}
                                categories={categories}
                                trigger={
                                    <Button variant="outline">
                                        <Plus />
                                        Add your first schedule
                                    </Button>
                                }
                            />
                        }
                    >
                        Add the bills, subscriptions and loan payments that
                        repeat each month. They show up on the dashboard as
                        their due dates come near, ready to post.
                    </EmptyState>
                </div>
            ) : (
                <div className="grid gap-10">
                    {active.length > 0 && (
                        <section aria-label="Active schedules">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {active.map((item) => (
                                    <ScheduleStub
                                        key={item.id}
                                        item={item}
                                        accounts={accounts}
                                        categories={categories}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                    {paused.length > 0 && (
                        <section aria-labelledby="paused-heading">
                            <h2
                                id="paused-heading"
                                className="text-[1.0625rem] font-semibold tracking-[-0.01em]"
                            >
                                Paused
                            </h2>
                            <p className="text-ink-2 mt-1 text-sm">
                                These stay out of the Upcoming list until you
                                make them active again.
                            </p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {paused.map((item) => (
                                    <ScheduleStub
                                        key={item.id}
                                        item={item}
                                        accounts={accounts}
                                        categories={categories}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
