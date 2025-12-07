/**
 * Exercise Options Badge
 *
 * Small badge to indicate an exercise has multiple options to choose from
 */

import React from 'react';
import { Settings2 } from 'lucide-react';

export interface ExerciseOptionsBadgeProps {
    /** Number of available options */
    optionCount: number;
    /** Whether an option has been selected */
    hasSelection: boolean;
    /** Click handler */
    onClick?: () => void;
}

/**
 * Badge to indicate exercise has options
 */
export const ExerciseOptionsBadge: React.FC<ExerciseOptionsBadgeProps> = ({
    optionCount,
    hasSelection,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                transition-all duration-200
                ${
                    hasSelection
                        ? 'bg-sys-accent/20 text-sys-accent border border-sys-accent/30'
                        : 'bg-amber-500/20 text-amber-200 border border-amber-500/30 animate-pulse'
                }
                hover:scale-105 active:scale-95
            `}
            title={hasSelection ? 'Change exercise option' : 'Select exercise option'}
        >
            <Settings2 size={12} />
            <span>{optionCount} options</span>
        </button>
    );
};
