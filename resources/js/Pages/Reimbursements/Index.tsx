import Amount from '@/Components/Amount';
import EmptyState from '@/Components/EmptyState';
import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate } from '@/lib/format';
import type { Reimbursement } from '@/types/models';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Download,
    Ellipsis,
    Eye,
    Paperclip,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';

type Row = Required<Pick<Reimbursement, 'id' | 'title' | 'total_amount'>> & {
    items_count: number;
    photos_count: number;
    created_at: string;
};

export default function ReimbursementsIndex({
    reimbursements,
}: {
    reimbursements: Row[];
}) {
    const form = useForm();

    function remove(row: Row) {
        if (window.confirm(`Delete reimbursement report “${row.title}”?`)) {
            form.delete(route('reimbursements.destroy', row.id), {
                preserveScroll: true,
            });
        }
    }

    const makeOne = (
        <Button asChild>
            <Link href={route('reimbursements.create')}>
                <Plus />
                Make a reimbursement
            </Link>
        </Button>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Reimbursements" />
            <PageHeader
                title="Reimbursements"
                description="Itemised reimbursement reports — quantity, item, price per unit and totals."
                actions={makeOne}
            />

            <Card>
                <CardContent>
                    {reimbursements.length === 0 ? (
                        <EmptyState
                            title="No reimbursement reports yet"
                            action={makeOne}
                        >
                            List what you paid for, attach the receipts, and
                            download a PDF to hand to whoever reimburses you.
                        </EmptyState>
                    ) : (
                        <ul className="divide-rule divide-y">
                            {reimbursements.map((row) => (
                                <li
                                    key={row.id}
                                    className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                                            <Link
                                                href={route(
                                                    'reimbursements.show',
                                                    row.id,
                                                )}
                                                className="min-w-0 truncate rounded-sm text-[0.9375rem] font-semibold hover:underline"
                                            >
                                                {row.title}
                                            </Link>
                                            <Amount
                                                value={row.total_amount}
                                                size="md"
                                                className="ml-auto"
                                            />
                                        </div>
                                        <p className="text-ink-2 mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.8125rem]">
                                            <span className="figures">
                                                {row.items_count}{' '}
                                                {row.items_count === 1
                                                    ? 'item'
                                                    : 'items'}
                                            </span>
                                            {row.photos_count > 0 && (
                                                <span className="figures inline-flex items-center gap-1">
                                                    <Paperclip
                                                        className="size-3.5"
                                                        aria-hidden
                                                    />
                                                    {row.photos_count}{' '}
                                                    {row.photos_count === 1
                                                        ? 'receipt'
                                                        : 'receipts'}
                                                </span>
                                            )}
                                            <span>
                                                · created{' '}
                                                {formatDate(row.created_at)}
                                            </span>
                                        </p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="text-ink-2 shrink-0"
                                                aria-label={`Actions for ${row.title}`}
                                                disabled={form.processing}
                                            >
                                                <Ellipsis />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={route(
                                                        'reimbursements.show',
                                                        row.id,
                                                    )}
                                                >
                                                    <Eye />
                                                    View
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={route(
                                                        'reimbursements.edit',
                                                        row.id,
                                                    )}
                                                >
                                                    <Pencil />
                                                    Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <a
                                                    href={route(
                                                        'reimbursements.pdf',
                                                        row.id,
                                                    )}
                                                >
                                                    <Download />
                                                    Download PDF
                                                </a>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onSelect={() => remove(row)}
                                            >
                                                <Trash2 />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
