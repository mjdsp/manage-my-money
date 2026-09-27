import { amountParts, MINUS } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Money } from '@/types/models';

const sizes = {
    sm: 'text-sm font-medium',
    md: 'text-[0.9375rem] font-semibold',
    lg: 'text-[1.375rem] leading-none font-semibold tracking-[-0.02em] [font-stretch:108%]',
    // Sized against its container (13cqi fits eight-digit pesos), capped at 3.5rem.
    display:
        'text-[clamp(1.75rem,13cqi,3.5rem)] leading-[0.95] font-bold tracking-[-0.035em] [font-stretch:116%]',
} as const;

/** Currency and centavos step down at the sizes where the pesos should lead. */
const currencySizes = {
    sm: '',
    md: '',
    lg: 'text-[0.72em] mr-[0.06em]',
    display: 'text-[0.52em] mr-[0.1em] font-semibold',
} as const;

const centavoSizes = {
    sm: '',
    md: '',
    lg: 'text-[0.72em]',
    display: 'text-[0.46em] font-semibold tracking-[-0.01em]',
} as const;

const tones = {
    inherit: '',
    ink: 'text-ink',
    muted: 'text-ink-2',
    credit: 'text-credit',
    'past-due': 'text-past-due',
} as const;

/**
 * An amount as a statement prints it: tabular figures, a true minus sign, and
 * at display sizes the pesos lead while the peso sign and centavos step down.
 *
 * `sign` controls the direction mark: `auto` shows a minus only for negatives,
 * `plus` / `minus` state money in or out explicitly, `none` prints the magnitude.
 */
export default function Amount({
    value,
    sign = 'auto',
    size = 'md',
    tone = 'inherit',
    className,
}: {
    value: Money | number | null | undefined;
    sign?: 'auto' | 'plus' | 'minus' | 'none';
    size?: keyof typeof sizes;
    tone?: keyof typeof tones;
    className?: string;
}) {
    const { negative, whole, centavos } = amountParts(value);
    const mark =
        sign === 'plus'
            ? '+'
            : sign === 'minus' || (sign === 'auto' && negative)
              ? MINUS
              : '';

    return (
        <span
            className={cn(
                'figures inline-flex items-baseline whitespace-nowrap',
                sizes[size],
                tones[tone],
                className,
            )}
        >
            {mark && <span className="mr-[0.06em]">{mark}</span>}
            <span className={currencySizes[size]}>₱</span>
            <span>{whole}</span>
            <span className={centavoSizes[size]}>.{centavos}</span>
        </span>
    );
}
