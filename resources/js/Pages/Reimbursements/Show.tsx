import Amount from '@/Components/Amount';
import PageHeader from '@/Components/PageHeader';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { inputClassName } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { peso } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Money, ReimbursementPhoto } from '@/types/models';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronLeft,
    Download,
    Pencil,
    ScanText,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import ItemsEditor, {
    blankItem,
    itemCents,
    type ItemDraft,
} from './ItemsEditor';

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
    const [draft, setDraft] = useState<ItemDraft[] | null>(null);
    const addForm = useForm<{ items: ItemDraft[] }>({ items: [] });

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
            const rows: ItemDraft[] = (data.rows ?? []).map(
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
            setDraft(rows.length ? rows : [blankItem()]);
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

    function setDraftRow(index: number, patch: Partial<ItemDraft>) {
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

    const photoError =
        photoForm.errors.photos ?? photoForm.errors['photos.0'] ?? null;

    return (
        <AuthenticatedLayout>
            <Head title={`Reimbursement — ${reimbursement.title}`} />

            <nav aria-label="Breadcrumb" className="mb-3">
                <Link
                    href={route('reimbursements.index')}
                    className="text-band hover:text-band-hover -ml-1 inline-flex items-center gap-0.5 rounded-sm px-1 text-sm font-semibold"
                >
                    <ChevronLeft className="size-4" aria-hidden />
                    Reimbursements
                </Link>
            </nav>

            <PageHeader
                title={reimbursement.title}
                description={`Created ${reimbursement.created_at}`}
                actions={
                    <>
                        <Button asChild>
                            <a
                                href={route(
                                    'reimbursements.pdf',
                                    reimbursement.id,
                                )}
                            >
                                <Download />
                                Download PDF
                            </a>
                        </Button>
                        <Button asChild variant="outline">
                            <Link
                                href={route(
                                    'reimbursements.edit',
                                    reimbursement.id,
                                )}
                            >
                                <Pencil />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={form.processing}
                            onClick={remove}
                        >
                            <Trash2 />
                            Delete
                        </Button>
                    </>
                }
            />

            {reimbursement.notes && (
                <p className="text-ink-2 -mt-2 mb-6 max-w-[65ch] text-[0.9375rem] text-pretty">
                    {reimbursement.notes}
                </p>
            )}

            <Card>
                <CardContent>
                    <h2 className="mb-4 text-[1.0625rem] font-semibold tracking-[-0.01em]">
                        Items
                    </h2>

                    {/* Phone: each item on its own line. */}
                    <ol className="divide-rule divide-y md:hidden">
                        {reimbursement.items.map((item) => (
                            <li
                                key={item.id}
                                className="flex items-baseline justify-between gap-4 py-3 first:pt-0"
                            >
                                <span className="min-w-0">
                                    <span className="block text-[0.9375rem] font-medium">
                                        {item.item_name}
                                    </span>
                                    <span className="text-ink-2 figures text-[0.8125rem]">
                                        {item.quantity} ×{' '}
                                        {peso(item.unit_price)}
                                    </span>
                                </span>
                                <Amount value={item.line_total} size="md" />
                            </li>
                        ))}
                    </ol>
                    <div className="border-ink rule-double flex items-baseline justify-between gap-4 border-t pt-3 pb-2.5 md:hidden">
                        <span className="font-semibold">Total amount</span>
                        <Amount value={reimbursement.total_amount} size="lg" />
                    </div>

                    {/* From md: the itemised table. */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead className="w-24 text-right">
                                        Quantity
                                    </TableHead>
                                    <TableHead>Item name</TableHead>
                                    <TableHead className="w-44 text-right">
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
                                        <TableCell className="text-ink-3">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.quantity}
                                        </TableCell>
                                        <TableCell className="whitespace-normal">
                                            {item.item_name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Amount
                                                value={item.unit_price}
                                                size="sm"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Amount
                                                value={item.line_total}
                                                size="md"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={4}>
                                        Total amount
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Amount
                                            value={reimbursement.total_amount}
                                            size="lg"
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardContent className="grid gap-5">
                    <header>
                        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
                            Receipts
                        </h2>
                        <p className="text-ink-2 mt-0.5 text-sm">
                            Scan a photo to pull its line items into this
                            report. Scanning uses Tesseract OCR — always check
                            the results.
                        </p>
                    </header>

                    {reimbursement.photos.length === 0 ? (
                        <p className="text-ink-2 border-rule rounded-md border border-dashed px-4 py-6 text-center text-sm">
                            No receipt photos attached yet.
                        </p>
                    ) : (
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {reimbursement.photos.map((photo) => (
                                <li
                                    key={photo.id}
                                    className="group border-rule bg-paper relative overflow-hidden rounded-md border"
                                >
                                    <a
                                        href={photo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <img
                                            src={photo.url}
                                            alt={photo.name}
                                            className="bg-muted h-36 w-full object-cover"
                                        />
                                    </a>
                                    <Button
                                        type="button"
                                        size="icon-xs"
                                        variant="ghost"
                                        onClick={() => deletePhoto(photo)}
                                        className="bg-ink/70 hover:bg-ink absolute top-1.5 right-1.5 text-white opacity-100 hover:text-white focus-visible:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100"
                                        aria-label={`Remove ${photo.name}`}
                                    >
                                        <X />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => scanPhoto(photo)}
                                        disabled={scanningId !== null}
                                        className="border-rule w-full rounded-none border-t"
                                    >
                                        <ScanText />
                                        {scanningId === photo.id
                                            ? 'Scanning…'
                                            : 'Scan for items'}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {scanError && !draft && (
                        <p role="alert" className="text-past-due text-sm">
                            {scanError}
                        </p>
                    )}

                    <form
                        onSubmit={uploadPhotos}
                        className="border-rule grid gap-2 border-t pt-5"
                    >
                        <label className="grid gap-1.5">
                            <span className="text-ink text-[0.8125rem] font-semibold">
                                Add receipt photos
                            </span>
                            <span className="flex flex-col gap-2 sm:flex-row">
                                {/* A plain input: the ref clears it after an upload (React 18 can't ref the Input component). */}
                                <input
                                    ref={fileInput}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className={cn(
                                        inputClassName,
                                        'h-auto py-1.5 sm:max-w-sm pointer-coarse:h-auto',
                                    )}
                                    onChange={(e) =>
                                        photoForm.setData(
                                            'photos',
                                            Array.from(e.target.files ?? []),
                                        )
                                    }
                                />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={
                                        photoForm.processing ||
                                        photoForm.data.photos.length === 0
                                    }
                                >
                                    <Upload />
                                    {photoForm.processing
                                        ? 'Uploading…'
                                        : 'Upload photos'}
                                </Button>
                            </span>
                        </label>
                        {photoError ? (
                            <p role="alert" className="text-past-due text-sm">
                                {photoError}
                            </p>
                        ) : (
                            <p className="text-ink-2 text-xs">
                                JPG, PNG, WEBP or HEIC · up to 10 MB each.
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>

            {draft && (
                <Card className="ring-band/30 mt-6 ring-2">
                    <CardContent className="grid gap-4">
                        <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
                                Review scanned items
                            </h2>
                            <Badge variant="secondary">Not added yet</Badge>
                            <p className="text-ink-2 w-full text-sm">
                                OCR is rough — fix any wrong quantities, names
                                or prices before adding them to the report.
                            </p>
                        </header>

                        <ItemsEditor
                            rows={draft}
                            onChange={setDraftRow}
                            onRemove={(index) =>
                                setDraft((rows) =>
                                    (rows ?? []).filter((_, i) => i !== index),
                                )
                            }
                            onAdd={() =>
                                setDraft((rows) => [
                                    ...(rows ?? []),
                                    blankItem(),
                                ])
                            }
                            totalLabel="Adds to report"
                        />

                        {scanError && (
                            <p role="alert" className="text-past-due text-sm">
                                {scanError}
                            </p>
                        )}
                        {Object.values(addForm.errors).length > 0 && (
                            <p role="alert" className="text-past-due text-sm">
                                Some rows are invalid — check quantities and
                                prices.
                            </p>
                        )}

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                                Add{' '}
                                {peso(
                                    draft.reduce(
                                        (sum, row) => sum + itemCents(row),
                                        0,
                                    ),
                                )}{' '}
                                to report
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </AuthenticatedLayout>
    );
}
