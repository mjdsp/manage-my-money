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
import { Input } from '@/Components/ui/input';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { Category, CategoryKind } from '@/types/models';
import { Head, useForm } from '@inertiajs/react';
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
        <form onSubmit={submit} className="flex gap-2">
            <Input
                placeholder={`New ${kind} category`}
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
            />
            <Button type="submit" disabled={form.processing || !form.data.name}>
                Add
            </Button>
        </form>
    );
}

function CategoryRow({ category }: { category: Category }) {
    const [editing, setEditing] = useState(false);
    const form = useForm({ name: category.name });
    const del = useForm();

    if (editing) {
        return (
            <form
                className="flex items-center gap-2 py-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.put(route('categories.update', category.id), {
                        preserveScroll: true,
                        onSuccess: () => setEditing(false),
                    });
                }}
            >
                <Input
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
        );
    }

    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm">
                {category.name}
                {category.is_system && (
                    <Badge variant="outline" className="ml-2">
                        default
                    </Badge>
                )}
                {typeof category.transactions_count === 'number' && (
                    <span className="ml-2 text-xs text-gray-400">
                        {category.transactions_count} txns
                    </span>
                )}
            </span>
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                >
                    Rename
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        del.delete(route('categories.destroy', category.id), {
                            preserveScroll: true,
                        })
                    }
                >
                    Delete
                </Button>
            </div>
        </div>
    );
}

function CategoryCard({
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
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <AddRow kind={kind} />
                <div className="divide-y">
                    {categories.map((c) => (
                        <CategoryRow key={c.id} category={c} />
                    ))}
                </div>
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
            <div className="grid gap-6 md:grid-cols-2">
                <CategoryCard
                    title="Expense categories"
                    description="Used for spending."
                    kind="expense"
                    categories={categories.filter((c) => c.kind === 'expense')}
                />
                <CategoryCard
                    title="Income categories"
                    description="Used for money coming in."
                    kind="income"
                    categories={categories.filter((c) => c.kind === 'income')}
                />
            </div>
        </AuthenticatedLayout>
    );
}
