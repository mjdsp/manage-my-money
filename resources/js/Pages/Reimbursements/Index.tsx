import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
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
import type { Reimbursement } from '@/types/models';
import { Head, Link, useForm } from '@inertiajs/react';

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

    return (
        <AuthenticatedLayout>
            <Head title="Reimbursements" />
            <PageHeader
                title="Reimbursements"
                description="Itemised reimbursement reports — quantity, item, price per unit and totals."
                actions={
                    <Button asChild>
                        <Link href={route('reimbursements.create')}>
                            Make a reimbursement
                        </Link>
                    </Button>
                }
            />

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Report</TableHead>
                                <TableHead className="text-right">
                                    Items
                                </TableHead>
                                <TableHead className="text-right">
                                    Total amount
                                </TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-1" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reimbursements.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-10 text-center text-sm text-gray-500"
                                    >
                                        No reimbursement reports yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {reimbursements.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        <Link
                                            href={route(
                                                'reimbursements.show',
                                                row.id,
                                            )}
                                            className="hover:underline"
                                        >
                                            {row.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {row.items_count}
                                        {row.photos_count > 0 && (
                                            <span className="ml-2 text-xs text-gray-400">
                                                📎 {row.photos_count}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">
                                        {peso(row.total_amount)}
                                    </TableCell>
                                    <TableCell className="text-sm whitespace-nowrap text-gray-500">
                                        {formatDate(row.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                            >
                                                <Link
                                                    href={route(
                                                        'reimbursements.show',
                                                        row.id,
                                                    )}
                                                >
                                                    View
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                            >
                                                <Link
                                                    href={route(
                                                        'reimbursements.edit',
                                                        row.id,
                                                    )}
                                                >
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                            >
                                                <a
                                                    href={route(
                                                        'reimbursements.pdf',
                                                        row.id,
                                                    )}
                                                >
                                                    PDF
                                                </a>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                disabled={form.processing}
                                                onClick={() => remove(row)}
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
        </AuthenticatedLayout>
    );
}
