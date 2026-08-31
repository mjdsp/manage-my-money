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
import { formatDate, peso } from '@/lib/format';
import type { Account, AccountKind } from '@/types/models';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

type FormShape = {
    name: string;
    kind: AccountKind;
    opening_balance: string;
    bank_name: string;
    interest_rate: string;
    lender: string;
    borrowed_on: string;
    monthly_interest_rate: string;
    due_day_of_month: string;
    term_months: string;
    scheduled_payment: string;
    total_repayment: string;
    is_archived: boolean;
};

const blank: FormShape = {
    name: '',
    kind: 'asset',
    opening_balance: '',
    bank_name: '',
    interest_rate: '',
    lender: '',
    borrowed_on: '',
    monthly_interest_rate: '',
    due_day_of_month: '',
    term_months: '',
    scheduled_payment: '',
    total_repayment: '',
    is_archived: false,
};

/** Which field drives the flat / add-on repayment maths ('manual' = no maths). */
type DeriveMode = 'manual' | 'rate' | 'payment' | 'total';

function toNumber(value: string): number {
    const n = parseFloat(value.replace(/,/g, ''));
    return Number.isFinite(n) ? n : NaN;
}

/**
 * Flat / add-on plan. Given the starting balance owed (P), the term in months
 * (n) and exactly one of {monthly rate %, monthly payment, total to be paid},
 * return all three as fixed strings.
 *
 *   totalInterest = P × (rate / 100) × n
 *   total         = P + totalInterest      (also = payment × n)
 *   payment       = total / n
 */
