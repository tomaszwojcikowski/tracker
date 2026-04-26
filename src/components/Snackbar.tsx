/**
 * Snackbar Component
 *
 * Material Design 3 snackbar implementation for brief messages and actions.
 * Supports:
 * - Single-line and two-line variants
 * - Optional action button
 * - Auto-dismiss with configurable duration
 * - Stacked action layout for long text
 * - Animated entrance/exit
 */

import React, { useEffect, useCallback } from 'react';
import { X } from './icons';

export interface SnackbarProps {
    /** Whether the snackbar is visible */
    isOpen: boolean;
    /** The message to display */
    message: string;
    /** Optional action button text */
    actionLabel?: string;
    /** Callback when action is clicked */
    onAction?: () => void;
    /** Callback when snackbar should close */
    onClose: () => void;
    /** Auto-dismiss duration in ms (0 = no auto-dismiss, default: 4000) */
    duration?: number;
    /** Variant: 'single-line' | 'two-line' | 'stacked' */
    variant?: 'single-line' | 'two-line' | 'stacked';
    /** Icon to show (optional) */
    icon?: React.ReactNode;
    /** Type for color styling */
    type?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

/**
 * MD3 Snackbar Component
 *
 * Specs:
 * - Min width: 344dp (mobile fills width with 16dp margins)
 * - Max width: 568dp
 * - Container: Inverse surface color
 * - Text: Inverse on-surface color
 * - Action: Inverse primary color
 * - Elevation: Level 3
 * - Corner radius: 4dp (extra small)
 */
export const Snackbar: React.FC<SnackbarProps> = ({
    isOpen,
    message,
    actionLabel,
    onAction,
    onClose,
    duration = 4000,
    variant = 'single-line',
    icon,
    type = 'default',
}) => {
    // Auto-dismiss timer
    useEffect(() => {
        if (!isOpen || duration === 0) return;

        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [isOpen, duration, onClose]);

    const handleAction = useCallback(() => {
        onAction?.();
        onClose();
    }, [onAction, onClose]);

    if (!isOpen) return null;

    // Type-based styling
    const typeStyles = {
        default: 'bg-sys-inverseSurface text-sys-inverseOnSurface',
        success: 'bg-sys-successContainer text-sys-onSuccessContainer',
        error: 'bg-sys-errorContainer text-sys-onErrorContainer',
        warning: 'bg-sys-tertiaryContainer text-sys-onTertiaryContainer',
        info: 'bg-sys-primaryContainer text-sys-onPrimaryContainer',
    };

    const actionStyles = {
        default: 'text-sys-inversePrimary hover:bg-white/10',
        success: 'text-sys-success hover:bg-sys-success/10',
        error: 'text-sys-error hover:bg-sys-error/10',
        warning: 'text-sys-tertiary hover:bg-sys-tertiary/10',
        info: 'text-sys-primary hover:bg-sys-primary/10',
    };

    const isStacked = variant === 'stacked';

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[200] pointer-events-none p-4 safe-pb flex justify-center">
            <div
                role="alert"
                aria-live="polite"
                className={`
                    pointer-events-auto
                    min-w-[288px] max-w-[568px] w-full sm:w-auto
                    rounded-2xl shadow-elevation-4
                    backdrop-blur-xl
                    border border-sys-outlineVariant
                    bg-opacity-90
                    animate-slide-up
                    ${typeStyles[type]}
                    ${isStacked ? 'py-3' : 'py-3.5'}
                `}
            >
                <div className={`flex ${isStacked ? 'flex-col gap-2' : 'items-center gap-3'} px-4`}>
                    {/* Icon + Message */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {icon && (
                            <span className="flex-shrink-0" aria-hidden="true">
                                {icon}
                            </span>
                        )}
                        <p className={`text-sm font-medium leading-tight ${variant === 'two-line' ? 'line-clamp-2' : 'truncate'}`}>
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className={`flex items-center gap-2 ${isStacked ? 'self-end' : 'flex-shrink-0'}`}>
                        {actionLabel && (
                            <button
                                onClick={handleAction}
                                className={`
                                    px-3 py-1.5 rounded-lg
                                    text-sm font-bold
                                    transition-colors
                                    ${actionStyles[type]}
                                `}
                            >
                                {actionLabel}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`
                                p-1.5 rounded-full
                                transition-colors
                                opacity-70 hover:opacity-100
                                ${type === 'default' ? 'hover:bg-white/10' : 'hover:bg-black/10'}
                            `}
                            aria-label="Dismiss"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * useSnackbar Hook
 *
 * Provides a simple API for showing snackbars throughout the app.
 */
import { useState } from 'react';

export interface SnackbarState {
    isOpen: boolean;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    type?: SnackbarProps['type'];
    duration?: number;
    icon?: React.ReactNode;
}

export interface UseSnackbarReturn {
    snackbarProps: SnackbarState & { onClose: () => void };
    showSnackbar: (options: Omit<SnackbarState, 'isOpen'>) => void;
    hideSnackbar: () => void;
}

export function useSnackbar(): UseSnackbarReturn {
    const [state, setState] = useState<SnackbarState>({
        isOpen: false,
        message: '',
    });

    const showSnackbar = useCallback((options: Omit<SnackbarState, 'isOpen'>) => {
        setState({
            isOpen: true,
            ...options,
        });
    }, []);

    const hideSnackbar = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return {
        snackbarProps: {
            ...state,
            onClose: hideSnackbar,
        },
        showSnackbar,
        hideSnackbar,
    };
}
