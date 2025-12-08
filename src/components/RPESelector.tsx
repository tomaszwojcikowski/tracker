/**
 * RPE Selector Component
 *
 * Quick RPE (Rate of Perceived Exertion) input using button group.
 * Scale: 6-10 (standard Borg RPE scale for resistance training)
 * 6-7: Light, 8: Moderate, 9: Hard, 10: Maximum effort
 */

import React from 'react';
import { X } from 'lucide-react';
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
    { value: '6', label: '6', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { value: '7', label: '7', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { value: '8', label: '8', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { value: '9', label: '9', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { value: '10', label: '10', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
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
            <div className="mb-3 p-3 bg-sys-surfaceHigh rounded-xl border border-white/10 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-sys-onSurfaceVar uppercase tracking-wider font-semibold">
                        {setNumber !== undefined ? `Set ${setNumber} RPE` : 'Rate this set'}
                    </span>
                    {onSkip && (
                        <button
                            onClick={onSkip}
                            className="h-6 w-6 rounded-md bg-white/5 text-sys-onSurfaceVar flex items-center justify-center hover:bg-white/10 transition-colors"
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
                                        : 'bg-sys-surface text-sys-onSurfaceVar hover:bg-white/10 border border-transparent'
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
                                ${compact ? 'h-7 w-7 text-xs' : 'h-8 w-9 text-sm'}
                                rounded-lg font-bold transition-all
                                flex items-center justify-center
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}
                                ${isSelected
                                    ? `${option.color} border shadow-sm`
                                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar hover:bg-white/10'
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
