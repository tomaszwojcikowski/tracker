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
import { Check } from './icons';

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
}) => {
    // Memoize computed values to avoid recalculating on every render
    const firstIncompleteIndex = useMemo(() => {
        return sets.findIndex(s => !s);
    }, [sets]);

    return (
        <div className="flex items-center gap-1 flex-shrink-0 overflow-hidden">
            <div
                className="flex items-center gap-1"
                style={{
                    // Shift left to hide all but the last completed button
                    // Each button is 48px + 4px gap = 52px
                    // When all complete, show only last button fully visible
                    marginLeft: isComplete
                        ? completedSets > 1 ? `-${(completedSets - 1) * 52}px` : 0
                        : completedSets > 1 ? `-${(completedSets - 1) * 52}px` : 0,
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
                                className={`h-12 w-12 min-w-[48px] rounded-xl flex items-center justify-center text-base font-bold transition-all active:scale-90 ${
                                    isDone
                                        ? isComplete
                                            ? 'bg-sys-success text-sys-onSuccess shadow-elevation-1'
                                            : 'bg-sys-primary text-sys-onPrimary shadow-elevation-1'
                                        : 'bg-sys-surfaceContainerHigh text-sys-onSurfaceVariant border-2 border-sys-outlineVariant'
                                }`}
                                aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                            >
                                {isDone ? (
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="animate-checkmark"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    i + 1
                                )}
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
            {/* Progress indicator */}
            <div
                className={`text-sm font-bold ml-1 px-2 py-1 rounded transition-colors ${
                    isComplete
                        ? 'text-sys-success'
                        : 'text-sys-onSurfaceVar'
                }`}
                aria-label={`${completedSets} of ${totalSets} sets complete`}
            >
                ({completedSets}/{totalSets})
            </div>
        </div>
    );
};

// Memoize component to prevent unnecessary re-renders when parent updates
export const CompactSetButtons = memo(CompactSetButtonsInner);
