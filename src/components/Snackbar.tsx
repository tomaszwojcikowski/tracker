/**
 * Snackbar Component
 *
 * Material Design 3 snackbar for displaying brief messages.
 * Features:
 * - Single-line or two-line messages
 * - Optional action button
 * - Auto-dismiss with configurable duration
 * - Swipe-to-dismiss gesture
 * - Elevation and surface tint
 */

import React, { useCallback, useRef, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useSnackbar, type SnackbarVariant } from '../hooks/useSnackbar';

// ============================================================================
// VARIANT STYLES
// ============================================================================

const variantStyles: Record<SnackbarVariant, { bg: string; icon: React.ReactNode }> = {
    default: {
        bg: 'bg-sys-surfaceHigh',
        icon: null,
    },
    success: {
        bg: 'bg-sys-success/20',
        icon: <CheckCircle size={20} className="text-sys-success flex-shrink-0" />,
    },
    error: {
        bg: 'bg-error-500/20',
        icon: <AlertCircle size={20} className="text-error-400 flex-shrink-0" />,
    },
    warning: {
        bg: 'bg-warning-500/20',
        icon: <AlertTriangle size={20} className="text-warning-400 flex-shrink-0" />,
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Snackbar - MD3 Snackbar notification
 *
 * Place this component once at the root of your app.
 * Use the useSnackbar hook to show/dismiss snackbars.
 */
export const Snackbar: React.FC = () => {
    const { current, dismiss } = useSnackbar();
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef<number | null>(null);

    // Swipe-to-dismiss handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        dragStartX.current = e.touches[0].clientX;
        setIsDragging(true);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (dragStartX.current === null) return;
        const diff = e.touches[0].clientX - dragStartX.current;
        setDragOffset(diff);
    }, []);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
        // If swiped more than 100px, dismiss
        if (Math.abs(dragOffset) > 100 && current) {
            dismiss(current.id);
        }
        setDragOffset(0);
        dragStartX.current = null;
    }, [dragOffset, current, dismiss]);

    if (!current) return null;

    const variant = current.variant || 'default';
    const styles = variantStyles[variant];

    return (
        <div
            className="fixed bottom-24 left-4 right-4 z-[200] flex justify-center pointer-events-none"
            role="status"
            aria-live="polite"
            aria-atomic="true"
        >
            <div
                className={`
                    pointer-events-auto
                    max-w-md w-full
                    ${styles.bg}
                    rounded-lg
                    px-4 py-3
                    flex items-center gap-3
                    surface-elevation-3
                    animate-slide-up
                    touch-pan-y
                `}
                style={{
                    transform: dragOffset !== 0 ? `translateX(${dragOffset}px)` : undefined,
                    opacity: isDragging ? 1 - Math.abs(dragOffset) / 200 : 1,
                    transition: isDragging ? 'none' : 'transform 0.2s ease, opacity 0.2s ease',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Icon */}
                {styles.icon}

                {/* Message */}
                <span className="flex-1 text-sm text-white font-medium">
                    {current.message}
                </span>

                {/* Action Button */}
                {current.action && (
                    <button
                        onClick={() => {
                            current.action?.onClick();
                            dismiss(current.id);
                        }}
                        className="btn-text text-sys-accent font-semibold text-sm px-2 py-1 -mr-2"
                    >
                        {current.action.label}
                    </button>
                )}

                {/* Close Button (shown if no action) */}
                {!current.action && (
                    <button
                        onClick={() => dismiss(current.id)}
                        className="btn-icon w-8 h-8 -mr-1"
                        aria-label="Dismiss"
                    >
                        <X size={18} className="text-sys-onSurfaceVar" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Snackbar;
