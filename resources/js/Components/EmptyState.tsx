import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

/**
 * What a section says before it has anything in it: what belongs here and
 * how to put it there.
 */
export default function EmptyState({
    title,
    children,
    action,
    className,
}: {
    title: string;
    children?: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('py-8 text-center sm:py-10', className)}>
            <p className="text-ink text-[0.9375rem] font-semibold">{title}</p>
            {children && (
                <p className="text-ink-2 mx-auto mt-1.5 max-w-[42ch] text-sm text-pretty">
                    {children}
                </p>
            )}
            {action && (
                <div className="mt-4 flex justify-center gap-2">{action}</div>
            )}
        </div>
    );
}
