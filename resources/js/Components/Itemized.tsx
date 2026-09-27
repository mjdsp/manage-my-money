import Amount from '@/Components/Amount';
import { cn } from '@/lib/utils';
import type { Money } from '@/types/models';
import { ChevronDown } from 'lucide-react';
import { ReactNode, useState } from 'react';

export type ItemizedRow = { name: string; amount: Money; pct: number };

/** Lines a breakdown lists before the rest fold behind "See more". */
const PREVIEW_ROWS = 5;

/**
 * Itemised charges, the way a bill lists them: each line with its share of the
 * total drawn as a bar, then the total set off by a single rule above and a
 * double rule below.
 */
export default function Itemized({
    rows,
    totalLabel,
    totalNote,
    empty,
}: {
    rows: ItemizedRow[];
    totalLabel: string;
    totalNote?: string;
    empty: ReactNode;
}) {
    const [expanded, setExpanded] = useState(false);

    if (rows.length === 0) {
        return <div className="text-ink-2 py-6 text-sm">{empty}</div>;
    }

    const total = rows.reduce((sum, row) => sum + row.amount.cents, 0);
    const collapsible = rows.length > PREVIEW_ROWS;
    const visible =
        collapsible && !expanded ? rows.slice(0, PREVIEW_ROWS) : rows;

    return (
        <div>
            <ul className="divide-rule divide-y">
                {visible.map((row, i) => (
                    <li
                        key={i}
                        className={cn(
                            'py-3 first:pt-1',
                            i >= PREVIEW_ROWS && 'animate-fold-open',
                        )}
                    >
                        <div className="flex items-baseline justify-between gap-4">
                            <span className="min-w-0 truncate text-[0.9375rem]">
                                {row.name}
                            </span>
                            <span className="flex shrink-0 items-baseline gap-3">
                                <Amount value={row.amount} size="sm" />
                                <span className="figures text-ink-2 w-12 text-right text-[0.8125rem]">
                                    {row.pct}%
                                </span>
                            </span>
                        </div>
                        <div
                            className="bg-rule-soft mt-2 h-[5px] overflow-hidden rounded-[1px]"
                            aria-hidden
                        >
                            <div
                                className="bg-band h-full rounded-[1px]"
                                style={{
                                    width: `${total ? (row.amount.cents / total) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </li>
                ))}
            </ul>

            {collapsible && (
                <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpanded(!expanded)}
                    className="text-band hover:text-band-hover mt-1 -ml-1 inline-flex items-center gap-1 rounded-sm px-1 py-1.5 text-sm font-semibold"
                >
                    {expanded
                        ? 'See less'
                        : `See ${rows.length - PREVIEW_ROWS} more`}
                    <ChevronDown
                        className={cn(
                            'size-4 transition-transform duration-200 ease-out',
                            expanded && 'rotate-180',
                        )}
                    />
                </button>
            )}

            <div className="border-ink rule-double mt-2 flex items-baseline justify-between gap-4 border-t pt-3 pb-2.5">
                <span className="font-semibold">
                    {totalLabel}
                    {totalNote && (
                        <span className="text-ink-2 ml-2 text-sm font-normal">
                            {totalNote}
                        </span>
                    )}
                </span>
                <Amount value={total} size="md" />
            </div>
        </div>
    );
}
