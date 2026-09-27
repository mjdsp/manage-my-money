import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

/**
 * A labelled form control. The label wraps the control so clicking it focuses
 * (or opens) the control and screen readers get its name; the error sits
 * outside and is announced when it appears.
 */
export default function FormField({
    label,
    error,
    hint,
    className,
    children,
}: {
    label: string;
    error?: string;
    hint?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('grid content-start gap-1.5', className)}>
            <label className="grid gap-1.5">
                <span className="text-ink text-[0.8125rem] leading-none font-semibold">
                    {label}
                </span>
                {children}
            </label>
            {hint && !error && (
                <p className="text-ink-2 text-xs text-pretty">{hint}</p>
            )}
            {error && (
                <p role="alert" className="text-past-due text-[0.8125rem]">
                    {error}
                </p>
            )}
        </div>
    );
}
