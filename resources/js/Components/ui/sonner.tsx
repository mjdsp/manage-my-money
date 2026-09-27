'use client';

import {
    CircleCheckIcon,
    InfoIcon,
    Loader2Icon,
    OctagonXIcon,
    TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Toasts are printed on the same paper as the statement; only the icon carries
 * the outcome. The app has no dark theme, so the toaster is pinned to light
 * instead of following the OS.
 */
const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            theme="light"
            className="toaster group"
            icons={{
                success: <CircleCheckIcon className="text-band size-4" />,
                info: <InfoIcon className="text-ink-2 size-4" />,
                warning: <TriangleAlertIcon className="text-due-ink size-4" />,
                error: <OctagonXIcon className="text-past-due size-4" />,
                loading: (
                    <Loader2Icon className="text-ink-2 size-4 animate-spin" />
                ),
            }}
            style={
                {
                    '--normal-bg': 'var(--paper)',
                    '--normal-text': 'var(--ink)',
                    '--normal-border': 'var(--rule)',
                    '--border-radius': 'var(--radius)',
                } as React.CSSProperties
            }
            toastOptions={{
                classNames: {
                    toast: 'cn-toast font-sans! text-sm! shadow-pop!',
                    description: 'text-ink-2!',
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
