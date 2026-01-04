/**
 * Ripple Effect Component
 *
 * Material Design 3 touch ripple animation.
 * Provides proper touch feedback with expanding circular ripple.
 */

import React, { useCallback } from 'react';

export interface RippleEffectProps {
    /** Whether ripple is enabled */
    enabled?: boolean;
    /** Ripple color variant: 'default' | 'primary' | 'secondary' | 'error' */
    variant?: 'default' | 'primary' | 'secondary' | 'error';
}

interface RipplePosition {
    x: number;
    y: number;
    id: string;
}

/**
 * useRipple Hook
 *
 * Provides ripple effect handling for interactive elements.
 * Call this from any interactive component that needs touch feedback.
 *
 * Usage:
 * ```tsx
 * const { ripples, createRipple } = useRipple();
 *
 * <div
 *   onClick={(e) => createRipple(e)}
 *   className="relative overflow-hidden"
 * >
 *   {ripples.map((ripple) => (
 *     <div
 *       key={ripple.id}
 *       className={`ripple-effect ripple-effect-${variant}`}
 *       style={{
 *         left: ripple.x,
 *         top: ripple.y,
 *       }}
 *     />
 *   ))}
 *   Content
 * </div>
 * ```
 */
export function useRipple() {
    const [ripples, setRipples] = React.useState<RipplePosition[]>([]);

    const createRipple = useCallback(
        (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
            let x: number;
            let y: number;

            if ('touches' in event) {
                x = event.touches[0].clientX - rect.left;
                y = event.touches[0].clientY - rect.top;
            } else {
                x = event.clientX - rect.left;
                y = event.clientY - rect.top;
            }

            const id = Math.random().toString(36).substr(2, 9);
            const ripple: RipplePosition = {
                x,
                y,
                id,
            };

            setRipples((prev) => [...prev, ripple]);

            // Remove ripple after animation completes (400ms)
            setTimeout(() => {
                setRipples((prev) => prev.filter((r) => r.id !== id));
            }, 400);
        },
        []
    );

    return { ripples, createRipple };
}

/**
 * Ripple Effect Component (for visual container)
 */
export const RippleEffect: React.FC<RippleEffectProps> = ({
    enabled = true,
    variant = 'default',
}) => {
    if (!enabled) return null;

    return (
        <div
            className={`ripple-effect ripple-effect-${variant}`}
            aria-hidden="true"
        />
    );
};

export default RippleEffect;
