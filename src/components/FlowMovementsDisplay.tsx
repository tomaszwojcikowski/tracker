/**
 * Flow Movements Display Component
 *
 * Displays the sequence of movements for a selected flow exercise.
 * Compact inline view for the workout player.
 */

import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import type { ExerciseOption } from '../workout-plan-utils';

export interface FlowMovementsDisplayProps {
    /** The selected exercise option containing flow movements */
    selectedOption: ExerciseOption | undefined;
    /** All available options (to find the selected one if needed) */
    options: ExerciseOption[];
    /** Currently selected option name */
    selectedOptionName: string | undefined;
}

/**
 * Inline display of flow movements for a selected flow option
 */
export const FlowMovementsDisplay: React.FC<FlowMovementsDisplayProps> = ({
    selectedOption,
    options,
    selectedOptionName,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Find the option with flow movements
    const optionWithMovements = selectedOption?.flowMovements
        ? selectedOption
        : options.find(opt => opt.optionName === selectedOptionName && opt.flowMovements);

    const movements = optionWithMovements?.flowMovements;

    if (!movements || movements.length === 0) {
        return null;
    }

    const previewCount = 4;
    const previewMovements = movements.slice(0, previewCount);
    const hasMore = movements.length > previewCount;

    return (
        <div className="mt-2 p-2 rounded-lg bg-sys-surface/50 border border-white/5">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 w-full text-left"
            >
                <Activity size={14} className="text-sys-accent flex-shrink-0" />
                <span className="text-xs font-medium text-sys-accent">
                    {optionWithMovements?.optionName || 'Flow Sequence'}
                </span>
                <span className="text-xs text-sys-onSurfaceVar">
                    ({movements.length} movements)
                </span>
                {hasMore && (
                    <span className="ml-auto text-sys-onSurfaceVar">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                )}
            </button>

            {/* Movements */}
            <div className="mt-2 flex flex-wrap gap-1">
                {(isExpanded ? movements : previewMovements).map((movement, index) => (
                    <React.Fragment key={index}>
                        <span className="inline-flex items-center gap-1 text-xs text-sys-onSurfaceVar">
                            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-sys-accent/20 text-sys-accent text-[10px] font-bold">
                                {index + 1}
                            </span>
                            <span>{movement}</span>
                        </span>
                        {index < (isExpanded ? movements.length : previewMovements.length) - 1 && (
                            <span className="text-sys-onSurfaceVar/40 mx-0.5">→</span>
                        )}
                    </React.Fragment>
                ))}
                {!isExpanded && hasMore && (
                    <span className="text-xs text-sys-onSurfaceVar/60 italic">
                        +{movements.length - previewCount} more...
                    </span>
                )}
            </div>
        </div>
    );
};

/**
 * Compact badge version for showing flow is selected
 */
export const FlowBadge: React.FC<{
    movementCount: number;
    flowName: string;
    onClick?: () => void;
}> = ({ movementCount, flowName, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
                       bg-sys-accent/20 text-sys-accent border border-sys-accent/30
                       hover:bg-sys-accent/30 transition-all duration-200"
            title={`${flowName} - ${movementCount} movements`}
        >
            <Activity size={12} />
            <span className="max-w-[120px] truncate">{flowName}</span>
        </button>
    );
};
