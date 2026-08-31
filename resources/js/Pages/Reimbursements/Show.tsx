import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
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
import type { Money, ReimbursementPhoto } from '@/types/models';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useRef, useState } from 'react';

type DraftRow = { quantity: string; item_name: string; unit_price: string };

const emptyDraftRow = (): DraftRow => ({
    quantity: '1',
    item_name: '',
    unit_price: '',
});

function draftRowCents(row: DraftRow): number {
    const qty = parseFloat(row.quantity);
    const price = parseFloat(row.unit_price);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
    return Math.round(qty * price * 100);
}

type Item = {
    id: number;
    quantity: number;
    item_name: string;
    unit_price: Money;
    line_total: Money;
};

type Reimbursement = {
    id: number;
    title: string;
    notes: string | null;
    total_amount: Money;
    created_at: string;
    items: Item[];
    photos: ReimbursementPhoto[];
};

export default function ReimbursementShow({
    reimbursement,
}: {
    reimbursement: Reimbursement;
}) {
    const form = useForm();
    const photoForm = useForm<{ photos: File[] }>({ photos: [] });
    const fileInput = useRef<HTMLInputElement>(null);

    // Receipt-scan review state (lives only on the client until "Add to report").
    const [scanningId, setScanningId] = useState<number | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [draft, setDraft] = useState<DraftRow[] | null>(null);
    const addForm = useForm<{ items: DraftRow[] }>({ items: [] });

    async function scanPhoto(photo: ReimbursementPhoto) {
        setScanningId(photo.id);
        setScanError(null);
        try {
            const { data } = await window.axios.post(
                route('reimbursements.photos.extract', [
                    reimbursement.id,
                    photo.id,
                ]),
            );
            const rows: DraftRow[] = (data.rows ?? []).map(
                (r: {
                    quantity?: number;
                    item_name?: string;
                    unit_price?: string;
                }) => ({
                    quantity: String(r.quantity ?? 1),
                    item_name: r.item_name ?? '',
                    unit_price: String(r.unit_price ?? ''),
                }),
            );
            addForm.clearErrors();
            setDraft(rows.length ? rows : [emptyDraftRow()]);
            if (rows.length === 0) {
                setScanError(
                    'No line items were recognised — add them by hand below.',
                );
            }
        } catch (e) {
            const err = e as { response?: { data?: { message?: string } } };
            setScanError(
                err.response?.data?.message ??
                    'The scan failed. Check that Tesseract is installed.',
            );
            setDraft(null);
        } finally {
            setScanningId(null);
        }
    }

    function setDraftRow(index: number, patch: Partial<DraftRow>) {
        setDraft((rows) =>
            (rows ?? []).map((r, i) => (i === index ? { ...r, ...patch } : r)),
        );
    }

    function commitDraft() {
        if (!draft) return;
        const rows = draft.filter(
            (r) => r.item_name.trim() !== '' && r.unit_price.trim() !== '',
        );
        if (rows.length === 0) {
            setScanError('Nothing to add — fill in an item name and price.');
            return;
        }
        addForm.transform(() => ({ items: rows }));
        addForm.post(route('reimbursements.items.store', reimbursement.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDraft(null);
                setScanError(null);
            },
        });
    }

    const draftTotalCents = (draft ?? []).reduce(
        (sum, r) => sum + draftRowCents(r),
        0,
    );

    function remove() {
        if (
            window.confirm(
                `Delete reimbursement report “${reimbursement.title}”?`,
            )
        ) {
            form.delete(route('reimbursements.destroy', reimbursement.id));
        }
    }

    function uploadPhotos(e: FormEvent) {
        e.preventDefault();
        if (photoForm.data.photos.length === 0) return;
        photoForm.post(route('reimbursements.photos.store', reimbursement.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                photoForm.reset();
                if (fileInput.current) fileInput.current.value = '';
            },
        });
    }

    function deletePhoto(photo: ReimbursementPhoto) {
        router.delete(
            route('reimbursements.photos.destroy', [
                reimbursement.id,
                photo.id,
            ]),
            { preserveScroll: true },
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Reimbursement — ${reimbursement.title}`} />
            <PageHeader
                title={reimbursement.title}
                description={`Created ${reimbursement.created_at}`}
                actions={
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={route('reimbursements.index')}>
                                Back to list
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link
                                href={route(
                                    'reimbursements.edit',
                                    reimbursement.id,
                                )}
                            >
                                Edit
                            </Link>
                        </Button>
                        <Button asChild>
                            <a
                                href={route(
                                    'reimbursements.pdf',
                                    reimbursement.id,
                                )}
                            >
                                Download PDF
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            disabled={form.processing}
                            onClick={remove}
                        >
                            Delete
                        </Button>
                    </div>
                }
            />

            {reimbursement.notes && (
                <p className="mb-4 text-sm text-gray-600">
                    {reimbursement.notes}
                </p>
            )}

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">#</TableHead>
                                <TableHead className="w-28 text-right">
                                    Quantity
                                </TableHead>
                                <TableHead>Item name</TableHead>
                                <TableHead className="w-40 text-right">
                                    Price per quantity
                                </TableHead>
                                <TableHead className="w-40 text-right">
                                    Total amount
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reimbursement.items.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-sm text-gray-400 tabular-nums">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell>{item.item_name}</TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {peso(item.unit_price)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">
                                        {peso(item.line_total)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex justify-end border-t p-3 text-sm">
                        <span className="text-gray-500">Total amount</span>
                        <span className="ml-3 text-lg font-semibold tabular-nums">
                            {peso(reimbursement.total_amount)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Receipts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {reimbursement.photos.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No receipt photos attached yet.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {reimbursement.photos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="group relative overflow-hidden rounded-lg border"
                                >
                                    <a
                                        href={photo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <img
                                            src={photo.url}
                                            alt={photo.name}
                                            className="h-32 w-full object-cover"
                                        />
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => deletePhoto(photo)}
                                        className="absolute top-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                                        aria-label={`Remove ${photo.name}`}
                                    >
                                        ✕
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => scanPhoto(photo)}
                                        disabled={scanningId !== null}
                                        className="w-full border-t bg-gray-50 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        {scanningId === photo.id
                                            ? 'Scanning…'
                                            : 'Scan for items'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {scanError && !draft && (
                        <p className="text-sm text-red-600">{scanError}</p>
                    )}

                    <form
                        onSubmit={uploadPhotos}
                        className="flex flex-wrap items-center gap-3 border-t pt-4"
                    >
                        <input
                            ref={fileInput}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) =>
                                photoForm.setData(
                                    'photos',
                                    Array.from(e.target.files ?? []),
                                )
                            }
                            className="text-sm file:mr-3 file:rounded-md file:border file:border-gray-200 file:bg-gray-50 file:px-3 file:py-1.5 file:text-sm"
                        />
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                photoForm.processing ||
                                photoForm.data.photos.length === 0
                            }
                        >
                            {photoForm.processing
                                ? 'Uploading…'
                                : 'Upload photos'}
                        </Button>
                        {photoForm.errors.photos && (
                            <p className="text-sm text-red-600">
                                {photoForm.errors.photos}
                            </p>
                        )}
                        {photoForm.errors['photos.0'] && (
                            <p className="text-sm text-red-600">
                                {photoForm.errors['photos.0']}
                            </p>
                        )}
                    </form>
                    <p className="text-xs text-gray-400">
                        JPG, PNG, WEBP or HEIC · up to 10 MB each. Scanning uses
                        Tesseract OCR — always check the results.
                    </p>
                </CardContent>
            </Card>

            {draft && (
                <Card className="mt-6 border-emerald-200">
                    <CardHeader>
                        <CardTitle>Review scanned items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-500">
                            OCR is rough — fix any wrong quantities, names or
                            prices before adding them to the report.
                        </p>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-24">
                                            Quantity
                                        </TableHead>
                                        <TableHead>Item name</TableHead>
                                        <TableHead className="w-36">
                                            Price per qty
                                        </TableHead>
                                        <TableHead className="w-32 text-right">
                                            Total
                                        </TableHead>
                                        <TableHead className="w-1" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {draft.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Input
                                                    inputMode="decimal"
                                                    value={row.quantity}
                                                    onChange={(e) =>
                                                        setDraftRow(index, {
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
                                                        setDraftRow(index, {
                                                            item_name:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    inputMode="decimal"
                                                    value={row.unit_price}
                                                    onChange={(e) =>
                                                        setDraftRow(index, {
                                                            unit_price:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {peso(draftRowCents(row))}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-400 hover:text-red-600"
                                                    onClick={() =>
                                                        setDraft((rows) =>
                                                            (rows ?? []).filter(
                                                                (_, i) =>
                                                                    i !== index,
                                                            ),
                                                        )
                                                    }
                                                    aria-label="Remove row"
                                                >
                                                    ✕
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setDraft((rows) => [
                                        ...(rows ?? []),
                                        emptyDraftRow(),
                                    ])
                                }
                            >
                                Add row
                            </Button>
                            <div className="text-sm">
                                <span className="text-gray-500">
                                    Adds to report
                                </span>{' '}
                                <span className="ml-2 font-semibold tabular-nums">
                                    {peso(draftTotalCents)}
                                </span>
                            </div>
                        </div>

                        {scanError && (
                            <p className="text-sm text-red-600">{scanError}</p>
                        )}
                        {Object.values(addForm.errors).length > 0 && (
                            <p className="text-sm text-red-600">
                                Some rows are invalid — check quantities and
                                prices.
                            </p>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setDraft(null);
                                    setScanError(null);
                                    addForm.clearErrors();
                                }}
                            >
                                Discard
                            </Button>
                            <Button
                                type="button"
                                disabled={addForm.processing}
                                onClick={commitDraft}
                            >
                                Add to report
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </AuthenticatedLayout>
    );
}
