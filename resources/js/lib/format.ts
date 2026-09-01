import type { Money } from '@/types/models';

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
