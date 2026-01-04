/**
 * Flow Movements Display Component
 *
 * Displays the sequence of movements for a selected flow exercise.
 * Always shows all movements - no truncation.
 * Includes smooth animations when flow selection changes.
 */

import React, { useEffect, useState, useRef } from 'react';
import { Activity, Settings2 } from './icons';
import type { ExerciseOption } from '../workout-plan-utils';

export interface FlowMovementsDisplayProps {
    /** The selected exercise option containing flow movements */
    selectedOption: ExerciseOption | undefined;
    /** All available options (to find the selected one if needed) */
    options: ExerciseOption[];
    /** Currently selected option name */
    selectedOptionName: string | undefined;
    /** Callback when choose button is clicked */
    onChooseFlow?: () => void;
    /** Show the drag handle at top (for compact view) */
    showHandle?: boolean;
}

/**
 * Inline display of flow movements for a selected flow option
 * Always shows all movements with smooth animation on change
 */
export const FlowMovementsDisplay: React.FC<FlowMovementsDisplayProps> = ({
    selectedOption,
    options,
    selectedOptionName,
    onChooseFlow,
    showHandle = false,
}) => {
    // Count how many flow options exist (for showing "1 of N")
    const flowOptionsCount = options.filter(opt => opt.flowMovements && opt.flowMovements.length > 0).length;
    const currentFlowIndex = options.filter(opt => opt.flowMovements && opt.flowMovements.length > 0)
        .findIndex(opt => opt.optionName === selectedOptionName) + 1;
    const [isAnimating, setIsAnimating] = useState(false);
    const [displayedOption, setDisplayedOption] = useState(selectedOptionName);
    const prevOptionRef = useRef(selectedOptionName);

    // Find the option with flow movements
    const optionWithMovements = selectedOption?.flowMovements
        ? selectedOption
        : options.find(opt => opt.optionName === selectedOptionName && opt.flowMovements);

    const movements = optionWithMovements?.flowMovements;

    // Handle animation when option changes
    useEffect(() => {
        if (prevOptionRef.current !== selectedOptionName && selectedOptionName) {
            // Start exit animation
            setIsAnimating(true);

            // After exit animation, update displayed option and start enter animation
            const timer = setTimeout(() => {
                setDisplayedOption(selectedOptionName);
                // Small delay to ensure DOM updates before enter animation
                requestAnimationFrame(() => {
                    setIsAnimating(false);
                });
            }, 150);

            prevOptionRef.current = selectedOptionName;
            return () => clearTimeout(timer);
        }
    }, [selectedOptionName]);

    if (!movements || movements.length === 0) {
        return null;
    }

    return (
        <div
            className={`
                mt-2 p-3 rounded-lg bg-sys-surfaceContainerLow border border-sys-outlineVariant
                transition-all duration-300 ease-out
                ${isAnimating ? 'opacity-0 scale-95 -translate-y-1' : 'opacity-100 scale-100 translate-y-0'}
            `}
        >
            {/* Handle indicator at top for drag/tap affordance */}
            {showHandle && onChooseFlow && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onChooseFlow();
                    }}
                    className="w-full flex flex-col items-center mb-2 -mt-1 group"
                >
                    <div className="w-8 h-1 rounded-full bg-sys-onSurfaceVariant/20 group-hover:bg-sys-onSurfaceVariant/40 group-active:bg-sys-primary/60 transition-colors" />
                    <span className="text-[10px] text-sys-onSurfaceVar/60 mt-0.5">tap to change flow</span>
                </button>
            )}

            {/* Header with flow name and choose button */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Activity
                        size={14}
                        className={`text-sys-accent flex-shrink-0 transition-transform duration-300 ${isAnimating ? 'rotate-180' : 'rotate-0'}`}
                    />
                    <span className="text-xs font-medium text-sys-accent">
                        {optionWithMovements?.optionName || 'Flow Sequence'}
                    </span>
                    <span className="text-xs text-sys-onSurfaceVar">
                        ({movements.length} moves)
                    </span>
                    {flowOptionsCount > 1 && (
                        <span className="text-[10px] text-sys-onSurfaceVar/60 px-1.5 py-0.5 rounded bg-sys-surfaceContainerHigh">
                            {currentFlowIndex} of {flowOptionsCount}
                        </span>
                    )}
                </div>
                {onChooseFlow && !showHandle && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onChooseFlow();
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                                   bg-sys-accent/20 text-sys-accent border border-sys-accent/30
                                   hover:bg-sys-accent/30 active:scale-95 transition-all"
                    >
                        <Settings2 size={10} />
                        <span>Change</span>
                    </button>
                )}
            </div>

            {/* Full movements list with staggered animation */}
            <div className="space-y-1">
                {movements.map((movement, index) => (
                    <div
                        key={`${displayedOption}-${index}`}
                        className={`
                            flex items-center gap-2
                            transition-all duration-300 ease-out
                            ${isAnimating
                                ? 'opacity-0 translate-x-2'
                                : 'opacity-100 translate-x-0'
                            }
                        `}
                        style={{
                            transitionDelay: isAnimating ? '0ms' : `${index * 30}ms`
                        }}
                    >
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-sys-primaryContainer text-sys-onPrimaryContainer text-[10px] font-bold flex-shrink-0">
                            {index + 1}
                        </span>
                        <span className="text-xs text-sys-onSurfaceVar">{movement}</span>
                        {index < movements.length - 1 && (
                            <span className="text-sys-onSurfaceVar/40 text-xs">→</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Compact badge version for showing flow is selected - with choose button and animation
 */
export const FlowBadge: React.FC<{
    movementCount: number;
    flowName: string;
    onClick?: () => void;
}> = ({ movementCount, flowName, onClick }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const prevNameRef = useRef(flowName);

    // Animate when flow name changes
    useEffect(() => {
        if (prevNameRef.current !== flowName) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 300);
            prevNameRef.current = flowName;
            return () => clearTimeout(timer);
        }
    }, [flowName]);

    return (
        <button
            onClick={onClick}
            className={`
                inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
                bg-sys-primaryContainer text-sys-onPrimaryContainer border border-sys-primary/30
                hover:bg-sys-primaryContainer/80 transition-all duration-200
                ${isAnimating ? 'animate-pulse scale-105' : ''}
            `}
            title={`${flowName} - ${movementCount} movements. Tap to change.`}
        >
            <Activity size={12} className={isAnimating ? 'animate-spin' : ''} />
            <span
                className={`
                    max-w-[100px] truncate transition-all duration-300
                    ${isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}
                `}
            >
                {flowName}
            </span>
            <Settings2 size={10} className="opacity-60" />
        </button>
    );
};
