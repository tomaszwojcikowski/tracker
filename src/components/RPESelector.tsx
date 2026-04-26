/**
 * RPE Selector Component
 *
 * Quick RPE (Rate of Perceived Exertion) input using button group.
 * Scale: 6-10 (standard Borg RPE scale for resistance training)
 * 6-7: Light, 8: Moderate, 9: Hard, 10: Maximum effort
 */

import React from 'react';
import { X } from './icons';
import type { RPEValue } from '../types';

export interface RPESelectorProps {
    /** Currently selected RPE value */
    value?: RPEValue;
    /** Callback when RPE is selected */
    onChange: (rpe: RPEValue) => void;
    /** Set number for labeling (1-based) */
    setNumber?: number;
    /** Whether the selector is disabled */
    disabled?: boolean;
    /** Compact mode for smaller display */
    compact?: boolean;
    /** Callback to skip/dismiss RPE selection */
    onSkip?: () => void;
    /** Show as a prompt with skip button */
    showAsPrompt?: boolean;
}

const RPE_OPTIONS: { value: RPEValue; label: string; color: string }[] = [
    { value: '6', label: '6', color: 'bg-sys-successContainer text-sys-onSuccessContainer border-sys-success/30' },
    { value: '7', label: '7', color: 'bg-sys-successContainer text-sys-onSuccessContainer border-sys-success/30' },
    { value: '8', label: '8', color: 'bg-sys-tertiaryContainer text-sys-onTertiaryContainer border-sys-tertiary/30' },
    { value: '9', label: '9', color: 'bg-sys-secondaryContainer text-sys-onSecondaryContainer border-sys-secondary/30' },
    { value: '10', label: '10', color: 'bg-sys-errorContainer text-sys-onErrorContainer border-sys-error/30' },
];

/**
 * RPE Selector - Button group for logging Rate of Perceived Exertion
 */
export const RPESelector: React.FC<RPESelectorProps> = ({
    value,
    onChange,
    setNumber,
    disabled = false,
    compact = false,
    onSkip,
    showAsPrompt = false,
}) => {
    if (showAsPrompt) {
        return (
            <div className="relative mb-3 p-3 pl-4 bg-gradient-to-br from-sys-tertiaryContainer/40 via-sys-surfaceContainerHigh to-sys-surfaceContainerHigh rounded-xl border border-sys-tertiary/30 shadow-elevation-1 animate-fade-in overflow-hidden">
                <span aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-1 bg-sys-tertiary rounded-r-full" />
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-sys-onTertiaryContainer uppercase tracking-wider font-semibold">
                        {setNumber !== undefined ? `Set ${setNumber} · How hard?` : 'Rate this set'}
                    </span>
                    {onSkip && (
                        <button
                            onClick={onSkip}
                            className="h-6 w-6 rounded-md bg-sys-surfaceContainerHighest text-sys-onSurfaceVar flex items-center justify-center hover:bg-sys-onSurfaceVariant/20 transition-colors"
                            aria-label="Skip RPE"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="flex gap-1.5">
                    {RPE_OPTIONS.map((option) => {
                        const isSelected = value === option.value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => !disabled && onChange(option.value)}
                                disabled={disabled}
                                className={`
                                    h-11 flex-1 min-w-[44px]
                                    rounded-lg font-bold text-sm transition-all
                                    flex items-center justify-center
                                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                                    ${isSelected
                                        ? `${option.color} border shadow-sm`
                                        : 'bg-sys-surfaceContainerLow text-sys-onSurfaceVar hover:bg-sys-onSurfaceVariant/10 border border-transparent'
                                    }
                                `}
                                aria-label={`RPE ${option.value}`}
                                aria-pressed={isSelected}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {setNumber !== undefined && (
                <span className="text-[10px] text-sys-onSurfaceVar uppercase tracking-wider font-semibold">
                    Set {setNumber} RPE
                </span>
            )}
            <div className="flex gap-1">
                {RPE_OPTIONS.map((option) => {
                    const isSelected = value === option.value;
                    return (
                        <button
                            key={option.value}
                            onClick={() => !disabled && onChange(option.value)}
                            disabled={disabled}
                            className={`
                                ${compact ? 'h-7 w-7 text-xs min-w-[28px]' : 'h-8 w-9 text-sm'}
                                rounded-lg font-bold transition-all
                                flex items-center justify-center
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}
                                ${isSelected
                                    ? `${option.color} border shadow-sm`
                                    : 'bg-sys-surfaceContainerHigh text-sys-onSurfaceVar hover:bg-sys-onSurface/10'
                                }
                            `}
                            aria-label={`RPE ${option.value}`}
                            aria-pressed={isSelected}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Inline RPE display for completed sets
 */
export interface RPEBadgeProps {
    value: RPEValue;
    compact?: boolean;
}

export const RPEBadge: React.FC<RPEBadgeProps> = ({ value, compact = false }) => {
    const option = RPE_OPTIONS.find((o) => o.value === value);
    if (!option) return null;

    return (
        <span
            className={`
                ${compact ? 'text-[10px] px-1 py-0.5' : 'text-xs px-1.5 py-0.5'}
                rounded font-bold ${option.color} border
            `}
        >
            RPE {value}
        </span>
    );
};
