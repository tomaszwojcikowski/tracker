/**
 * Notes Modal Component
 *
 * MD3 bottom sheet modal for displaying exercise notes.
 */

import React from 'react';
import { X, Info } from 'lucide-react';
import { BottomSheet } from '../BottomSheet';

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
 * Notes Modal - Bottom sheet for exercise notes
 */
export const NotesModal: React.FC<NotesModalProps> = ({
    exerciseName,
    notes,
    onClose,
    isOpen,
}) => {
    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            ariaLabelledBy="notes-modal-title"
            maxHeight={60}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
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
                    className="btn-icon bg-sys-surfaceHigh"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-8">
                {/* Exercise Name */}
                <p className="text-sm font-medium text-sys-accent mb-2">{exerciseName}</p>

                {/* Notes Content */}
                <div className="bg-sys-surfaceHigh rounded-xl p-4">
                    <p className="text-sm text-sys-onSurface leading-relaxed whitespace-pre-wrap">
                        {notes}
                    </p>
                </div>
            </div>
        </BottomSheet>
    );
};

export default NotesModal;
