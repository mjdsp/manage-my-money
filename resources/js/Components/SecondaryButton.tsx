import { buttonVariants } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
    type = 'button',
    className = '',
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={cn(buttonVariants({ variant: 'outline' }), className)}
        >
            {children}
        </button>
    );
}
