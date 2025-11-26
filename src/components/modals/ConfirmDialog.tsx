import React from 'react';
import { useHaptic } from '../../hooks';

export type ConfirmDialogVariant = 'success' | 'danger' | 'warning';

export interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmDialogVariant;
}

/**
 * ConfirmDialog - Modal confirmation dialog component
 *
 * A reusable confirmation dialog with customizable title, message, and actions.
 * Includes haptic feedback and accessibility support.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'success'
}) => {
    const haptic = useHaptic();

    if (!isOpen) return null;

    const variantClasses: Record<ConfirmDialogVariant, string> = {
        success: 'btn-gradient-success',
        danger: 'bg-sys-error hover:bg-sys-error/90',
        warning: 'bg-sys-warning hover:bg-sys-warning/90 text-black',
    };

    const handleClose = () => {
        haptic.tick();
        onClose();
    };

    const handleConfirm = () => {
        haptic.success();
        onClose();
        onConfirm();
    };

    // Handle escape key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-slide-up safe-pb"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            onKeyDown={handleKeyDown}
        >
            <div
                className="bg-sys-surface rounded-3xl p-6 w-full max-w-md border border-white/10"
                role="document"
            >
                <h3
                    id="confirm-dialog-title"
                    className="text-xl font-bold text-white mb-2"
                >
                    {title}
                </h3>
                <p
                    id="confirm-dialog-description"
                    className="text-sys-onSurfaceVar mb-6"
                >
                    {message}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 h-14 rounded-xl bg-sys-surfaceHigh text-white font-semibold active:scale-95 transition-transform hover-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-sys-accent"
                        aria-label={cancelLabel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 h-14 rounded-xl text-white font-semibold active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${variantClasses[variant]}`}
                        autoFocus
                        aria-label={confirmLabel}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
