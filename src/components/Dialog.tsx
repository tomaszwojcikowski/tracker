/**
 * Dialog Component
 *
 * Material Design 3 dialog implementation with:
 * - Proper scrim (32% black)
 * - Surface container high background
 * - 28dp corner radius
 * - Elevation level 3
 * - Proper action button layout (right-aligned, text buttons)
 * - Focus trap and keyboard accessibility
 */

import React, { useEffect, useRef, useCallback } from 'react';

export interface DialogAction {
    label: string;
    onClick: () => void;
    variant?: 'text' | 'filled' | 'tonal';
    disabled?: boolean;
}

export interface DialogProps {
    /** Whether the dialog is visible */
    isOpen: boolean;
    /** Callback when the dialog should close */
    onClose: () => void;
    /** Dialog title (optional, but recommended) */
    title?: string;
    /** Dialog content */
    children: React.ReactNode;
    /** Action buttons (displayed right-aligned) */
    actions?: DialogAction[];
    /** Icon to display above title (optional) */
    icon?: React.ReactNode;
    /** Whether clicking outside closes the dialog */
    dismissOnClickOutside?: boolean;
    /** Maximum width class (default: max-w-md) */
    maxWidth?: string;
    /** Additional class name */
    className?: string;
}

/**
 * MD3 Dialog Component
 *
 * Specs:
 * - Min width: 280dp
 * - Max width: 560dp
 * - Container: Surface container high
 * - Scrim: 32% black
 * - Elevation: Level 3
 * - Corner radius: 28dp
 * - Padding: 24dp
 * - Title: Headline small
 * - Body: Body medium
 * - Actions: Right-aligned, 8dp gap
 */
export const Dialog: React.FC<DialogProps> = ({
    isOpen,
    onClose,
    title,
    children,
    actions = [],
    icon,
    dismissOnClickOutside = true,
    maxWidth = 'max-w-md',
    className = '',
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Handle escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Focus dialog on open
    useEffect(() => {
        if (isOpen && dialogRef.current) {
            dialogRef.current.focus();
        }
    }, [isOpen]);

    const handleScrimClick = useCallback(() => {
        if (dismissOnClickOutside) {
            onClose();
        }
    }, [dismissOnClickOutside, onClose]);

    if (!isOpen) return null;

    const getActionButtonClass = (variant: DialogAction['variant'] = 'text') => {
        const base = 'px-4 py-2.5 rounded-sm text-sm font-bold transition-all active:scale-[0.99]';

        switch (variant) {
            case 'filled':
                return `${base} bg-sys-onSurface text-sys-surface`;
            case 'tonal':
                return `${base} bg-sys-primaryContainer text-sys-onPrimaryContainer hover:bg-sys-primaryContainer/80`;
            case 'text':
            default:
                return `${base} text-sys-primary hover:bg-sys-primary/10`;
        }
    };

    return (
        <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-6"
            onClick={handleScrimClick}
        >
            {/* Scrim - MD3 uses 32% black */}
            <div
                className="absolute inset-0 bg-sys-scrim/32 animate-fade-in"
                aria-hidden="true"
            />

            {/* Dialog Container */}
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'dialog-title' : undefined}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                className={`
                    relative w-full ${maxWidth}
                    min-w-[280px]
                    modal-dialog
                    rounded-md
                    border border-sys-outlineVariant
                    animate-scale-up
                    ${className}
                `}
            >
                {/* Content area */}
                <div className="p-6">
                    {/* Optional Icon */}
                    {icon && (
                        <div className="flex justify-center mb-4 text-sys-primary">
                            {icon}
                        </div>
                    )}

                    {/* Title */}
                    {title && (
                        <h2
                            id="dialog-title"
                            className="text-xl font-bold text-sys-onSurface mb-4 text-center"
                        >
                            {title}
                        </h2>
                    )}

                    {/* Body content */}
                    <div className="text-sm text-sys-onSurfaceVar leading-relaxed">
                        {children}
                    </div>
                </div>

                {/* Actions */}
                {actions.length > 0 && (
                    <div className="flex justify-end gap-2 px-6 pb-6">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                disabled={action.disabled}
                                className={`${getActionButtonClass(action.variant)} ${
                                    action.disabled ? 'opacity-40 cursor-not-allowed' : ''
                                }`}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * ConfirmDialog - Specialized dialog for confirmations
 */
export interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'text' | 'filled' | 'tonal';
    /** Use destructive (error) styling for the confirm button */
    destructive?: boolean;
    /** Use success styling for the confirm button */
    success?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
    success = false,
}) => {
    // For destructive/success actions, use appropriate color on confirm button
    const getConfirmButtonClass = () => {
        if (destructive) {
            return 'px-4 py-2.5 rounded-sm text-sm font-bold transition-all active:scale-[0.99] text-sys-error hover:bg-sys-error/10';
        }
        if (success) {
            return 'px-4 py-2.5 rounded-sm text-sm font-bold transition-all active:scale-[0.99] bg-sys-onSurface text-sys-surface hover:opacity-90';
        }
        return undefined; // Use default variant styling
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            dismissOnClickOutside={false}
        >
            <p>{message}</p>
            <div className="flex justify-end gap-2 mt-6 -mb-2 -mx-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-sm text-sm font-bold transition-all active:scale-[0.99] text-sys-onSurface hover:bg-sys-onSurface/10"
                >
                    {cancelLabel}
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={getConfirmButtonClass() || 'px-4 py-2.5 rounded-sm text-sm font-bold transition-all active:scale-[0.99] text-sys-onSurface hover:bg-sys-onSurface/10'}
                    data-testid="confirm-button"
                >
                    {confirmLabel}
                </button>
            </div>
        </Dialog>
    );
};
