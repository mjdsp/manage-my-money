import * as React from 'react';

import { cn } from '@/lib/utils';

/** Shared with Breeze's TextInput so every field in the app is the same field. */
const inputClassName =
    'border-input bg-paper text-ink file:text-ink placeholder:text-ink-3 focus-visible:border-band focus-visible:ring-band/20 aria-invalid:border-past-due aria-invalid:ring-past-due/15 disabled:bg-muted h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-[inset_0_1px_0_oklch(0.222_0.012_237/0.04)] transition-[border-color,box-shadow] duration-150 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-semibold focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:ring-3 pointer-coarse:h-11 pointer-coarse:text-base';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(inputClassName, className)}
            {...props}
        />
    );
}

export { Input, inputClassName };
