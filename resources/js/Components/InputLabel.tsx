import { cn } from '@/lib/utils';
import { LabelHTMLAttributes } from 'react';

export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { value?: string }) {
    return (
        <label
            {...props}
            className={cn(
                'text-ink block text-[0.8125rem] font-semibold',
                className,
            )}
        >
            {value ? value : children}
        </label>
    );
}
