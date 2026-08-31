import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
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
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type ItemRow = { quantity: string; item_name: string; unit_price: string };

type EditReimbursement = {
    id: number;
    title: string;
    notes: string | null;
    items: ItemRow[];
};

type FormShape = {
    title: string;
    notes: string;
    items: ItemRow[];
};

const blankRow = (): ItemRow => ({
    quantity: '1',
    item_name: '',
    unit_price: '',
});

function rowTotalCents(row: ItemRow): number {
    const qty = parseFloat(row.quantity);
    const price = parseFloat(row.unit_price);
    if (!isFinite(qty) || !isFinite(price)) return 0;
    return Math.round(qty * price * 100);
}

function isFilled(row: ItemRow): boolean {
    return row.item_name.trim() !== '' || row.unit_price.trim() !== '';
}

export default function ReimbursementEdit({
    reimbursement,
}: {
    reimbursement: EditReimbursement;
}) {
    const form = useForm<FormShape>({
        title: reimbursement.title,
        notes: reimbursement.notes ?? '',
        items:
            reimbursement.items.length > 0
                ? reimbursement.items.map((i) => ({ ...i }))
                : [blankRow()],
    });

    const { items } = form.data;
    const grandTotalCents = items.reduce(
        (sum, row) => sum + rowTotalCents(row),
        0,
    );
    const errorMessages = Array.from(
        new Set(Object.values(form.errors)),
    ).filter(Boolean) as string[];

    function setRow(index: number, patch: Partial<ItemRow>) {
        form.setData(
            'items',
            items.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        );
    }

    function addRow() {
        form.setData('items', [...items, blankRow()]);
    }

    function removeRow(index: number) {
        form.setData(
            'items',
            items.length > 1 ? items.filter((_, i) => i !== index) : items,
        );
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            items: data.items.filter(isFilled),
        }));
        form.put(route('reimbursements.update', reimbursement.id));
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Edit — ${reimbursement.title}`} />
            <PageHeader
                title="Edit reimbursement"
                description="Change the title, notes or line items. Receipt photos are managed on the report page."
                actions={
                    <Button asChild variant="outline">
                        <Link
                            href={route(
                                'reimbursements.show',
                                reimbursement.id,
                            )}
                        >
                            Cancel
                        </Link>
                    </Button>
                }
            />

            <form onSubmit={submit} className="space-y-6">
                <Card>
                    <CardContent className="space-y-4">
                        <div className="max-w-md space-y-1.5">
                            <Label htmlFor="title">Report title</Label>
                            <Input
                                id="title"
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                                autoFocus
                            />
                            {form.errors.title && (
                                <p className="text-sm text-red-600">
                                    {form.errors.title}
                                </p>
                            )}
                        </div>
                        <div className="max-w-md space-y-1.5">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Input
                                id="notes"
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {errorMessages.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <ul className="list-inside list-disc space-y-0.5">
                            {errorMessages.map((message) => (
                                <li key={message}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead className="w-28">
                                        Quantity
                                    </TableHead>
                                    <TableHead>Item name</TableHead>
                                    <TableHead className="w-40">
                                        Price per quantity
                                    </TableHead>
                                    <TableHead className="w-40 text-right">
                                        Total amount
                                    </TableHead>
                                    <TableHead className="w-1" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-sm text-gray-400 tabular-nums">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                inputMode="decimal"
                                                value={row.quantity}
                                                onChange={(e) =>
                                                    setRow(index, {
                                                        quantity:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={row.item_name}
                                                onChange={(e) =>
                                                    setRow(index, {
                                                        item_name:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="Description"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                inputMode="decimal"
                                                placeholder="0.00"
                                                value={row.unit_price}
                                                onChange={(e) =>
                                                    setRow(index, {
                                                        unit_price:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-medium tabular-nums">
                                            {peso(rowTotalCents(row))}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-400 hover:text-red-600"
                                                onClick={() => removeRow(index)}
                                                aria-label={`Remove row ${index + 1}`}
                                            >
                                                ✕
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex items-center justify-between border-t p-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addRow}
                            >
                                Add row
                            </Button>
                            <div className="text-sm">
                                <span className="text-gray-500">
                                    Total amount
                                </span>{' '}
                                <span className="ml-2 text-lg font-semibold tabular-nums">
                                    {peso(grandTotalCents)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button asChild type="button" variant="ghost">
                        <Link
                            href={route(
                                'reimbursements.show',
                                reimbursement.id,
                            )}
                        >
                            Cancel
                        </Link>
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        Save changes
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
