import ApplicationLogo from '@/Components/ApplicationLogo';
import { cn } from '@/lib/utils';

/** The mark and name, set as the issuer line of the statement. */
export default function Wordmark({
    collapse = false,
    className,
}: {
    /** Between lg and xl the nav needs the room: keep only the mark. */
    collapse?: boolean;
    className?: string;
}) {
    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <ApplicationLogo className="size-7 shrink-0" />
            <span
                className={cn(
                    'text-[0.9375rem] leading-none font-semibold tracking-[-0.01em] whitespace-nowrap [font-stretch:112%]',
                    collapse && 'lg:max-xl:sr-only',
                )}
            >
                Manage My Money
            </span>
        </span>
    );
}
