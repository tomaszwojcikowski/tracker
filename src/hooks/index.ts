import { useState, useEffect } from 'react';

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
}

/**
 * Haptic feedback hook using the Vibration API
 * Provides different vibration patterns for UI interactions
 */
export const useHaptic = (): HapticFeedback => {
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
    };
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
// LUCIDE ICONS HOOK (DEPRECATED)
// ============================================================================

declare global {
    interface Window {
        lucide?: {
            createIcons: () => void;
        };
    }
}

/**
 * Lucide icon refresh hook
 * Ensures Lucide icons are re-rendered after React updates
 * @param deps - Dependencies that trigger icon refresh
 * @deprecated Use lucide-react components instead
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useLucideIcons = (deps: any[] = []): void => {
    useEffect(() => {
        // Use double RAF to ensure DOM is fully updated
        let rafId1: number;
        let rafId2: number;

        rafId1 = requestAnimationFrame(() => {
            rafId2 = requestAnimationFrame(() => {
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            });
        });

        // Cleanup: cancel pending RAF callbacks
        return () => {
            if (rafId1) cancelAnimationFrame(rafId1);
            if (rafId2) cancelAnimationFrame(rafId2);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
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

// Type exports - TypeScript will pick these up from .ts files
export type { OptimisticSyncOptions, OptimisticSyncReturn } from './useOptimisticSync';
export type { FocusTrapOptions, KeyboardShortcutOptions, AriaPoliteness, KeyboardModifiers } from './useAccessibility';
export type { PWAState } from './usePWA';
export type { ThemeId, ThemeInfo } from './useTheme';
