import Amount from '@/Components/Amount';
import EmptyState from '@/Components/EmptyState';
import FormField from '@/Components/FormField';
import PageHeader from '@/Components/PageHeader';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Input } from '@/Components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate, peso } from '@/lib/format';
import type { Account, AccountKind } from '@/types/models';
import { Head, useForm } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    Ellipsis,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

const NONE = 'none';

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
    deposit_account_id: string;
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
    deposit_account_id: NONE,
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
    depositAccounts = [],
}: {
    account?: Account;
    trigger: React.ReactNode;
    /** Where a new loan's money can be paid into (active assets). */
    depositAccounts?: Account[];
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

    // A new loan's money can land in one of the user's asset accounts.
    const canDeposit = !editing && isLiability && depositAccounts.length > 0;
    const depositTo = depositAccounts.find(
        (a) => String(a.id) === form.data.deposit_account_id,
    );
    const depositHint = depositTo
        ? `${principalPesos > 0 ? peso(Math.round(principalPesos * 100)) : 'The starting balance'} goes into ${depositTo.name} as loan proceeds.`
        : 'Choose the account the lender sent the money to and the amount is added there too. Skip it for a debt whose money is already spent.';

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
            form.transform((data) => ({
                ...data,
                deposit_account_id:
                    canDeposit && data.deposit_account_id !== NONE
                        ? data.deposit_account_id
                        : '',
            }));
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
                    <DialogDescription>
                        {editing
                            ? 'Balances come from the ledger; this changes the details around them.'
                            : 'Somewhere you keep money, a debt you are paying, or money someone owes you.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <FormField label="Name" error={form.errors.name}>
                        <Input
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            autoFocus
                        />
                    </FormField>

                    {!editing && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField label="Kind" error={form.errors.kind}>
                                <Select
                                    value={form.data.kind}
                                    onValueChange={(v) =>
                                        form.setData('kind', v as AccountKind)
                                    }
                                >
                                    <SelectTrigger className="w-full">
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
                            </FormField>
                            <FormField
                                label={hasPlan ? owedLabel : 'Opening balance'}
                                error={form.errors.opening_balance}
                            >
                                <Input
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    className="figures"
                                    value={form.data.opening_balance}
                                    onChange={(e) =>
                                        form.setData(
                                            'opening_balance',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                        </div>
                    )}

                    {canDeposit && (
                        <FormField
                            label="Deposited into"
                            error={form.errors.deposit_account_id}
                            hint={depositHint}
                        >
                            <Select
                                value={form.data.deposit_account_id}
                                onValueChange={(v) =>
                                    form.setData('deposit_account_id', v)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE}>
                                        Don&apos;t add it to an account
                                    </SelectItem>
                                    {depositAccounts.map((a) => (
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

                    {!hasPlan && (
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
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
                            </FormField>
                            <FormField
                                label="Interest rate % (annual)"
                                error={form.errors.interest_rate}
                            >
                                <Input
                                    inputMode="decimal"
                                    className="figures"
                                    value={form.data.interest_rate}
                                    onChange={(e) =>
                                        form.setData(
                                            'interest_rate',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                        </div>
                    )}

                    {hasPlan && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
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
                                </FormField>
                                <FormField
                                    label="Due day of month"
                                    error={form.errors.due_day_of_month}
                                >
                                    <Input
                                        inputMode="numeric"
                                        className="figures"
                                        value={form.data.due_day_of_month}
                                        onChange={(e) =>
                                            form.setData(
                                                'due_day_of_month',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </FormField>
                            </div>

                            {isReceivable && (
                                <FormField
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
                                </FormField>
                            )}

                            <div className="border-rule grid gap-4 border-t pt-4">
                                <FormField
                                    label="Auto-fill the repayment plan from"
                                    hint={
                                        derive !== 'manual'
                                            ? `Flat / add-on interest. Fill in${
                                                  editing
                                                      ? ' the term'
                                                      : ` ${owedLabel.toLowerCase()} and term`
                                              }, plus the field above — the other two are calculated.`
                                            : undefined
                                    }
                                >
                                    <Select
                                        value={derive}
                                        onValueChange={(v) =>
                                            setDerive(v as DeriveMode)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
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
                                </FormField>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        label="Term (months)"
                                        error={form.errors.term_months}
                                    >
                                        <Input
                                            inputMode="numeric"
                                            className="figures"
                                            value={form.data.term_months}
                                            onChange={(e) =>
                                                form.setData(
                                                    'term_months',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Monthly interest %"
                                        error={
                                            form.errors.monthly_interest_rate
                                        }
                                    >
                                        <Input
                                            inputMode="decimal"
                                            className="figures"
                                            disabled={lock('rate')}
                                            value={
                                                form.data.monthly_interest_rate
                                            }
                                            onChange={(e) =>
                                                form.setData(
                                                    'monthly_interest_rate',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        label={
                                            isReceivable
                                                ? 'Monthly repayment'
                                                : 'Monthly payment'
                                        }
                                        error={form.errors.scheduled_payment}
                                    >
                                        <Input
                                            inputMode="decimal"
                                            className="figures"
                                            disabled={lock('payment')}
                                            value={form.data.scheduled_payment}
                                            onChange={(e) =>
                                                form.setData(
                                                    'scheduled_payment',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label={
                                            isReceivable
                                                ? 'Total to be repaid to you'
                                                : 'Total amount to be paid'
                                        }
                                        error={form.errors.total_repayment}
                                    >
                                        <Input
                                            inputMode="decimal"
                                            className="figures"
                                            disabled={lock('total')}
                                            value={form.data.total_repayment}
                                            onChange={(e) =>
                                                form.setData(
                                                    'total_repayment',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </FormField>
                                </div>
                            </div>
                        </>
                    )}

                    <DialogFooter className="mt-2">
                        <Button type="submit" disabled={form.processing}>
                            {editing ? 'Save changes' : 'Create account'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/** "3.000" -> "3", "6.052" -> "6.052": rates as a person would write them. */
function rate(value: string): string {
    const n = Number(value);
    return Number.isFinite(n) ? String(n) : value;
}

/** The small print under an account's name. */
function accountDetails(account: Account): string {
    const parts =
        account.kind === 'asset'
            ? [
                  account.bank_name,
                  account.interest_rate &&
                      `${rate(account.interest_rate)}% a year`,
              ]
            : [
                  account.lender,
                  account.borrowed_on &&
                      `borrowed ${formatDate(account.borrowed_on)}`,
                  account.monthly_interest_rate &&
                      `${rate(account.monthly_interest_rate)}% / mo`,
                  account.term_months && `${account.term_months} mo term`,
                  account.due_day_of_month &&
                      `due day ${account.due_day_of_month}`,
                  account.total_repayment &&
                      `${peso(account.total_repayment)} ${account.kind === 'receivable' ? 'to collect' : 'to repay'}`,
              ];
    return parts.filter(Boolean).join(' · ');
}

function AccountSection({
    title,
    description,
    totalLabel,
    accounts,
}: {
    title: string;
    description: string;
    totalLabel: string;
    accounts: Account[];
}) {
    const form = useForm();
    const total = accounts
        .filter((a) => !a.is_archived)
        .reduce((sum, a) => sum + (a.balance?.cents ?? 0), 0);

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
            <CardContent>
                <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <div>
                        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
                            {title}
                        </h2>
                        <p className="text-ink-2 mt-0.5 text-sm">
                            {description}
                        </p>
                    </div>
                    <span className="text-ink-2 text-sm">
                        {accounts.length}{' '}
                        {accounts.length === 1 ? 'account' : 'accounts'}
                    </span>
                </header>

                {accounts.length === 0 ? (
                    <p className="text-ink-2 border-rule mt-4 border-t py-6 text-center text-sm">
                        Nothing here yet.
                    </p>
                ) : (
                    <>
                        <ul className="border-ink divide-rule mt-4 divide-y border-t">
                            {accounts.map((account) => {
                                const details = accountDetails(account);
                                return (
                                    <li
                                        key={account.id}
                                        className="flex items-center gap-3 py-3"
                                    >
                                        <div
                                            className={
                                                account.is_archived
                                                    ? 'min-w-0 flex-1 opacity-60'
                                                    : 'min-w-0 flex-1'
                                            }
                                        >
                                            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                                                <span className="flex min-w-0 items-center gap-2">
                                                    <span className="truncate text-[0.9375rem] font-semibold">
                                                        {account.name}
                                                    </span>
                                                    {account.is_archived && (
                                                        <Badge variant="outline">
                                                            Archived
                                                        </Badge>
                                                    )}
                                                </span>
                                                <Amount
                                                    value={account.balance}
                                                    size="md"
                                                    className="ml-auto"
                                                />
                                            </div>
                                            {details && (
                                                <p className="text-ink-2 mt-0.5 text-[0.8125rem] text-pretty">
                                                    {details}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex w-[4.125rem] shrink-0 justify-end gap-0.5 pointer-coarse:w-[5.125rem]">
                                            <AccountDialog
                                                account={account}
                                                trigger={
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="text-ink-2"
                                                        aria-label={`Edit ${account.name}`}
                                                        title="Edit"
                                                    >
                                                        <Pencil />
                                                    </Button>
                                                }
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="text-ink-2"
                                                        aria-label={`More for ${account.name}`}
                                                        disabled={
                                                            form.processing
                                                        }
                                                    >
                                                        <Ellipsis />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {account.is_archived ? (
                                                        <DropdownMenuItem
                                                            onSelect={() =>
                                                                restore(account)
                                                            }
                                                        >
                                                            <ArchiveRestore />
                                                            Restore
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onSelect={() =>
                                                                archive(account)
                                                            }
                                                        >
                                                            <Archive />
                                                            Archive
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        disabled={
                                                            account.in_use
                                                        }
                                                        onSelect={() =>
                                                            remove(account)
                                                        }
                                                    >
                                                        <Trash2 />
                                                        <span className="grid">
                                                            Delete
                                                            {account.in_use && (
                                                                <span className="text-ink-2 text-xs">
                                                                    Has activity
                                                                    — archive it
                                                                    instead
                                                                </span>
                                                            )}
                                                        </span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="border-ink rule-double flex items-baseline justify-between gap-4 border-t pt-3 pr-[4.875rem] pb-2.5 pointer-coarse:pr-[5.875rem]">
                            <span className="font-semibold">{totalLabel}</span>
                            <Amount value={total} size="md" />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function AccountsIndex({ accounts }: { accounts: Account[] }) {
    const assets = accounts.filter((a) => a.kind === 'asset');
    const liabilities = accounts.filter((a) => a.kind === 'liability');
    const receivables = accounts.filter((a) => a.kind === 'receivable');
    const activeAssets = assets.filter((a) => !a.is_archived);

    return (
        <AuthenticatedLayout>
            <Head title="Accounts" />
            <PageHeader
                title="Accounts"
                description="Cash and savings, the debts you owe, and what people owe you."
                actions={
                    <AccountDialog
                        depositAccounts={activeAssets}
                        trigger={
                            <Button>
                                <Plus />
                                Add account
                            </Button>
                        }
                    />
                }
            />

            {accounts.length === 0 ? (
                <Card>
                    <CardContent>
                        <EmptyState
                            title="No accounts yet"
                            action={
                                <AccountDialog
                                    trigger={
                                        <Button variant="outline">
                                            <Plus />
                                            Add your first account
                                        </Button>
                                    }
                                />
                            }
                        >
                            Start with where you keep money: a wallet, a bank
                            account, savings. Add loans you are paying and money
                            people owe you whenever you are ready.
                        </EmptyState>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    <AccountSection
                        title="Assets"
                        description="Money you have."
                        totalLabel="Total assets"
                        accounts={assets}
                    />
                    <AccountSection
                        title="Liabilities"
                        description="Money you owe."
                        totalLabel="Total liabilities"
                        accounts={liabilities}
                    />
                    <AccountSection
                        title="Money owed to me"
                        description="Debts family and friends owe you. Tracked beside your net worth, and counted once it's collected."
                        totalLabel="Total owed to me"
                        accounts={receivables}
                    />
                </div>
            )}
        </AuthenticatedLayout>
    );
}
