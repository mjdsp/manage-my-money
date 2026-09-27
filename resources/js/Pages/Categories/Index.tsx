import PageHeader from '@/Components/PageHeader';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { Category, CategoryKind } from '@/types/models';
import { Head, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

function AddRow({ kind }: { kind: CategoryKind }) {
    const form = useForm({ name: '', kind });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(route('categories.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('name'),
        });
    }

    return (
        <form onSubmit={submit} className="grid gap-1.5">
            <div className="flex gap-2">
                <Input
                    aria-label={`New ${kind} category`}
                    placeholder={`New ${kind} category`}
                    value={form.data.name}
                    aria-invalid={Boolean(form.errors.name)}
                    onChange={(e) => form.setData('name', e.target.value)}
                />
                <Button
                    type="submit"
                    variant="outline"
                    disabled={form.processing || !form.data.name}
                >
                    <Plus />
                    Add
                </Button>
            </div>
            {form.errors.name && (
                <p role="alert" className="text-past-due text-[0.8125rem]">
                    {form.errors.name}
                </p>
            )}
        </form>
    );
}

function CategoryRow({ category }: { category: Category }) {
    const [editing, setEditing] = useState(false);
    const form = useForm({ name: category.name });
    const del = useForm();

    function remove() {
        if (
            window.confirm(
                `Delete the category “${category.name}”? Its transactions stay, uncategorised.`,
            )
        ) {
            del.delete(route('categories.destroy', category.id), {
                preserveScroll: true,
            });
        }
    }

    if (editing) {
        return (
            <li className="py-2.5">
                <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.put(route('categories.update', category.id), {
                            preserveScroll: true,
                            onSuccess: () => setEditing(false),
                        });
                    }}
                >
                    <Input
                        aria-label="Category name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        autoFocus
                    />
                    <Button type="submit" size="sm" disabled={form.processing}>
                        Save
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(false)}
                    >
                        Cancel
                    </Button>
                </form>
                {form.errors.name && (
                    <p
                        role="alert"
                        className="text-past-due mt-1.5 text-[0.8125rem]"
                    >
                        {form.errors.name}
                    </p>
                )}
            </li>
        );
    }

    return (
        <li className="flex items-center gap-3 py-2.5">
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate text-[0.9375rem] font-medium">
                    {category.name}
                </span>
                {category.is_system && <Badge variant="outline">Default</Badge>}
            </span>
            {typeof category.transactions_count === 'number' && (
                <span className="text-ink-2 figures shrink-0 text-[0.8125rem]">
                    {category.transactions_count}{' '}
                    {category.transactions_count === 1
                        ? 'transaction'
                        : 'transactions'}
                </span>
            )}
            <span className="flex shrink-0 gap-0.5">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-ink-2"
                    onClick={() => setEditing(true)}
                    aria-label={`Rename ${category.name}`}
                    title="Rename"
                >
                    <Pencil />
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-ink-2 hover:text-past-due"
                    onClick={remove}
                    disabled={del.processing}
                    aria-label={`Delete ${category.name}`}
                    title="Delete"
                >
                    <Trash2 />
                </Button>
            </span>
        </li>
    );
}

function CategorySheet({
    title,
    description,
    kind,
    categories,
}: {
    title: string;
    description: string;
    kind: CategoryKind;
    categories: Category[];
}) {
    return (
        <Card>
            <CardContent className="grid gap-4">
                <header className="flex items-baseline justify-between gap-4">
                    <div>
                        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
                            {title}
                        </h2>
                        <p className="text-ink-2 mt-0.5 text-sm">
                            {description}
                        </p>
                    </div>
                    <span className="text-ink-2 figures text-sm">
                        {categories.length}
                    </span>
                </header>
                <AddRow kind={kind} />
                {categories.length > 0 && (
                    <ul className="border-ink divide-rule divide-y border-t">
                        {categories.map((c) => (
                            <CategoryRow key={c.id} category={c} />
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export default function CategoriesIndex({
    categories,
}: {
    categories: Category[];
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Categories" />
            <PageHeader
                title="Categories"
                description="Tags that turn a list of transactions into where the money goes."
            />
            <div className="grid items-start gap-6 md:grid-cols-2">
                <CategorySheet
                    title="Expense categories"
                    description="Used for spending."
                    kind="expense"
                    categories={categories.filter((c) => c.kind === 'expense')}
                />
                <CategorySheet
                    title="Income categories"
                    description="Used for money coming in."
                    kind="income"
                    categories={categories.filter((c) => c.kind === 'income')}
                />
            </div>
        </AuthenticatedLayout>
    );
}
