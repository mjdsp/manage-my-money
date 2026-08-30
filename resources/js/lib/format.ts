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
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
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