function repaymentPlan(
    mode: DeriveMode,
    principal: number,
    months: number,
    rate: number,
    payment: number,
    total: number,
): { rate: string; payment: string; total: string } | null {
    if (!(principal > 0) || !(months > 0)) return null;

    let resolvedTotal: number;
    if (mode === 'rate') {
        if (!(rate >= 0)) return null;
        resolvedTotal = principal * (1 + (rate / 100) * months);
    } else if (mode === 'payment') {
        if (!(payment > 0)) return null;
        resolvedTotal = payment * months;
    } else if (mode === 'total') {
        if (!(total > 0)) return null;
        resolvedTotal = total;
    } else {
        return null;
    }

    return {
        rate: (
            ((resolvedTotal - principal) / (principal * months)) *
            100
        ).toFixed(3),
        payment: (resolvedTotal / months).toFixed(2),
        total: resolvedTotal.toFixed(2),
    };
}

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
                  borrowed_on: account.borrowed_on ?? '',
                  monthly_interest_rate: account.monthly_interest_rate ?? '',
                  due_day_of_month: account.due_day_of_month?.toString() ?? '',
                  term_months: account.term_months?.toString() ?? '',
                  scheduled_payment:
                      account.scheduled_payment_amount?.pesos.toString() ?? '',
                  total_repayment:
                      account.total_repayment?.pesos.toString() ?? '',
                  is_archived: account.is_archived,
              }
            : blank,
    );

    const isLiability = form.data.kind === 'liability';
    const isReceivable = form.data.kind === 'receivable';
    // Liability and receivable share the same borrower + repayment-plan fields.
    const hasPlan = isLiability || isReceivable;
    const personLabel = isReceivable ? 'Borrower' : 'Lender';
    const owedLabel = isReceivable
        ? 'Starting amount owed to you'
        : 'Starting balance owed';

    const [derive, setDerive] = useState<DeriveMode>('manual');

    // Starting balance owed: typed on the create form, fixed on the edit form.
    const principalPesos = editing
        ? (account?.starting_principal?.pesos ?? 0)
        : toNumber(form.data.opening_balance);
    const months = toNumber(form.data.term_months);
    const lock = (field: DeriveMode) => derive !== 'manual' && derive !== field;

    // When a driver field is chosen, keep the other two in sync.
    useEffect(() => {
        if (derive === 'manual') return;
        const plan = repaymentPlan(
            derive,
            principalPesos,
            months,
            toNumber(form.data.monthly_interest_rate),
            toNumber(form.data.scheduled_payment),
            toNumber(form.data.total_repayment),
        );
        if (!plan) return;
        if (
            derive !== 'rate' &&
            form.data.monthly_interest_rate !== plan.rate
        ) {
            form.setData('monthly_interest_rate', plan.rate);
        }
        if (
            derive !== 'payment' &&
            form.data.scheduled_payment !== plan.payment
        ) {
            form.setData('scheduled_payment', plan.payment);
        }
        if (derive !== 'total' && form.data.total_repayment !== plan.total) {
            form.setData('total_repayment', plan.total);
        }
    }, [
        derive,
        principalPesos,
        months,
        form.data.monthly_interest_rate,
        form.data.scheduled_payment,
        form.data.total_repayment,
    ]);

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
                                        <SelectItem value="receivable">
                                            Money owed to me (a person&apos;s
                                            debt)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field
                                label={hasPlan ? owedLabel : 'Opening balance'}
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

                    {!hasPlan && (
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

                    {hasPlan && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label={personLabel}
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
                            </div>

                            {isReceivable && (
                                <Field
                                    label="Date borrowed"
                                    error={form.errors.borrowed_on}
                                >
                                    <Input
                                        type="date"
                                        value={form.data.borrowed_on}
                                        onChange={(e) =>
                                            form.setData(
                                                'borrowed_on',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            )}

                            <Field label="Auto-fill the repayment plan from">
                                <Select
                                    value={derive}
                                    onValueChange={(v) =>
                                        setDerive(v as DeriveMode)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">
                                            Manual entry
                                        </SelectItem>
                                        <SelectItem value="rate">
                                            Monthly interest %
                                        </SelectItem>
                                        <SelectItem value="payment">
                                            Monthly payment
                                        </SelectItem>
                                        <SelectItem value="total">
                                            {isReceivable
                                                ? 'Total to be repaid to you'
                                                : 'Total amount to be paid'}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            {derive !== 'manual' && (
                                <p className="text-xs text-gray-500">
                                    Flat / add-on interest. Fill in
                                    {editing
                                        ? ' the term'
                                        : ` ${owedLabel.toLowerCase()} and term`}
                                    , plus the field above — the other two are
                                    calculated.
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Term (months)"
                                    error={form.errors.term_months}
                                >
                                    <Input
                                        inputMode="numeric"
                                        value={form.data.term_months}
                                        onChange={(e) =>
                                            form.setData(
                                                'term_months',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Monthly interest %"
                                    error={form.errors.monthly_interest_rate}
                                >
                                    <Input
                                        inputMode="decimal"
                                        disabled={lock('rate')}
                                        value={form.data.monthly_interest_rate}
                                        onChange={(e) =>
                                            form.setData(
                                                'monthly_interest_rate',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label={
                                        isReceivable
                                            ? 'Monthly repayment'
                                            : 'Monthly payment'
                                    }
                                    error={form.errors.scheduled_payment}
                                >
                                    <Input
                                        inputMode="decimal"
                                        disabled={lock('payment')}
                                        value={form.data.scheduled_payment}
                                        onChange={(e) =>
                                            form.setData(
                                                'scheduled_payment',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label={
                                        isReceivable
                                            ? 'Total to be repaid to you'
                                            : 'Total amount to be paid'
                                    }
                                    error={form.errors.total_repayment}
                                >
                                    <Input
                                        inputMode="decimal"
                                        disabled={lock('total')}
                                        value={form.data.total_repayment}
                                        onChange={(e) =>
                                            form.setData(
                                                'total_repayment',
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
    const form = useForm();

    function archive(account: Account) {
        form.patch(route('accounts.archive', account.id), {
            preserveScroll: true,
        });
    }

    function restore(account: Account) {
        form.patch(route('accounts.restore', account.id), {
            preserveScroll: true,
        });
    }

    function remove(account: Account) {
        if (
            window.confirm(
                `Permanently delete “${account.name}”? This cannot be undone.`,
            )
        ) {
            form.delete(route('accounts.destroy', account.id), {
                preserveScroll: true,
            });
        }
    }

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
                                                  account.borrowed_on &&
                                                      `borrowed ${formatDate(account.borrowed_on)}`,
                                                  account.monthly_interest_rate &&
                                                      `${account.monthly_interest_rate}% / mo`,
                                                  account.term_months &&
                                                      `${account.term_months} mo term`,
                                                  account.due_day_of_month &&
                                                      `due day ${account.due_day_of_month}`,
                                                  account.total_repayment &&
                                                      `${peso(account.total_repayment)} ${account.kind === 'receivable' ? 'to collect' : 'to repay'}`,
                                              ]
                                                  .filter(Boolean)
                                                  .join(' · ') || '—'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">
                                        {peso(account.balance)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap justify-end gap-1">
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
                                            {account.is_archived ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={form.processing}
                                                    onClick={() =>
                                                        restore(account)
                                                    }
                                                >
                                                    Restore
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={form.processing}
                                                    onClick={() =>
                                                        archive(account)
                                                    }
                                                >
                                                    Archive
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                disabled={form.processing}
                                                title={
                                                    account.in_use
                                                        ? 'Has transactions or scheduled payments — archive instead'
                                                        : undefined
                                                }
                                                onClick={() => remove(account)}
                                            >
                                                Delete
                                            </Button>
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
    const receivables = accounts.filter((a) => a.kind === 'receivable');

    return (
        <AuthenticatedLayout>
            <Head title="Accounts" />
            <PageHeader
                title="Accounts"
                description="Cash and savings, the debts you owe, and what people owe you."
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
                <AccountTable
                    title="Money owed to me"
                    description="Debts family and friends owe you. Counts towards your net worth."
                    accounts={receivables}
                />
            </div>
        </AuthenticatedLayout>
    );
}
