/**
 * ProgressIndicator Components
 *
 * Material Design 3 progress indicators for showing task progress.
 * Supports linear determinate/indeterminate and circular variants.
 */

import React from 'react';

/* ============================================================================
   LINEAR PROGRESS
   ============================================================================ */

export interface LinearProgressProps {
    /** Progress value (0-100) for determinate, undefined for indeterminate */
    value?: number;
    /** Progress variant: 'determinate' | 'indeterminate' */
    variant?: 'determinate' | 'indeterminate';
    /** Progress color variant */
    color?: 'primary' | 'success' | 'error' | 'warning';
    /** Custom CSS class */
    className?: string;
    /** Buffer value for indeterminate variant (0-100) */
    bufferValue?: number;
    /** Label text */
    label?: string;
}

/**
 * Linear Progress Indicator
 *
 * MD3 Specs:
 * - Height: 4dp
 * - Corner radius: 2dp (small)
 * - Track color: surface container high
 * - Indicator color: primary
 * - Animation: cubic-bezier(0.4, 0, 0.2, 1)
 */
export const LinearProgress: React.FC<LinearProgressProps> = ({
    value = 0,
    variant = 'determinate',
    color = 'primary',
    className = '',
    bufferValue = 100,
    label,
}) => {
    const containerClass = `linear-progress linear-progress-${variant} linear-progress-${color} ${className}`.trim();
    const valuePercentage = Math.min(Math.max(value, 0), 100);

    return (
        <div className={containerClass}>
            {label && <div className="linear-progress-label">{label}</div>}
            <div className="linear-progress-container">
                {variant === 'indeterminate' ? (
                    <>
                        <div className="linear-progress-track" />
                        <div className="linear-progress-indicator" />
                    </>
                ) : (
                    <>
                        <div className="linear-progress-track" />
                        {bufferValue < 100 && (
                            <div
                                className="linear-progress-buffer"
                                style={{ width: `${bufferValue}%` }}
                            />
                        )}
                        <div
                            className="linear-progress-indicator"
                            style={{ width: `${valuePercentage}%` }}
                        />
                    </>
                )}
            </div>
            {variant === 'determinate' && (
                <div className="linear-progress-value">{valuePercentage}%</div>
            )}
        </div>
    );
};

/* ============================================================================
   CIRCULAR PROGRESS
   ============================================================================ */

export interface CircularProgressProps {
    /** Progress value (0-100) for determinate */
    value?: number;
    /** Progress size in pixels */
    size?: number;
    /** Progress variant */
    variant?: 'determinate' | 'indeterminate';
    /** Progress color variant */
    color?: 'primary' | 'success' | 'error' | 'warning';
    /** Custom CSS class */
    className?: string;
}

/**
 * Circular Progress Indicator
 *
 * MD3 Specs:
 * - Track color: surface container high
 * - Indicator color: primary
 * - Stroke width: 4px
 * - Size: 48dp default
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
    value = 0,
    size = 48,
    variant = 'determinate',
    color = 'primary',
    className = '',
}) => {
    const radius = (size - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    const containerClass = `circular-progress circular-progress-${variant} circular-progress-${color} ${className}`.trim();

    return (
        <div className={containerClass} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="circular-progress-svg"
            >
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    className="circular-progress-track"
                />

                {/* Indicator */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    className="circular-progress-indicator"
                    style={
                        variant === 'determinate'
                            ? { strokeDashoffset }
                            : undefined
                    }
                />
            </svg>
        </div>
    );
};

export default LinearProgress;
