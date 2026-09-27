import Wordmark from '@/Components/Wordmark';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Toaster } from '@/Components/ui/sonner';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    CalendarClock,
    ChevronDown,
    ChevronRight,
    Ellipsis,
    FileText,
    House,
    Landmark,
    LogOut,
    type LucideIcon,
    ReceiptText,
    Tags,
    UserRound,
} from 'lucide-react';
import { PropsWithChildren, useEffect, useState } from 'react';
import { toast } from 'sonner';

type NavItem = {
    label: string;
    route: string;
    pattern: string;
    icon: LucideIcon;
};

/** On a phone these four sit in the tab bar; the rest live under More. */
const PRIMARY: NavItem[] = [
    {
        label: 'Dashboard',
        route: 'dashboard',
        pattern: 'dashboard',
        icon: House,
    },
    {
        label: 'Transactions',
        route: 'transactions.index',
        pattern: 'transactions.*',
        icon: ArrowLeftRight,
    },
    {
        label: 'Scheduled',
        route: 'scheduled-transactions.index',
        pattern: 'scheduled-transactions.*',
        icon: CalendarClock,
    },
    {
        label: 'Accounts',
        route: 'accounts.index',
        pattern: 'accounts.*',
        icon: Landmark,
    },
];

const SECONDARY: NavItem[] = [
    {
        label: 'Categories',
        route: 'categories.index',
        pattern: 'categories.*',
        icon: Tags,
    },
    {
        label: 'Reimbursements',
        route: 'reimbursements.index',
        pattern: 'reimbursements.*',
        icon: ReceiptText,
    },
    {
        label: 'Reports',
        route: 'reports.monthly',
        pattern: 'reports.*',
        icon: FileText,
    },
];

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function UserMenu() {
    const user = usePage().props.auth.user;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="text-band-ink focus-visible:outline-band-ink flex items-center gap-2 rounded-md p-1.5 text-sm font-medium transition-colors duration-150 hover:bg-white/10 aria-expanded:bg-white/10 xl:pr-2"
                >
                    <span
                        aria-hidden
                        className="grid size-7 place-items-center rounded-full bg-white/15 text-[0.6875rem] font-semibold tracking-wide"
                    >
                        {initials(user.name)}
                    </span>
                    <span className="hidden max-w-40 truncate xl:inline">
                        {user.name}
                    </span>
                    <span className="sr-only xl:hidden">Account menu</span>
                    <ChevronDown
                        className="hidden size-4 opacity-70 xl:block"
                        aria-hidden
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="grid gap-0.5">
                    <span className="text-ink truncate text-sm font-semibold">
                        {user.name}
                    </span>
                    <span className="truncate font-normal">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={route('profile.edit')}>
                        <UserRound />
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full"
                    >
                        <LogOut />
                        Log out
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function TabLink({ item }: { item: NavItem }) {
    const active = route().current(item.pattern);
    const Icon = item.icon;

    return (
        <Link
            href={route(item.route)}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'active:bg-muted relative flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors duration-150',
                active ? 'text-band' : 'text-ink-2',
            )}
        >
            {active && (
                <span
                    aria-hidden
                    className="bg-band absolute inset-x-4 top-0 h-0.5 rounded-b-full"
                />
            )}
            <Icon
                className="size-[1.375rem]"
                strokeWidth={active ? 2.25 : 1.75}
                aria-hidden
            />
            {item.label}
        </Link>
    );
}

