import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * A printed status mark: a small ruled rectangle in condensed caps, the way a
 * statement prints PAST DUE or AUTO-DEBIT beside a line.
 */
const badgeVariants = cva(
    'group/badge inline-flex h-[1.125rem] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[3px] border px-1.5 text-[0.65625rem] leading-none font-semibold tracking-[0.06em] whitespace-nowrap uppercase [font-stretch:80%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>svg]:pointer-events-none [&>svg]:size-3!',
    {
        variants: {
            variant: {
                default: 'border-band bg-band text-band-ink',
                secondary: 'border-band/40 bg-band-tint text-band',
                destructive:
                    'border-past-due/50 bg-past-due-tint text-past-due',
                outline: 'border-ink-3/40 text-ink-2',
                due: 'border-due-ink/30 bg-due text-due-ink',
                credit: 'border-credit/40 bg-credit-tint text-credit',
                ghost: 'border-transparent text-ink-2',
                link: 'border-transparent text-band underline-offset-4 hover:underline',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

function Badge({
    className,
    variant = 'default',
    asChild = false,
    ...props
}: React.ComponentProps<'span'> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot.Root : 'span';

    return (
        <Comp
            data-slot="badge"
            data-variant={variant}
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
