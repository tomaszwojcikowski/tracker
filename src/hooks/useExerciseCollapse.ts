/**
 * useExerciseCollapse Hook
 *
 * Manages exercise collapse/expand state with manual overrides.
 * Auto-expands the first incomplete exercise while allowing manual overrides.
 * Extracted from WorkoutPlayer for reuse across workout views.
 */

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface UseExerciseCollapseOptions {
    /** ID of the first incomplete exercise (auto-expanded) */
    firstIncompleteExerciseId: string | null;
}

export interface UseExerciseCollapseReturn {
    /** Manual collapse overrides (true = user wants expanded, false = collapsed) */
    manualOverrides: Record<string, boolean>;
    /** Check if an exercise is collapsed */
    isCollapsed: (exId: string) => boolean;
    /** Toggle collapse state for an exercise */
    toggle: (exId: string) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useExerciseCollapse({
    firstIncompleteExerciseId,
}: UseExerciseCollapseOptions): UseExerciseCollapseReturn {
    // Track manual user overrides for exercise collapse state
    const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});

    const isCollapsed = useCallback((exId: string): boolean => {
        // Check if user has manually overridden the collapse state
        const manualOverride = manualOverrides[exId];
        if (manualOverride !== undefined) {
            // User override: true = user wants expanded, false = user wants collapsed
            return !manualOverride;
        }

        // Auto behavior: only the first incomplete exercise is expanded
        return exId !== firstIncompleteExerciseId;
    }, [manualOverrides, firstIncompleteExerciseId]);

    const toggle = useCallback((exId: string): void => {
        setManualOverrides((prev) => {
            const currentOverride = prev[exId];
            // Toggle between: no override -> expanded -> collapsed -> no override
            if (currentOverride === undefined) {
                // First click: set explicit opposite of auto behavior
                return { ...prev, [exId]: true };
            }
            // Toggle existing override
            return { ...prev, [exId]: !currentOverride };
        });
    }, []);

    return {
        manualOverrides,
        isCollapsed,
        toggle,
    };
}