/** The phone's fifth tab: the sections that don't fit, plus the account. */
function MoreSheet() {
    const [open, setOpen] = useState(false);
    const user = usePage().props.auth.user;
    const active = SECONDARY.some((item) => route().current(item.pattern));

    useEffect(() => router.on('start', () => setOpen(false)), []);

    const row =
        'flex w-full items-center gap-3 rounded-md px-3 py-3.5 text-left text-[0.9375rem] font-medium transition-colors duration-150 active:bg-muted';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'active:bg-muted relative flex h-full w-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors duration-150',
                        active ? 'text-band' : 'text-ink-2',
                    )}
                >
                    {active && (
                        <span
                            aria-hidden
                            className="bg-band absolute inset-x-4 top-0 h-0.5 rounded-b-full"
                        />
                    )}
                    <Ellipsis className="size-[1.375rem]" aria-hidden />
                    More
                </button>
            </DialogTrigger>
            <DialogContent className="gap-3">
                <DialogTitle>More</DialogTitle>
                <DialogDescription className="sr-only">
                    Other sections and your account
                </DialogDescription>
                <nav aria-label="More sections" className="-mx-2 grid">
                    {SECONDARY.map((item) => {
                        const Icon = item.icon;
                        const current = route().current(item.pattern);
                        return (
                            <Link
                                key={item.route}
                                href={route(item.route)}
                                aria-current={current ? 'page' : undefined}
                                className={cn(
                                    row,
                                    current && 'bg-band-tint text-band',
                                )}
                            >
                                <Icon
                                    className="text-ink-2 size-5"
                                    aria-hidden
                                />
                                {item.label}
                                <ChevronRight
                                    className="text-ink-3 ml-auto size-4"
                                    aria-hidden
                                />
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-rule -mx-2 grid border-t pt-3">
                    <p className="text-ink-2 truncate px-3 pb-1 text-sm">
                        Signed in as{' '}
                        <span className="text-ink font-semibold">
                            {user.name}
                        </span>
                    </p>
                    <Link href={route('profile.edit')} className={row}>
                        <UserRound className="text-ink-2 size-5" aria-hidden />
                        Profile
                    </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className={row}
                    >
                        <LogOut className="text-ink-2 size-5" aria-hidden />
                        Log out
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function Authenticated({ children }: PropsWithChildren) {
    const flash = usePage().props.flash;

    // A toast renders in a portal and outlives the page that triggered it, so
    // without this it stays on screen after you navigate away. Dismiss any
    // visible toast the moment the next navigation starts.
    useEffect(() => router.on('start', () => toast.dismiss()), []);

    useEffect(() => {
        if (flash?.status) {
            toast.success(flash.status);
        }
    }, [flash?.status]);

    useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.error]);

    return (
        <div className="bg-background min-h-dvh">
            <header className="bg-band text-band-ink sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)]">
                <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:h-16 lg:px-8 xl:gap-8">
                    <Link
                        href={route('dashboard')}
                        className="focus-visible:outline-band-ink -m-1 shrink-0 rounded-sm p-1"
                    >
                        <Wordmark collapse />
                    </Link>

                    <nav
                        aria-label="Main"
                        className="hidden items-end gap-0.5 self-stretch lg:flex"
                    >
                        {[...PRIMARY, ...SECONDARY].map((item) => {
                            const active = route().current(item.pattern);
                            return (
                                <Link
                                    key={item.route}
                                    href={route(item.route)}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'focus-visible:outline-band-ink flex h-11 items-center rounded-t-md px-2.5 text-sm font-medium transition-colors duration-150 focus-visible:-outline-offset-2 xl:px-3',
                                        active
                                            ? 'bg-background text-ink'
                                            : 'text-band-ink-2 hover:text-band-ink hover:bg-white/8',
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="ml-auto">
                        <UserMenu />
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pt-8 lg:px-8 lg:pb-20">
                {children}
            </main>

            <nav
                aria-label="Main"
                className="bg-paper border-rule fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
            >
                <ul className="mx-auto grid h-16 max-w-xl grid-cols-5">
                    {PRIMARY.map((item) => (
                        <li key={item.route}>
                            <TabLink item={item} />
                        </li>
                    ))}
                    <li>
                        <MoreSheet />
                    </li>
                </ul>
            </nav>

            <Toaster
                position="top-center"
                offset={{ top: 80 }}
                mobileOffset={{
                    top: 'calc(4rem + env(safe-area-inset-top, 0px))',
                }}
            />
        </div>
    );
}
