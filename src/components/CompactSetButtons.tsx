/**
 * CompactSetButtons Component
 *
 * Progressive reveal set buttons for compact exercise rows.
 * Shows: half of last completed button + next incomplete + dots for future sets.
 * When all complete, shows only the last completed button.
 */

import React, { useRef } from 'react';
import { Check, CheckCheck } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface CompactSetButtonsProps {
    /** Unique exercise ID for keys */
    exId: string;
    /** Array of set completion states */
    sets: boolean[];
    /** Number of completed sets */
    completedSets: number;
    /** Total number of sets */
    totalSets: number;
    /** Whether all sets are complete */
    isComplete: boolean;
    /** Callback when a set is toggled */
    onToggleSet: (setIndex: number) => void;
    /** Callback to complete all remaining sets */
    onCompleteAllSets: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CompactSetButtons: React.FC<CompactSetButtonsProps> = ({
    exId,
    sets,
    completedSets,
    totalSets,
    isComplete,
    onToggleSet,
    onCompleteAllSets,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Only show complete-all button when there are 2+ incomplete sets remaining
    const incompleteSetsCount = sets.filter(s => !s).length;
    const showCompleteAllButton = incompleteSetsCount >= 2;

    return (
        <div className="flex items-center gap-1 flex-shrink-0 overflow-hidden">
            <div
                ref={containerRef}
                className="flex items-center gap-1"
                style={{
                    // Shift left to show only half of the previous completed button
                    // Each button is 32px + 4px gap = 36px. Show half of last completed = shift by full buttons except 16px
                    // When all complete, show only last button fully visible
                    marginLeft: isComplete
                        ? completedSets > 1 ? `-${(completedSets - 1) * 36}px` : 0
                        : completedSets > 0 ? `-${completedSets * 36 - 16}px` : 0,
                    transition: 'margin-left 150ms ease-out'
                }}
            >
                {sets.map((isDone, i) => {
                    // Find first incomplete set
                    const firstIncompleteIndex = sets.findIndex(s => !s);
                    const isNextIncomplete = i === firstIncompleteIndex;

                    // Show all completed sets and next incomplete as buttons
                    const shouldShowAsButton = isDone || isNextIncomplete;

                    if (shouldShowAsButton) {
                        return (
                            <button
                                key={`${exId}-set-${i}`}
                                onClick={() => onToggleSet(i)}
                                className={`h-8 w-8 min-w-[32px] rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-90 ${
                                    isDone
                                        ? isComplete
                                            ? 'bg-sys-success text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                            : 'bg-sys-accent text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                                        : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                }`}
                                aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                            >
                                {isDone ? <Check size={14} /> : i + 1}
                            </button>
                        );
                    } else {
                        // Future sets shown as dots
                        return (
                            <div
                                key={`${exId}-dot-${i}`}
                                className="w-2 h-2 rounded-full bg-sys-onSurfaceVar opacity-30"
                                aria-label={`Set ${i + 1} pending`}
                            />
                        );
                    }
                })}
            </div>
            {/* Progress indicator */}
            <span className="text-xs text-sys-onSurfaceVar font-semibold ml-1">
                ({completedSets}/{totalSets})
            </span>
            {/* Complete All Sets Button - only show when there are 2+ incomplete sets remaining */}
            {showCompleteAllButton && (
                <button
                    onClick={onCompleteAllSets}
                    className="h-8 w-8 rounded-lg bg-sys-success/20 text-sys-success flex items-center justify-center active:scale-90 transition-all ml-1"
                    aria-label="Complete all sets"
                >
                    <CheckCheck size={14} />
                </button>
            )}
        </div>
    );
};

export default CompactSetButtons;
