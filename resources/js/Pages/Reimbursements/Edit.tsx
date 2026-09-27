import FormField from '@/Components/FormField';
import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import ItemsEditor, { blankItem, type ItemDraft } from './ItemsEditor';

type EditReimbursement = {
    id: number;
    title: string;
    notes: string | null;
    items: ItemDraft[];
};

type FormShape = {
    title: string;
    notes: string;
    items: ItemDraft[];
};

function isFilled(row: ItemDraft): boolean {
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
                : [blankItem()],
    });

    const { items } = form.data;
    const errorMessages = Array.from(
        new Set(Object.values(form.errors)),
    ).filter(Boolean) as string[];

    function setRow(index: number, patch: Partial<ItemDraft>) {
        form.setData(
            'items',
            items.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        );
    }

    function addRow() {
        form.setData('items', [...items, blankItem()]);
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
            />

            <form onSubmit={submit} className="grid gap-6">
                <Card>
                    <CardContent className="grid gap-5 md:grid-cols-2">
                        <FormField
                            label="Report title"
                            error={form.errors.title}
                        >
                            <Input
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                                autoFocus
                            />
                        </FormField>
                        <FormField label="Notes (optional)">
                            <Input
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                            />
                        </FormField>
                    </CardContent>
                </Card>

                {errorMessages.length > 0 && (
                    <div
                        role="alert"
                        className="border-past-due/40 bg-past-due-tint text-past-due rounded-md border px-4 py-3 text-sm"
                    >
                        <ul className="list-inside list-disc space-y-0.5">
                            {errorMessages.map((message) => (
                                <li key={message}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <Card>
                    <CardContent>
                        <h2 className="mb-4 text-[1.0625rem] font-semibold tracking-[-0.01em]">
                            Items
                        </h2>
                        <ItemsEditor
                            rows={items}
                            onChange={setRow}
                            onRemove={removeRow}
                            onAdd={addRow}
                            totalLabel="Total amount"
                        />
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
