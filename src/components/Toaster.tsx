/**
 * Toaster — renders the active toast queue from `ToastContext`.
 *
 * Visual language follows the brutalist design system: hairline border,
 * tight radii, tabular numerals. No backdrop blur. Action button is
 * a high-contrast inline button.
 *
 * The Toaster mounts a single fixed container near the top of the
 * viewport (or above the bottom nav on small screens via safe-area),
 * stacking toasts most-recent-on-top.
 */

import React, { useCallback } from 'react';
import { useToast, useToastQueue, type ToastInstance } from '../context/ToastContext';

const variantStyles: Record<ToastInstance['variant'], string> = {
    info: 'bg-sys-surfaceContainerHigh text-sys-onSurface border-sys-outline',
    success:
        'bg-sys-surfaceContainerHigh text-sys-onSurface border-sys-success ring-1 ring-sys-success/30',
    error:
        'bg-sys-surfaceContainerHigh text-sys-onSurface border-sys-error ring-1 ring-sys-error/30',
};

const ToastItem: React.FC<{ toast: ToastInstance }> = ({ toast }) => {
    const { dismiss } = useToast();

    const onAction = useCallback(() => {
        toast.action?.onClick();
        dismiss(toast.id);
    }, [toast, dismiss]);

    return (
        <div
            role="status"
            aria-live="polite"
            data-testid={`toast-${toast.variant}`}
            className={`
                pointer-events-auto
                flex items-center gap-3
                min-w-65 max-w-110
                px-4 py-2.5
                rounded-md border
                shadow-elevation-2
                text-sm font-medium
                animate-fade-in
                ${variantStyles[toast.variant]}
            `}
        >
            <span className="flex-1 truncate">{toast.message}</span>
            {toast.action && (
                <button
                    type="button"
                    onClick={onAction}
                    className="text-sys-primary font-bold text-sm uppercase tracking-wide px-2 py-1 rounded-sm hover:bg-sys-primary/10 active:scale-95 transition-all"
                >
                    {toast.action.label}
                </button>
            )}
            <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-sys-onSurfaceVar text-base leading-none px-1 hover:text-sys-onSurface"
                aria-label="Dismiss notification"
            >
                ×
            </button>
        </div>
    );
};

export const Toaster: React.FC = () => {
    const toasts = useToastQueue();
    if (toasts.length === 0) return null;

    return (
        <div
            data-testid="toaster"
            className="fixed inset-x-0 bottom-24 sm:bottom-6 z-9000 flex flex-col items-center gap-2 px-4 pointer-events-none"
            // NB: bottom-24 leaves room for the bottom nav on mobile; bottom-6 desktop.
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
};
