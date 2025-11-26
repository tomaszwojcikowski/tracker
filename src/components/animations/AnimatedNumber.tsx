/* global performance, requestAnimationFrame, cancelAnimationFrame */
import { useState, useEffect, useRef } from 'react';

export interface AnimatedNumberProps {
    /** The target value to animate to */
    value: number;
    /** Animation duration in ms (default: 500) */
    duration?: number;
    /** Additional CSS classes */
    className?: string;
    /** Optional function to format the displayed value */
    formatter?: (value: number) => string | number;
}

/**
 * AnimatedNumber Component
 * Animates a number from its previous value to the current value with easing
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
    value,
    duration = 500,
    className = '',
    formatter = (v) => v,
}) => {
    const [displayValue, setDisplayValue] = useState(value);
    const previousValueRef = useRef(value);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const start = previousValueRef.current;
        const diff = value - start;

        // Skip animation if no change
        if (diff === 0) return;

        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = start + diff * eased;

            // Use appropriate precision based on whether we're dealing with decimals
            const precision = Number.isInteger(value) ? 0 : 1;
            setDisplayValue(Number(currentValue.toFixed(precision)));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
                previousValueRef.current = value;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    return <span className={className}>{formatter(displayValue)}</span>;
};

export interface AnimatedCounterProps {
    /** The target value to count to */
    value: number;
    /** Animation duration in ms (default: 1000) */
    duration?: number;
    /** Additional CSS classes */
    className?: string;
    /** Optional function to format the displayed value */
    formatter?: (value: number) => string | number;
}

/**
 * AnimatedCounter Component
 * Counts up from 0 to the target value on mount
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    duration = 1000,
    className = '',
    formatter = (v) => v,
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = value * eased;

            const precision = Number.isInteger(value) ? 0 : 1;
            setDisplayValue(Number(currentValue.toFixed(precision)));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    return <span className={className}>{formatter(displayValue)}</span>;
};

export default AnimatedNumber;
