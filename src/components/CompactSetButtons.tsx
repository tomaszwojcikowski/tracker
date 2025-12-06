/**
 * CompactSetButtons Component
 *
 * Progressive reveal set buttons for compact exercise rows.
 * Shows: half of last completed button + next incomplete + dots for future sets.
 * When all complete, shows only the last completed button.
 *
 * Gesture: Double-tap progress indicator (X/Y) to complete all remaining sets.
 */

import React, { useMemo, memo } from 'react';
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

const CompactSetButtonsInner: React.FC<CompactSetButtonsProps> = ({
    exId,
    sets,
    completedSets,
    totalSets,
    isComplete,
    onToggleSet,
    onCompleteAllSets,
}) => {
    // Memoize computed values to avoid recalculating on every render
    const { showCompleteAllButton, firstIncompleteIndex } = useMemo(() => {
        const incompleteCount = totalSets - completedSets;
        const firstIncomplete = sets.findIndex(s => !s);
        return {
            showCompleteAllButton: incompleteCount >= 2,
            firstIncompleteIndex: firstIncomplete,
        };
    }, [sets, completedSets, totalSets]);

    return (
        <div className="flex items-center gap-1 flex-shrink-0 overflow-hidden">
            <div
                className="flex items-center gap-1"
                style={{
                    // Shift left to hide all but the last completed button
                    // Each button is 32px + 4px gap = 36px
                    // When all complete, show only last button fully visible
                    marginLeft: isComplete
                        ? completedSets > 1 ? `-${(completedSets - 1) * 36}px` : 0
                        : completedSets > 1 ? `-${(completedSets - 1) * 36}px` : 0,
                    transition: 'margin-left 150ms ease-out'
                }}
            >
                {sets.map((isDone, i) => {
                    // Use memoized firstIncompleteIndex
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
            {/* Progress indicator - double-tap to complete all */}
            <button
                onClick={() => {
                    // Double-tap detection inline for simplicity
                    const now = Date.now();
                    const lastTap = (window as unknown as { __setButtonLastTap?: number }).__setButtonLastTap || 0;
                    if (now - lastTap < 300 && now - lastTap > 0 && !isComplete) {
                        // Double tap - complete all
                        onCompleteAllSets();
                        (window as unknown as { __setButtonLastTap?: number }).__setButtonLastTap = 0;
                    } else {
                        (window as unknown as { __setButtonLastTap?: number }).__setButtonLastTap = now;
                    }
                }}
                className={`text-xs font-semibold ml-1 px-1.5 py-0.5 rounded transition-colors ${
                    isComplete
                        ? 'text-sys-success'
                        : 'text-sys-onSurfaceVar hover:text-white hover:bg-sys-surfaceHigh active:scale-95'
                }`}
                aria-label={`${completedSets} of ${totalSets} sets complete${!isComplete ? ', double-tap to complete all' : ''}`}
                title={!isComplete ? 'Double-tap to complete all' : undefined}
            >
                ({completedSets}/{totalSets})
            </button>
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

// Memoize component to prevent unnecessary re-renders when parent updates
export const CompactSetButtons = memo(CompactSetButtonsInner);

export default CompactSetButtons;
