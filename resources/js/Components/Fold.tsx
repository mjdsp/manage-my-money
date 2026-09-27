import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { ReactNode, useId, useState } from 'react';

/**
 * A statement section that arrives folded on a phone and unfolds in place,
 * so the first screen stays on what you stand on and what is due. From `lg`
 * up the sheet is laid flat: always open, no toggle.
 */
export default function Fold({
    title,
    summary,
    action,
    children,
    className,
}: {
    title: string;
    /** Shown beside the title on both sizes, e.g. a total. */
    summary?: ReactNode;
    /** Only on the flat (desktop) header, e.g. a link to the full page. */
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const panelId = useId();

    return (
        <section className={className}>
            <h2 className="lg:hidden">
                <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpen(!open)}
                    className="flex w-full items-center gap-3 py-1 text-left"
                >
                    <span className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
                        {title}
                    </span>
                    <span className="ml-auto flex items-center gap-2">
                        {summary}
                        <ChevronDown
                            className={cn(
                                'text-ink-2 size-5 transition-transform duration-200 ease-out',
                                open && 'rotate-180',
                            )}
                            aria-hidden
                        />
                    </span>
                </button>
            </h2>
            <div className="hidden items-baseline gap-3 lg:flex">
                <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
                    {title}
                </h2>
                <div className="ml-auto flex items-baseline gap-4">
                    {summary}
                    {action}
                </div>
            </div>
            <div
                id={panelId}
                className={cn(
                    'mt-3 lg:block',
                    open ? 'animate-fold-open' : 'hidden',
                )}
            >
                {children}
                {action && <div className="mt-3 lg:hidden">{action}</div>}
            </div>
        </section>
    );
}
