import { buttonVariants } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

/** The one solid red control: confirming something that cannot be undone. */
export default function DangerButton({
    className = '',
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={cn(
                buttonVariants(),
                'bg-past-due focus-visible:outline-past-due text-white hover:bg-[color-mix(in_oklch,var(--past-due),black_14%)]',
                className,
            )}
        >
            {children}
        </button>
    );
}
