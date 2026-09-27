import { buttonVariants } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={cn(buttonVariants({ variant: 'default' }), className)}
        >
            {children}
        </button>
    );
}
