import { ReactNode } from 'react';

/**
 * The statement heading for a page: a title set a size above everything on
 * the sheet, one plain line of purpose, and the page's actions to the right.
 */
export default function PageHeader({
    title,
    description,
    actions,
}: {
    title: string;
    description?: string;
    actions?: ReactNode;
}) {
    return (
        <header className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-8">
            <div className="max-w-2xl min-w-0">
                <h1 className="text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.025em] text-balance [font-stretch:106%] sm:text-[2rem]">
                    {title}
                </h1>
                {description && (
                    <p className="text-ink-2 mt-2 text-[0.9375rem] text-pretty">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </header>
    );
}
