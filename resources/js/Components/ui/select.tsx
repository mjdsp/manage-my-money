import { Select as SelectPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

function Select({
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
    return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
    return (
        <SelectPrimitive.Group
            data-slot="select-group"
            className={cn('scroll-my-1 p-1', className)}
            {...props}
        />
    );
}

function SelectValue({
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
    return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
    className,
    size = 'default',
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
    size?: 'sm' | 'default';
}) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            data-size={size}
            className={cn(
                "border-input bg-paper text-ink focus-visible:border-band focus-visible:ring-band/20 aria-invalid:border-past-due aria-invalid:ring-past-due/15 data-placeholder:text-ink-3 hover:border-ink-3 flex w-fit items-center justify-between gap-1.5 rounded-md border py-2 pr-2.5 pl-3 text-sm whitespace-nowrap shadow-[inset_0_1px_0_oklch(0.222_0.012_237/0.04)] transition-[border-color,box-shadow] duration-150 outline-none select-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:ring-3 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 pointer-coarse:text-base pointer-coarse:data-[size=default]:h-11 pointer-coarse:data-[size=sm]:h-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className,
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDownIcon className="text-ink-2 pointer-events-none size-4" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

function SelectContent({
    className,
    children,
    position = 'item-aligned',
    align = 'center',
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                data-slot="select-content"
                data-align-trigger={position === 'item-aligned'}
                className={cn(
                    'bg-popover text-popover-foreground shadow-pop data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97] relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto overscroll-contain rounded-md p-1 duration-150 ease-out data-closed:duration-100 data-[align-trigger=true]:animate-none',
                    position === 'popper' &&
                        'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
                    className,
                )}
                position={position}
                align={align}
                {...props}
            >
                <SelectScrollUpButton />
                <SelectPrimitive.Viewport
                    data-position={position}
                    className={cn(
                        'data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)',
                        position === 'popper' && '',
                    )}
                >
                    {children}
                </SelectPrimitive.Viewport>
                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

function SelectLabel({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
    return (
        <SelectPrimitive.Label
            data-slot="select-label"
            className={cn('label-caps text-ink-2 px-2 py-1.5', className)}
            {...props}
        />
    );
}

function SelectItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item
            data-slot="select-item"
            className={cn(
                "focus:bg-band-tint focus:text-ink relative flex w-full cursor-default items-center gap-1.5 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-[state=checked]:font-semibold pointer-coarse:py-2.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
                className,
            )}
            {...props}
        >
            <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                <SelectPrimitive.ItemIndicator>
                    <CheckIcon className="text-band pointer-events-none" />
                </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

function SelectSeparator({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
    return (
        <SelectPrimitive.Separator
            data-slot="select-separator"
            className={cn(
                'bg-rule pointer-events-none -mx-1 my-1 h-px',
                className,
            )}
            {...props}
        />
    );
}

function SelectScrollUpButton({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
    return (
        <SelectPrimitive.ScrollUpButton
            data-slot="select-scroll-up-button"
            className={cn(
                "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4",
                className,
            )}
            {...props}
        >
            <ChevronUpIcon />
        </SelectPrimitive.ScrollUpButton>
    );
}

function SelectScrollDownButton({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
    return (
        <SelectPrimitive.ScrollDownButton
            data-slot="select-scroll-down-button"
            className={cn(
                "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4",
                className,
            )}
            {...props}
        >
            <ChevronDownIcon />
        </SelectPrimitive.ScrollDownButton>
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};
