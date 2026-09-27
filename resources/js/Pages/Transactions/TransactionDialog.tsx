import FormField from '@/Components/FormField';
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
import { todayISO } from '@/lib/format';
import type {
    AccountRef,
    Category,
    Transaction,
    TransactionType,
} from '@/types/models';
import { router, useForm } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';

type AccountOption = Pick<AccountRef, 'id' | 'name'> & { kind: string };

type FormShape = {
    type: Exclude<TransactionType, 'adjustment'>;
    amount: string;
    date: string;
    description: string;
    category_id: string;
    from_account_id: string;
    to_account_id: string;
};

const NONE = 'none';

/**
 * Add or edit a transaction. Pass `trigger` for a self-contained dialog, or
 * `open` / `onOpenChange` to drive one shared dialog from a list.
 */
export default function TransactionDialog({
    trigger,
    transaction,
    accounts,
    categories,
    open: controlledOpen,
    onOpenChange,
}: {
    trigger?: ReactNode;
    transaction?: Transaction;
    accounts: AccountOption[];
    categories: Category[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const open = controlledOpen ?? uncontrolledOpen;
    const setOpen = onOpenChange ?? setUncontrolledOpen;
    const [deleting, setDeleting] = useState(false);
    const editing = Boolean(transaction);

    const today = todayISO();

    const form = useForm<FormShape>({
        type: (transaction?.type as FormShape['type']) ?? 'expense',
        amount: transaction ? String(transaction.amount.pesos) : '',
        date: transaction?.date ? transaction.date.slice(0, 10) : today,
        description: transaction?.description ?? '',
        category_id: transaction?.category_id
            ? String(transaction.category_id)
            : NONE,
        from_account_id: transaction?.from_account_id
            ? String(transaction.from_account_id)
            : NONE,
        to_account_id: transaction?.to_account_id
            ? String(transaction.to_account_id)
            : NONE,
    });

    const { type } = form.data;
    const showFrom = type === 'expense' || type === 'transfer';
    const showTo = type === 'income' || type === 'transfer';
    const showCategory = type === 'income' || type === 'expense';
    const categoryChoices = categories.filter((c) => c.kind === type);

    // Switching type changes which of category / from / to apply; drop the ones
    // that no longer do so a stale value can't be submitted against a hidden
    // field.
    function changeType(next: FormShape['type']) {
        form.setData((data) => ({
            ...data,
            type: next,
            category_id: NONE,
            from_account_id: NONE,
            to_account_id: NONE,
        }));
        form.clearErrors('category_id', 'from_account_id', 'to_account_id');
    }

    function submit(e: FormEvent) {
        e.preventDefault();
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
                if (!editing) form.reset('amount', 'description');
            },
        };

        if (editing) {
            form.put(route('transactions.update', transaction!.id), opts);
        } else {
            form.post(route('transactions.store'), opts);
        }
    }

    function destroy() {
        if (!transaction) return;
        if (
            !window.confirm('Delete this transaction? This cannot be undone.')
        ) {
            return;
        }
        setDeleting(true);
        router.delete(route('transactions.destroy', transaction.id), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
            onFinish: () => setDeleting(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? 'Edit transaction' : 'New transaction'}
                    </DialogTitle>
                    <DialogDescription>
                        {editing
                            ? 'Changes update every balance this touches.'
                            : 'Money in, money out, or a move between your accounts.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
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
                                autoFocus
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Date" error={form.errors.date}>
                            <Input
                                type="date"
                                value={form.data.date}
                                onChange={(e) =>
                                    form.setData('date', e.target.value)
                                }
                            />
                        </FormField>
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
                                        {categoryChoices.map((c) => (
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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

                    <FormField
                        label="Description"
                        error={form.errors.description}
                    >
                        <Input
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                        />
                    </FormField>

                    <DialogFooter className="mt-2">
                        {editing && (
                            <Button
                                type="button"
                                variant="destructive"
                                className="sm:mr-auto"
                                disabled={deleting || form.processing}
                                onClick={destroy}
                            >
                                Delete
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={form.processing || deleting}
                        >
                            {editing ? 'Save changes' : 'Add transaction'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
