import Wordmark from '@/Components/Wordmark';
import { Link } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

/**
 * Signed-out pages: the issuer band, then a single sheet with one task on it.
 */
export default function Guest({
    title,
    description,
    children,
}: PropsWithChildren<{ title: string; description?: ReactNode }>) {
    return (
        <div className="bg-background flex min-h-dvh flex-col">
            <header className="bg-band text-band-ink pt-[env(safe-area-inset-top,0px)]">
                <div className="mx-auto flex h-14 max-w-md items-center px-5 sm:px-0 lg:h-16">
                    <Link
                        href="/"
                        className="focus-visible:outline-band-ink -m-1 rounded-sm p-1"
                    >
                        <Wordmark />
                    </Link>
                </div>
            </header>

            <main className="flex flex-1 justify-center px-4 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:items-start sm:pt-16">
                <div className="bg-paper shadow-sheet w-full max-w-md self-start rounded-[5px] px-5 py-7 sm:px-8 sm:py-9">
                    <h1 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.025em] text-balance [font-stretch:106%]">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-ink-2 mt-2 text-[0.9375rem] text-pretty">
                            {description}
                        </p>
                    )}
                    <div className="mt-7">{children}</div>
                </div>
            </main>
        </div>
    );
}
