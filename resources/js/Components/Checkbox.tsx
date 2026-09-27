import { cn } from '@/lib/utils';
import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={cn(
                'border-input text-band focus:ring-band size-4 rounded-[3px] shadow-none focus:ring-2 focus:ring-offset-2 pointer-coarse:size-5',
                className,
            )}
        />
    );
}
