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

type FormShape = {
    title: string;
    notes: string;
    items: ItemRow[];
    photos: File[];
};

const blankRow = (): ItemRow => ({
    quantity: '1',
    item_name: '',
    unit_price: '',
});

/** Cents for a single row; 0 when either side is blank or not a number. */
function rowTotalCents(row: ItemRow): number {
    const qty = parseFloat(row.quantity);
    const price = parseFloat(row.unit_price);
    if (!isFinite(qty) || !isFinite(price)) return 0;
    return Math.round(qty * price * 100);
}

function isFilled(row: ItemRow): boolean {
    return row.item_name.trim() !== '' || row.unit_price.trim() !== '';
}

export default function ReimbursementCreate({
    defaultRows,
}: {
    defaultRows: number;
}) {
    const form = useForm<FormShape>({
        title: '',
        notes: '',
        items: Array.from({ length: defaultRows }, blankRow),
        photos: [],
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
        // Send only rows the user actually filled in — the blank starter rows
        // are dropped, matching what the server does.
        form.transform((data) => ({
            ...data,
            items: data.items.filter(isFilled),
        }));
        form.post(route('reimbursements.store'), { forceFormData: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="New reimbursement" />
            <PageHeader
                title="Make a reimbursement"
                description="List every item. The total per line is worked out from quantity × price per quantity."
                actions={
                    <Button asChild variant="outline">
                        <Link href={route('reimbursements.index')}>Cancel</Link>
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
                                placeholder="e.g. Client visit — March"
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
                        <div className="space-y-1.5">
                            <Label htmlFor="photos">
                                Receipt photos (optional)
                            </Label>
                            <input
                                id="photos"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) =>
                                    form.setData(
                                        'photos',
                                        Array.from(e.target.files ?? []),
                                    )
                                }
                                className="block text-sm file:mr-3 file:rounded-md file:border file:border-gray-200 file:bg-gray-50 file:px-3 file:py-1.5 file:text-sm"
                            />
                            <p className="text-xs text-gray-400">
                                {form.data.photos.length > 0
                                    ? `${form.data.photos.length} photo(s) selected`
                                    : 'JPG, PNG, WEBP or HEIC · up to 10 MB each. You can also add or scan photos after saving.'}
                            </p>
                            {form.errors.photos && (
                                <p className="text-sm text-red-600">
                                    {form.errors.photos}
                                </p>
                            )}
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
                        <Link href={route('reimbursements.index')}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        Save reimbursement
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
