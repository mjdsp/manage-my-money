import type { Money } from '@/types/models';
import { differenceInCalendarDays, parseISO } from 'date-fns';

/** A real minus sign; the hyphen-minus reads as a dash next to figures. */
export const MINUS = '−';

export function peso(value: Money | number | null | undefined): string {
    if (value == null) return '₱0.00';
    if (typeof value === 'number') {
        const sign = value < 0 ? '-' : '';
        return `${sign}₱${Math.abs(value / 100).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }
    return value.formatted;
}

export function cents(value: Money | null | undefined): number {
    return value?.cents ?? 0;
}

const wholePesos = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 });

/**
 * The parts a statement prints for an amount: its sign, the whole pesos with
 * grouping, and the two centavo digits. Accepts Money or a count of cents.
 */
export function amountParts(value: Money | number | null | undefined): {
    negative: boolean;
    whole: string;
    centavos: string;
} {
    const total = typeof value === 'number' ? value : (value?.cents ?? 0);
    const magnitude = Math.abs(Math.round(total));

    return {
        negative: total < 0,
        whole: wholePesos.format(Math.floor(magnitude / 100)),
        centavos: String(magnitude % 100).padStart(2, '0'),
    };
}

export function formatDate(iso: string): string {
    // Accept a bare "2026-08-31" as well as a full ISO string like
    // "2026-08-31T00:00:00.000000Z"; never render "Invalid Date".
    const date = new Date(iso.length > 10 ? iso : `${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/** "Sep 25": for due dates that sit inside the month being read. */
export function formatMonthDay(iso: string): string {
    const date = new Date(iso.length > 10 ? iso : `${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/** Whole calendar days from today to a date; negative once it has passed. */
export function daysUntil(iso: string): number {
    return differenceInCalendarDays(parseISO(iso.slice(0, 10)), new Date());
}

/** "Due today", "Due in 3 days", "2 days late". */
export function dueLabel(iso: string): string {
    const days = daysUntil(iso);
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days > 1) return `Due in ${days} days`;
    if (days === -1) return '1 day late';
    return `${-days} days late`;
}

/** Today's date as YYYY-MM-DD in the user's local timezone (not UTC). */
export function todayISO(): string {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

export function monthLabel(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-PH', {
        month: 'long',
        year: 'numeric',
    });
}

export function titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
