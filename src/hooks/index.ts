import { useState, useEffect, useMemo } from 'react';

/**
 * Custom React Hooks
 *
 * Reusable hooks for haptic feedback, swipe gestures, debouncing, and icon management.
 */

// Default debounce delay
const DEBOUNCE_DELAY_MS = 300;

// ============================================================================
// HAPTIC FEEDBACK TYPES
// ============================================================================

/**
 * Vibration pattern - array of vibration/pause durations in milliseconds
 */
export type VibrationPattern = number[];

/**
 * Available haptic feedback methods
 */
export interface HapticFeedback {
    /** Light tap for checks - [10] */
    tick: () => void;
    /** Medium bump for buttons - [30] */
    bump: () => void;
    /** Double pulse for completion - [50, 50, 50] */
    success: () => void;
    /** Triple buzz for timer completion - [200, 100, 200] */
    timer: () => void;
    /** Set completion celebration - [10, 30, 10, 30, 50] */
    complete: () => void;
    /** PR or workout finish - [50, 100, 50, 100, 150] */
    milestone: () => void;
    /** Timer countdown tick - [15] */
    countdown: () => void;
    /** Error feedback - [100, 50, 100] */
    error: () => void;
    /** Light swipe feedback - [5] */
    swipe: () => void;
    /** 30 seconds remaining - double tap pattern */
    timer30: () => void;
    /** 10 seconds remaining - triple tap pattern */
    timer10: () => void;
    /** Timer complete - long + short-short-short pattern */
    timerComplete: () => void;
    /** EMOM interval warning - escalating pulse */
    emomWarning: () => void;
}

/**
 * Haptic feedback hook using the Vibration API
 * Provides different vibration patterns for UI interactions
 * Returns a stable reference to prevent unnecessary re-renders
 */
export const useHaptic = (): HapticFeedback => {
    return useMemo(() => {
        const trigger = (pattern: VibrationPattern = [10]): void => {
            if (navigator.vibrate) {
                navigator.vibrate(pattern);
            }
        };

        return {
            // Basic patterns
            tick: () => trigger([10]),
            bump: () => trigger([30]),
            success: () => trigger([50, 50, 50]),
            timer: () => trigger([200, 100, 200]),

            // Enhanced patterns (P2 - Point 11)
            complete: () => trigger([10, 30, 10, 30, 50]),
            milestone: () => trigger([50, 100, 50, 100, 150]),
            countdown: () => trigger([15]),
            error: () => trigger([100, 50, 100]),
            swipe: () => trigger([5]),

            // Timer-specific patterns (P2 - Point 7)
            timer30: () => trigger([40, 80, 40]), // Double-tap at 30s
            timer10: () => trigger([30, 60, 30, 60, 30]), // Triple-tap at 10s
            timerComplete: () => trigger([150, 100, 40, 40, 40, 40, 40]), // Long + short-short-short
            emomWarning: () => trigger([20, 40, 30, 40, 50, 40, 80]), // Escalating pulse
        };
    }, []);
};

// ============================================================================
// SWIPE GESTURE TYPES
// ============================================================================

/**
 * Options for swipe gesture detection
 */
export interface SwipeOptions {
    /** Callback for left swipe */
    onSwipeLeft?: () => void;
    /** Callback for right swipe */
    onSwipeRight?: () => void;
    /** Minimum swipe distance in pixels (default: 50) */
    threshold?: number;
}

/**
 * Touch event handlers returned by useSwipe
 */
export interface SwipeHandlers {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
}

/**
 * Swipe gesture detection hook
 * @param options - Swipe configuration options
 */
export const useSwipe = ({
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
}: SwipeOptions): SwipeHandlers => {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const onTouchStart = (e: React.TouchEvent): void => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent): void => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = (): void => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > threshold;
        const isRightSwipe = distance < -threshold;
        if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
        if (isRightSwipe && onSwipeRight) onSwipeRight();
    };

    return { onTouchStart, onTouchMove, onTouchEnd };
};

// ============================================================================
// DEBOUNCE HOOK
// ============================================================================

/**
 * Debounce hook for reducing excessive updates
 * @param value - Value to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = DEBOUNCE_DELAY_MS): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}


// Re-export accessibility hooks (only keyboard shortcuts are used via index)
export { useKeyboardShortcut } from './useAccessibility';

// Re-export theme hook
export { useTheme } from './useTheme';

// Re-export workout timer hook
export { useWorkoutTimer } from './useWorkoutTimer';

// Re-export rest timer (used via index)
export { useRestTimer } from './useRestTimer';

// Re-export emom timer (used via index)
export { useEmomTimer } from './useEmomTimer';
export type { UseEmomTimerOptions, UseEmomTimerReturn } from './useEmomTimer';

// Re-export density timer (used via index) (v2.5+)
export { useDensityTimer } from './useDensityTimer';
export type { UseDensityTimerOptions, UseDensityTimerReturn } from './useDensityTimer';

// Re-export exercise collapse hook (used via index)
export { useExerciseCollapse } from './useExerciseCollapse';

// Re-export scroll hooks
export { useScrollToElement, useScrollToTop } from './useScrollToElement';

// Re-export media query hook
export { useMediaQuery } from './useMediaQuery';

// Re-export action logger hook
export { useActionLogger } from './useActionLogger';
export type { UseActionLoggerOptions, UseActionLoggerReturn } from './useActionLogger';
