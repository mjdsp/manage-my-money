import Amount from '@/Components/Amount';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Plus, X } from 'lucide-react';

export type ItemDraft = {
    quantity: string;
    item_name: string;
    unit_price: string;
};

export const blankItem = (): ItemDraft => ({
    quantity: '1',
    item_name: '',
    unit_price: '',
});

/** Cents for one line; 0 when either side is blank or not a number. */
export function itemCents(row: ItemDraft): number {
    const qty = parseFloat(row.quantity);
    const price = parseFloat(row.unit_price);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
    return Math.round(qty * price * 100);
}

/*
 * One grid serves both sizes. From md it reads as a table row:
 * # · quantity · item · price · total · remove. On a phone each line
 * becomes a small card: name across the top, quantity and price side by
 * side, the line total under them.
 */
const rowGrid =
    "grid grid-cols-2 gap-x-3 gap-y-2 [grid-template-areas:'idx_rm''name_name''qty_price''total_total'] md:grid-cols-[2rem_5.5rem_minmax(0,1fr)_9rem_8rem_2.25rem] md:items-center md:gap-y-0 md:[grid-template-areas:'idx_qty_name_price_total_rm']";

/** Itemised lines: quantity × price per quantity, totalled like a bill. */
export default function ItemsEditor({
    rows,
    onChange,
    onRemove,
    onAdd,
    totalLabel,
    namePlaceholder = 'Description',
}: {
    rows: ItemDraft[];
    onChange: (index: number, patch: Partial<ItemDraft>) => void;
    onRemove: (index: number) => void;
    onAdd: () => void;
    totalLabel: string;
    namePlaceholder?: string;
}) {
    const total = rows.reduce((sum, row) => sum + itemCents(row), 0);

    return (
        <div>
            <div
                className={`${rowGrid} label-caps text-ink-2 border-ink hidden border-b pb-2 md:grid`}
                aria-hidden
            >
                <span className="[grid-area:idx]">#</span>
                <span className="[grid-area:qty]">Quantity</span>
                <span className="[grid-area:name]">Item name</span>
                <span className="[grid-area:price]">Price per quantity</span>
                <span className="text-right [grid-area:total]">Total</span>
            </div>

            <ol className="divide-rule divide-y">
                {rows.map((row, index) => (
                    <li key={index} className={`${rowGrid} py-3`}>
                        <span className="text-ink-2 figures self-center text-sm [grid-area:idx]">
                            <span className="md:hidden">Item </span>
                            {index + 1}
                        </span>
                        <label className="grid gap-1 [grid-area:qty]">
                            <span className="text-ink-2 text-xs md:sr-only">
                                Quantity
                            </span>
                            <Input
                                inputMode="decimal"
                                className="figures"
                                value={row.quantity}
                                onChange={(e) =>
                                    onChange(index, {
                                        quantity: e.target.value,
                                    })
                                }
                            />
                        </label>
                        <label className="grid gap-1 [grid-area:name]">
                            <span className="text-ink-2 text-xs md:sr-only">
                                Item name
                            </span>
                            <Input
                                value={row.item_name}
                                placeholder={namePlaceholder}
                                onChange={(e) =>
                                    onChange(index, {
                                        item_name: e.target.value,
                                    })
                                }
                            />
                        </label>
                        <label className="grid gap-1 [grid-area:price]">
                            <span className="text-ink-2 text-xs md:sr-only">
                                Price per quantity
                            </span>
                            <Input
                                inputMode="decimal"
                                placeholder="0.00"
                                className="figures"
                                value={row.unit_price}
                                onChange={(e) =>
                                    onChange(index, {
                                        unit_price: e.target.value,
                                    })
                                }
                            />
                        </label>
                        <span className="flex items-baseline justify-end gap-2 [grid-area:total]">
                            <span className="text-ink-2 text-xs md:hidden">
                                Line total
                            </span>
                            <Amount value={itemCents(row)} size="md" />
                        </span>
                        <span className="flex justify-end [grid-area:rm]">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-ink-3 hover:text-past-due"
                                onClick={() => onRemove(index)}
                                aria-label={`Remove item ${index + 1}`}
                                title="Remove"
                            >
                                <X />
                            </Button>
                        </span>
                    </li>
                ))}
            </ol>

            <div className="border-ink rule-double flex flex-wrap items-center justify-between gap-3 border-t pt-3 pb-2.5">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAdd}
                >
                    <Plus />
                    Add item
                </Button>
                <span className="flex items-baseline gap-3">
                    <span className="font-semibold">{totalLabel}</span>
                    <Amount value={total} size="lg" />
                </span>
            </div>
        </div>
    );
}
