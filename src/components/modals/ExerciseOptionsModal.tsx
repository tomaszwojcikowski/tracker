/**
 * Exercise Options Modal
 *
 * Modal for selecting exercise options/variations with different parameters
 */

import React from 'react';
import { Check, Info } from 'lucide-react';
import { BottomSheet } from '../BottomSheet';
import type { ExerciseOption } from '../../workout-plan-utils';
import { getExerciseOptionSummary } from '../../utils/exerciseOptions';

export interface ExerciseOptionsModalProps {
    /** Whether modal is visible */
    isOpen: boolean;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Base exercise name */
    exerciseName: string;
    /** Available exercise options */
    options: ExerciseOption[];
    /** Currently selected option name */
    selectedOption?: string;
    /** Callback when option is selected */
    onSelectOption: (optionName: string) => void;
}

/**
 * Modal for selecting exercise options
 */
export const ExerciseOptionsModal: React.FC<ExerciseOptionsModalProps> = ({
    isOpen,
    onClose,
    exerciseName,
    options,
    selectedOption,
    onSelectOption,
}) => {
    const handleSelectOption = (optionName: string): void => {
        onSelectOption(optionName);
        onClose();
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel="Choose Exercise Variation"
            maxHeight={80}
        >
            <div className="flex flex-col gap-4 pb-4">
                {/* Header with exercise name */}
                <div className="px-4">
                    <h3 className="text-lg font-bold text-white">{exerciseName}</h3>
                    <p className="text-sm text-sys-onSurfaceVar mt-1">
                        Select the variation that matches your equipment and goals
                    </p>
                </div>

                {/* Options list */}
                <div className="flex flex-col gap-2">
                    {options.map((option) => {
                        const isSelected = option.optionName === selectedOption;
                        const summary = getExerciseOptionSummary(option);

                        return (
                            <button
                                key={option.optionName}
                                onClick={() => handleSelectOption(option.optionName)}
                                className={`
                                    relative flex flex-col gap-2 p-4 mx-4
                                    rounded-xl transition-all duration-200
                                    ${
                                        isSelected
                                            ? 'bg-sys-accent/20 border-2 border-sys-accent'
                                            : 'bg-sys-surfaceHigh border-2 border-transparent hover:border-sys-accent/50'
                                    }
                                `}
                            >
                                {/* Header with option name and checkmark */}
                                <div className="flex items-center justify-between">
                                    <h4
                                        className={`text-base font-bold ${
                                            isSelected ? 'text-sys-accent' : 'text-white'
                                        }`}
                                    >
                                        {option.optionName}
                                    </h4>
                                    {isSelected && (
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-sys-accent">
                                            <Check size={16} className="text-black" />
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                {option.description && (
                                    <div className="flex items-start gap-2 text-left">
                                        <Info size={14} className="text-sys-onSurfaceVar mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-sys-onSurfaceVar">
                                            {option.description}
                                        </p>
                                    </div>
                                )}

                                {/* Summary */}
                                {summary && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-sys-onSurfaceVar font-mono">
                                            {summary}
                                        </span>
                                    </div>
                                )}

                                {/* Equipment tags */}
                                {option.equipment && option.equipment.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {option.equipment.map((equip) => (
                                            <span
                                                key={equip}
                                                className="px-2 py-0.5 text-xs rounded-md bg-sys-surface text-sys-onSurfaceVar border border-white/10"
                                            >
                                                {equip}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Variation name if different from option name */}
                                {option.variation && option.variation !== option.optionName && (
                                    <p className="text-xs text-sys-onSurfaceVar italic">
                                        → {option.variation}
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Cancel button */}
                <div className="px-4 pt-2">
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 rounded-xl bg-sys-surfaceHigh text-white font-medium hover:bg-sys-surface transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
};
