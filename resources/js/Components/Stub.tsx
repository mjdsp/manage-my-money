import Amount from '@/Components/Amount';
import { Badge } from '@/Components/ui/badge';
import { daysUntil, dueLabel, formatMonthDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Money } from '@/types/models';
import { ReactNode } from 'react';

/**
 * A payment stub: what is due and when above the perforation, the way to pay
 * it below. Posting tears the lower half off along the perforation.
 */
export default function Stub({
    title,
    amount,
    dueDate,
    incoming = false,
    paused = false,
    meta,
    stamps,
    actions,
    tearing = false,
    className,
}: {
    title: string;
    amount: Money;
    dueDate: string;
    /** Money coming in (a salary, a repayment) rather than a bill. */
    incoming?: boolean;
    paused?: boolean;
    meta?: ReactNode;
    stamps?: ReactNode;
    actions: ReactNode;
    tearing?: boolean;
    className?: string;
}) {
    const late = !paused && daysUntil(dueDate) < 0;

    return (
        <article
            className={cn(
                'stub-shadow flex flex-col',
                paused && 'opacity-60',
                className,
            )}
        >
            <div className="bg-paper notch-bottom relative flex-1 rounded-t-[5px] px-4 pt-4 pb-5">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[0.9375rem] leading-snug font-semibold text-pretty">
                        {title}
                    </h3>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        {late && <Badge variant="destructive">Past due</Badge>}
                        {incoming && <Badge variant="credit">Incoming</Badge>}
                        {stamps}
                    </div>
                </div>
                <div className="mt-3">
                    <Amount
                        value={amount}
                        size="lg"
                        sign={incoming ? 'plus' : 'none'}
                        tone={incoming ? 'credit' : 'ink'}
                    />
                </div>
                <p
                    className={cn(
                        'mt-2 text-[0.8125rem]',
                        late ? 'text-past-due font-semibold' : 'text-ink-2',
                    )}
                >
                    <time dateTime={dueDate}>{formatMonthDay(dueDate)}</time>
                    {!paused && <> · {dueLabel(dueDate)}</>}
                </p>
                {meta && (
                    <p className="text-ink-2 mt-1 text-[0.8125rem]">{meta}</p>
                )}
                <div
                    className="perforation absolute inset-x-3 bottom-0"
                    aria-hidden
                />
            </div>
            <div
                className={cn(
                    'bg-paper notch-top flex flex-wrap items-center gap-1.5 rounded-b-[5px] px-3 py-2.5',
                    tearing && 'animate-stub-tear origin-top-left',
                )}
            >
                {actions}
            </div>
        </article>
    );
}
