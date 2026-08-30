import PageHeader from '@/Components/PageHeader';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
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
import { peso } from '@/lib/format';
import type { Account, AccountKind } from '@/types/models';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type FormShape = {
    name: string;
    kind: AccountKind;
    opening_balance: string;
    bank_name: string;
    interest_rate: string;
    lender: string;
    apr: string;
    due_day_of_month: string;
    scheduled_payment: string;
    is_archived: boolean;
};

const blank: FormShape = {
    name: '',
    kind: 'asset',
    opening_balance: '',
    bank_name: '',
    interest_rate: '',
    lender: '',
    apr: '',
    due_day_of_month: '',
    scheduled_payment: '',
    is_archived: false,
};

function AccountDialog({
    account,
    trigger,
}: {
    account?: Account;
    trigger: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const editing = Boolean(account);

    const form = useForm<FormShape>(
        account
            ? {
                  ...blank,
                  name: account.name,
                  kind: account.kind,
                  bank_name: account.bank_name ?? '',
                  interest_rate: account.interest_rate ?? '',
                  lender: account.lender ?? '',
                  apr: account.apr ?? '',
                  due_day_of_month: account.due_day_of_month?.toString() ?? '',
                  scheduled_payment:
                      account.scheduled_payment_amount?.pesos.toString() ?? '',
                  is_archived: account.is_archived,
              }
            : blank,
    );

    const isLiability = form.data.kind === 'liability';

    function submit(e: FormEvent) {
        e.preventDefault();
        const opts = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        };
        if (editing) {
            form.put(route('accounts.update', account!.id), opts);
        } else {
            form.post(route('accounts.store'), opts);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? 'Edit account' : 'New account'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Name" error={form.errors.name}>
                        <Input
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            autoFocus
                        />
                    </Field>

                    {!editing && (
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Kind" error={form.errors.kind}>
                                <Select
                                    value={form.data.kind}
                                    onValueChange={(v) =>
                                        form.setData('kind', v as AccountKind)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="asset">
                                            Asset (cash / bank / savings)
                                        </SelectItem>
                                        <SelectItem value="liability">
                                            Liability (debt / loan)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field
                                label={
                                    isLiability
                                        ? 'Starting balance owed'
                                        : 'Opening balance'
                                }
                                error={form.errors.opening_balance}
                            >
                                <Input
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={form.data.opening_balance}
                                    onChange={(e) =>
                                        form.setData(
                                            'opening_balance',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </div>
                    )}

                    {!isLiability && (
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Bank name"
                                error={form.errors.bank_name}
                            >
                                <Input
                                    value={form.data.bank_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'bank_name',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Interest rate % (annual)"
                                error={form.errors.interest_rate}
                            >
                                <Input
                                    inputMode="decimal"
                                    value={form.data.interest_rate}
                                    onChange={(e) =>
                                        form.setData(
                                            'interest_rate',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </div>
                    )}

                    {isLiability && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Lender"
                                    error={form.errors.lender}
                                >
                                    <Input
                                        value={form.data.lender}
                                        onChange={(e) =>
                                            form.setData(
                                                'lender',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="APR % (annual)"
                                    error={form.errors.apr}
                                >
                                    <Input
                                        inputMode="decimal"
                                        value={form.data.apr}
                                        onChange={(e) =>
                                            form.setData('apr', e.target.value)
                                        }
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Due day of month"
                                    error={form.errors.due_day_of_month}
                                >
                                    <Input
                                        inputMode="numeric"
                                        value={form.data.due_day_of_month}
                                        onChange={(e) =>
                                            form.setData(
                                                'due_day_of_month',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Scheduled payment"
                                    error={form.errors.scheduled_payment}
                                >
                                    <Input
                                        inputMode="decimal"
                                        value={form.data.scheduled_payment}
                                        onChange={(e) =>
                                            form.setData(
                                                'scheduled_payment',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                        </>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>
                            {editing ? 'Save changes' : 'Create account'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}

function AccountTable({
    title,
    description,
    accounts,
}: {
    title: string;
    description: string;
    accounts: Account[];
}) {
    const { delete: destroy } = useForm();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {accounts.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500">
                        Nothing here yet.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">
                                    Balance
                                </TableHead>
                                <TableHead className="w-1" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.map((account) => (
                                <TableRow
                                    key={account.id}
                                    className={
                                        account.is_archived ? 'opacity-50' : ''
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {account.name}
                                        {account.is_archived && (
                                            <Badge
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                archived
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {account.kind === 'asset'
                                            ? [
                                                  account.bank_name,
                                                  account.interest_rate &&
                                                      `${account.interest_rate}%`,
                                              ]
                                                  .filter(Boolean)
                                                  .join(' · ') || '—'
                                            : [
                                                  account.lender,
                                                  account.apr &&
                                                      `${account.apr}% APR`,
                                                  account.due_day_of_month &&
                                                      `due day ${account.due_day_of_month}`,
                                              ]
                                                  .filter(Boolean)
                                                  .join(' · ') || '—'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">
                                        {peso(account.balance)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <AccountDialog
                                                account={account}
                                                trigger={
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        Edit
                                                    </Button>
                                                }
                                            />
                                            {!account.is_archived && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        destroy(
                                                            route(
                                                                'accounts.destroy',
                                                                account.id,
                                                            ),
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    Archive
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

export default function AccountsIndex({ accounts }: { accounts: Account[] }) {
    const assets = accounts.filter((a) => a.kind === 'asset');
    const liabilities = accounts.filter((a) => a.kind === 'liability');

    return (
        <AuthenticatedLayout>
            <Head title="Accounts" />
            <PageHeader
                title="Accounts"
                description="Cash, bank and savings accounts, plus the debts you owe."
                actions={
                    <AccountDialog trigger={<Button>Add account</Button>} />
                }
            />
            <div className="space-y-6">
                <AccountTable
                    title="Assets"
                    description="Money you have."
                    accounts={assets}
                />
                <AccountTable
                    title="Liabilities"
                    description="Money you owe."
                    accounts={liabilities}
                />
            </div>
        </AuthenticatedLayout>
    );
}
