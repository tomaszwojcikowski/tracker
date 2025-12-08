/**
 * Exercise Options Modal
 *
 * Modal for selecting exercise options/variations with different parameters.
 * Supports flow exercises with sequences of movements (v2.4+).
 */

import React, { useState } from 'react';
import { Check, Info, ChevronDown, ChevronUp, Activity } from 'lucide-react';
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
    /** Whether this is a flow exercise */
    isFlow?: boolean;
}

/**
 * Component to display flow movements sequence
 */
const FlowMovementsDisplay: React.FC<{
    movements: string[];
    isExpanded: boolean;
    onToggle: () => void;
}> = ({ movements, isExpanded, onToggle }) => {
    // Show first 3 movements in collapsed state
    const previewMovements = movements.slice(0, 3);
    const hasMore = movements.length > 3;

    return (
        <div className="mt-2">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className="flex items-center gap-1.5 text-xs text-sys-accent hover:text-sys-accent/80 transition-colors"
            >
                <Activity size={12} />
                <span>{movements.length} movements</span>
                {hasMore && (
                    isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                )}
            </button>

            {/* Movements list */}
            <div className="mt-2 text-left">
                {(isExpanded ? movements : previewMovements).map((movement, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-2 py-1"
                    >
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-sys-accent/20 text-sys-accent text-[10px] font-bold">
                            {index + 1}
                        </span>
                        <span className="text-xs text-sys-onSurfaceVar leading-5">
                            {movement}
                        </span>
                    </div>
                ))}
                {!isExpanded && hasMore && (
                    <div className="flex items-center gap-2 py-1 text-xs text-sys-onSurfaceVar/60 italic">
                        <span className="w-5" />
                        +{movements.length - 3} more...
                    </div>
                )}
            </div>
        </div>
    );
};

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
    isFlow = false,
}) => {
    const [expandedOption, setExpandedOption] = useState<string | null>(null);

    const handleSelectOption = (optionName: string): void => {
        onSelectOption(optionName);
        onClose();
    };

    const toggleExpanded = (optionName: string): void => {
        setExpandedOption(prev => prev === optionName ? null : optionName);
    };

    // Check if any option has flow movements
    const hasFlowOptions = options.some(opt => opt.flowMovements && opt.flowMovements.length > 0);

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel={isFlow || hasFlowOptions ? "Choose Flow" : "Choose Exercise Variation"}
            maxHeight={85}
        >
            <div className="flex flex-col gap-4 pb-4">
                {/* Header with exercise name */}
                <div className="px-4">
                    <h3 className="text-lg font-bold text-white">{exerciseName}</h3>
                    <p className="text-sm text-sys-onSurfaceVar mt-1">
                        {isFlow || hasFlowOptions
                            ? "Choose a flow that matches your goals and how your body feels today"
                            : "Select the variation that matches your equipment and goals"
                        }
                    </p>
                </div>

                {/* Options list */}
                <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                    {options.map((option) => {
                        const isSelected = option.optionName === selectedOption;
                        const summary = getExerciseOptionSummary(option);
                        const hasFlowMovements = option.flowMovements && option.flowMovements.length > 0;
                        const isExpanded = expandedOption === option.optionName;

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
                                        className={`text-base font-bold text-left ${
                                            isSelected ? 'text-sys-accent' : 'text-white'
                                        }`}
                                    >
                                        {option.optionName}
                                    </h4>
                                    {isSelected && (
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-sys-accent flex-shrink-0">
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

                                {/* Flow movements display */}
                                {hasFlowMovements && (
                                    <FlowMovementsDisplay
                                        movements={option.flowMovements!}
                                        isExpanded={isExpanded}
                                        onToggle={() => toggleExpanded(option.optionName)}
                                    />
                                )}

                                {/* Summary (for non-flow options) */}
                                {summary && !hasFlowMovements && (
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
                                    <p className="text-xs text-sys-onSurfaceVar italic text-left">
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
