import { Dialog as DialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';

function Dialog({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-[oklch(0.222_0.012_237/0.32)] duration-200 ease-out data-closed:duration-150',
                className,
            )}
            {...props}
        />
    );
}

/**
 * A sheet laid over the statement. On a phone it rises from the bottom edge
 * like a native sheet; from `sm` up it sits centred and fades in.
 */
function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
}) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    'bg-popover text-popover-foreground shadow-pop fixed z-50 grid w-full gap-5 text-sm outline-none',
                    // Phone: a bottom sheet.
                    'inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-2xl px-5 pt-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]',
                    'data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom data-open:ease-drawer duration-300 data-closed:duration-200 data-closed:ease-out',
                    // From sm: a centred sheet.
                    'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[min(88dvh,52rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:px-6 sm:pt-6 sm:pb-6',
                    'sm:data-open:slide-in-from-bottom-0 sm:data-closed:slide-out-to-bottom-0 sm:data-open:fade-in-0 sm:data-open:zoom-in-[0.97] sm:data-closed:fade-out-0 sm:data-closed:zoom-out-[0.97] sm:duration-200 sm:data-closed:duration-150 sm:data-open:ease-out',
                    className,
                )}
                {...props}
            >
                <span
                    aria-hidden
                    className="bg-rule absolute top-2 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full sm:hidden"
                />
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close data-slot="dialog-close" asChild>
                        <Button
                            variant="ghost"
                            className="text-ink-2 absolute top-3 right-3"
                            size="icon-sm"
                        >
                            <XIcon />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="dialog-header"
            className={cn('flex flex-col gap-1.5 pr-8', className)}
            {...props}
        />
    );
}

function DialogFooter({
    className,
    showCloseButton = false,
    children,
    ...props
}: React.ComponentProps<'div'> & {
    showCloseButton?: boolean;
}) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                'border-rule -mx-5 flex flex-col-reverse gap-2 border-t px-5 pt-4 sm:-mx-6 sm:flex-row sm:items-center sm:justify-end sm:px-6',
                className,
            )}
            {...props}
        >
            {children}
            {showCloseButton && (
                <DialogPrimitive.Close asChild>
                    <Button variant="outline">Close</Button>
                </DialogPrimitive.Close>
            )}
        </div>
    );
}

function DialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn(
                'font-heading text-lg leading-tight font-semibold tracking-[-0.015em]',
                className,
            )}
            {...props}
        />
    );
}

function DialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn(
                'text-ink-2 *:[a]:hover:text-ink text-sm text-pretty *:[a]:underline *:[a]:underline-offset-3',
                className,
            )}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
