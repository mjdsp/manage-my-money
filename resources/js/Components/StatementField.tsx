import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

/**
 * One labelled figure on the statement: a condensed caps label over its
 * value. Use inside a <dl>.
 */
export default function StatementField({
    label,
    children,
    align = 'start',
    className,
}: {
    label: ReactNode;
    children: ReactNode;
    align?: 'start' | 'end';
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex min-w-0 flex-col gap-1',
                align === 'end' && 'items-end text-right',
                className,
            )}
        >
            <dt className="label-caps text-ink-2">{label}</dt>
            <dd className="min-w-0">{children}</dd>
        </div>
    );
}
