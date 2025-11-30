/**
 * Notes Modal Component
 *
 * Simple slide-up modal for displaying exercise notes.
 */

import React, { useEffect, useRef } from 'react';
import { X, Info } from 'lucide-react';

export interface NotesModalProps {
    /** Exercise name */
    exerciseName: string;
    /** Notes content */
    notes: string;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Whether modal is visible */
    isOpen: boolean;
}

/**
 * Notes Modal - Slide-up modal for exercise notes
 */
export const NotesModal: React.FC<NotesModalProps> = ({
    exerciseName,
    notes,
    onClose,
    isOpen,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle escape key and focus trap
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        // Focus the modal
        modalRef.current?.focus();

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="notes-modal-title"
                tabIndex={-1}
                className="relative w-full max-w-lg bg-sys-surface rounded-t-3xl p-4 pb-8 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle */}
                <div className="flex justify-center mb-3">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-sys-accent/20 flex items-center justify-center">
                            <Info size={16} className="text-sys-accent" />
                        </div>
                        <h2
                            id="notes-modal-title"
                            className="text-lg font-semibold text-white"
                        >
                            Notes
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-full bg-sys-surfaceHigh flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="Close"
                    >
                        <X size={18} className="text-sys-onSurfaceVar" />
                    </button>
                </div>

                {/* Exercise Name */}
                <p className="text-sm font-medium text-sys-accent mb-2">{exerciseName}</p>

                {/* Notes Content */}
                <div className="bg-sys-surfaceHigh rounded-xl p-4">
                    <p className="text-sm text-sys-onSurface leading-relaxed whitespace-pre-wrap">
                        {notes}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotesModal;
