import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p
            role="alert"
            {...props}
            className={cn('text-past-due text-[0.8125rem]', className)}
        >
            {message}
        </p>
    ) : null;
}
