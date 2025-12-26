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
import { Check, CheckCheck } from './icons';

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
                    // Each button is 44px + 4px gap = 48px
                    // When all complete, show only last button fully visible
                    marginLeft: isComplete
                        ? completedSets > 1 ? `-${(completedSets - 1) * 48}px` : 0
                        : completedSets > 1 ? `-${(completedSets - 1) * 48}px` : 0,
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
                                className={`h-11 w-11 min-w-[44px] rounded-xl flex items-center justify-center text-base font-bold transition-all active:scale-90 ${
                                    isDone
                                        ? isComplete
                                            ? 'bg-sys-success text-white shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                            : 'bg-sys-accent text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                                        : 'bg-sys-accent/20 text-sys-accent border-2 border-sys-accent/40'
                                }`}
                                aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                            >
                                {isDone ? <Check size={18} /> : i + 1}
                            </button>
                        );
                    }
                    return null;
                }).filter(Boolean)}
                {/* Future sets shown as dots (max 2 dots) */}
                {firstIncompleteIndex !== -1 && sets.slice(firstIncompleteIndex + 1, firstIncompleteIndex + 3).map((_, i) => (
                    <div
                        key={`${exId}-dot-${firstIncompleteIndex + 1 + i}`}
                        className="w-2 h-2 rounded-full bg-sys-onSurfaceVar opacity-30"
                        aria-label={`Set ${firstIncompleteIndex + 2 + i} pending`}
                    />
                ))}
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
                className={`text-sm font-bold ml-1 px-2 py-1 rounded transition-colors ${
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
                    className="h-11 w-11 min-w-[44px] rounded-xl bg-sys-success/20 text-sys-success flex items-center justify-center active:scale-90 transition-all ml-1"
                    aria-label="Complete all sets"
                >
                    <CheckCheck size={18} />
                </button>
            )}
        </div>
    );
};

// Memoize component to prevent unnecessary re-renders when parent updates
export const CompactSetButtons = memo(CompactSetButtonsInner);
