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

// ============================================================================
// DOUBLE TAP HOOK
// ============================================================================

/**
 * Options for double tap detection
 */
export interface DoubleTapOptions {
    /** Callback for single tap */
    onSingleTap?: () => void;
    /** Callback for double tap */
    onDoubleTap?: () => void;
    /** Maximum delay between taps in ms (default: 300) */
    delay?: number;
}

/**
 * Return type for useDoubleTap hook
 */
export interface DoubleTapHandlers {
    onClick: () => void;
}

/**
 * Hook for detecting double tap gestures
 * Useful for quick actions like "complete all sets"
 */
export const useDoubleTap = ({
    onSingleTap,
    onDoubleTap,
    delay = 300,
}: DoubleTapOptions): DoubleTapHandlers => {
    const lastTapRef = { current: 0 };
    const timeoutRef = { current: null as ReturnType<typeof setTimeout> | null };

    const onClick = (): void => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;

        if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
            // Double tap detected
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            lastTapRef.current = 0;
            onDoubleTap?.();
        } else {
            // First tap - wait for potential second tap
            lastTapRef.current = now;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                onSingleTap?.();
                lastTapRef.current = 0;
                timeoutRef.current = null;
            }, delay);
        }
    };

    return { onClick };
};


// Re-export optimistic sync hook and types
export { useOptimisticSync, SyncStatus } from './useOptimisticSync';

// Re-export accessibility hooks
export {
    useFocusTrap,
    useAriaAnnounce,
    useReducedMotion,
    useKeyboardShortcut,
} from './useAccessibility';

// Re-export PWA hook
export { usePWA } from './usePWA';

// Re-export long-press hook
export { useLongPress } from './useLongPress';

// Re-export pull-to-refresh hook
export { usePullToRefresh } from './usePullToRefresh';

// Re-export swipe navigation hook
export { useSwipeNavigation } from './useSwipeNavigation';

// Re-export theme hook
export { useTheme, THEMES } from './useTheme';

// Re-export workout timer hook
export { useWorkoutTimer, formatTimerTime, MAX_TIMER_SECONDS } from './useWorkoutTimer';

// Re-export workout session hooks (extracted from WorkoutPlayer)
export { useWorkoutSession } from './useWorkoutSession';
export { useRestTimer } from './useRestTimer';
export { useEmomTimer } from './useEmomTimer';
export { useExerciseCollapse } from './useExerciseCollapse';

// Re-export scroll hooks
export { useScrollToElement, useScrollToTop } from './useScrollToElement';

// Type exports
export type { OptimisticSyncOptions, OptimisticSyncReturn } from './useOptimisticSync';
export type { FocusTrapOptions, KeyboardShortcutOptions, AriaPoliteness, KeyboardModifiers } from './useAccessibility';
export type { PWAState } from './usePWA';
export type { ThemeId, ThemeInfo } from './useTheme';
export type { LongPressOptions, LongPressHandlers } from './useLongPress';
export type { PullToRefreshOptions, PullToRefreshHandlers, PullToRefreshReturn } from './usePullToRefresh';
export type { SwipeNavigationOptions, SwipeNavigationHandlers, SwipeNavigationReturn, SwipeDirection } from './useSwipeNavigation';
export type { WorkoutTimerState, WorkoutTimerReturn } from './useWorkoutTimer';
export type { UseWorkoutSessionOptions, UseWorkoutSessionReturn } from './useWorkoutSession';
export type { UseRestTimerOptions, UseRestTimerReturn } from './useRestTimer';
export type { UseEmomTimerOptions, UseEmomTimerReturn } from './useEmomTimer';
export type { UseExerciseCollapseOptions, UseExerciseCollapseReturn } from './useExerciseCollapse';
export type { UseScrollToElementOptions } from './useScrollToElement';

// Re-export snackbar hook and provider
export {
    useSnackbar,
    SnackbarProvider,
} from './useSnackbar';
export type {
    SnackbarVariant,
    SnackbarAction,
    SnackbarMessage,
    SnackbarContextValue,
    SnackbarProviderProps,
} from './useSnackbar';
export { useMediaQuery } from './useMediaQuery';

// Re-export optimized scroll hook
export { useOptimizedScroll } from './useOptimizedScroll';
export type { UseOptimizedScrollOptions, UseOptimizedScrollReturn } from './useOptimizedScroll';
