/**
 * Exercise Options Badge
 *
 * Small badge to indicate an exercise has multiple options to choose from
 */

import React from 'react';
import { Settings2 } from './icons';

export interface ExerciseOptionsBadgeProps {
    /** Number of available options */
    optionCount: number;
    /** Whether an option has been selected */
    hasSelection: boolean;
    /** The name of the selected option */
    selectedOptionName?: string;
    /** Click handler */
    onClick?: (e?: React.MouseEvent) => void;
}

/**
 * Badge to indicate exercise has options
 */
export const ExerciseOptionsBadge: React.FC<ExerciseOptionsBadgeProps> = ({
    optionCount,
    hasSelection,
    selectedOptionName,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            className={`
                inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
                transition-all duration-200
                ${
                    hasSelection
                        ? 'bg-sys-primaryContainer text-sys-onPrimaryContainer border border-sys-primary/30'
                        : 'bg-sys-tertiaryContainer text-sys-onTertiaryContainer border border-sys-tertiary/30 animate-pulse'
                }
                hover:scale-105 active:scale-95
            `}
            title={hasSelection ? `Chosen: ${selectedOptionName}. Tap to change.` : 'Select exercise option'}
        >
            <Settings2 size={12} />
            <span>
                {hasSelection && selectedOptionName ? (
                    <span className="max-w-[120px] truncate block">{selectedOptionName}</span>
                ) : (
                    `${optionCount} options`
                )}
            </span>
        </button>
    );
};
