import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-sm font-semibold whitespace-nowrap outline-none select-none [transition:transform_160ms_var(--ease-out),background-color_150ms_ease,color_150ms_ease,border-color_150ms_ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground hover:bg-band-hover',
                outline:
                    'border-input bg-paper text-ink hover:border-ink-3 hover:bg-muted aria-expanded:bg-muted',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--band)_8%)] aria-expanded:bg-[color-mix(in_oklch,var(--secondary),var(--band)_8%)]',
                ghost: 'text-ink hover:bg-muted aria-expanded:bg-muted',
                destructive:
                    'text-past-due hover:bg-past-due-tint focus-visible:outline-past-due',
                link: 'text-band underline-offset-4 hover:underline active:not-aria-[haspopup]:scale-100',
            },
            size: {
                default:
                    'h-9 gap-1.5 px-3.5 pointer-coarse:h-11 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
                xs: "h-7 gap-1 rounded-sm px-2 text-xs pointer-coarse:h-9 [&_svg:not([class*='size-'])]:size-3.5",
                sm: "h-8 gap-1 px-2.5 text-[0.8125rem] pointer-coarse:h-10 [&_svg:not([class*='size-'])]:size-3.5",
                lg: 'h-11 gap-2 px-5 text-[0.9375rem]',
                icon: 'size-9 pointer-coarse:size-11',
                'icon-xs':
                    "size-7 rounded-sm pointer-coarse:size-9 [&_svg:not([class*='size-'])]:size-3.5",
                'icon-sm': 'size-8 pointer-coarse:size-10',
                'icon-lg': 'size-11',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

/*
 * forwardRef matters here: this app runs React 18, where a plain function
 * component drops the ref Radix passes when a Button is a trigger's asChild
 * child. Without it a dropdown has no anchor and opens off-screen.
 */
const Button = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<'button'> &
        VariantProps<typeof buttonVariants> & {
            asChild?: boolean;
        }
>(function Button(
    {
        className,
        variant = 'default',
        size = 'default',
        asChild = false,
        ...props
    },
    ref,
) {
    const Comp = asChild ? Slot.Root : 'button';

    return (
        <Comp
            ref={ref}
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
});

export { Button, buttonVariants };
