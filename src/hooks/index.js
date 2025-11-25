import { useState, useEffect } from 'react';

/**
 * Custom React Hooks
 * 
 * Reusable hooks for haptic feedback, swipe gestures, debouncing, and icon management.
 */

// Default debounce delay
const DEBOUNCE_DELAY_MS = 300;

/**
 * Haptic feedback hook using the Vibration API
 * Provides different vibration patterns for UI interactions
 */
export const useHaptic = () => {
    const trigger = (pattern = [10]) => {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    };
    return {
        tick: () => trigger([10]), // Light tap for checks
        bump: () => trigger([30]), // Medium bump for buttons
        success: () => trigger([50, 50, 50]), // Double pulse for completion
        timer: () => trigger([200, 100, 200]) // Triple buzz for timer completion
    };
};

/**
 * Swipe gesture detection hook
 * @param {Object} options
 * @param {Function} options.onSwipeLeft - Callback for left swipe
 * @param {Function} options.onSwipeRight - Callback for right swipe
 * @param {number} options.threshold - Minimum swipe distance in pixels
 */
export const useSwipe = ({ onSwipeLeft, onSwipeRight, threshold = 50 }) => {
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > threshold;
        const isRightSwipe = distance < -threshold;
        if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
        if (isRightSwipe && onSwipeRight) onSwipeRight();
    };
    return { onTouchStart, onTouchMove, onTouchEnd };
};

/**
 * Debounce hook for reducing excessive updates
 * @param {*} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {*} Debounced value
 */
export const useDebounce = (value, delay = DEBOUNCE_DELAY_MS) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    
    return debouncedValue;
};

/**
 * Lucide icon refresh hook
 * Ensures Lucide icons are re-rendered after React updates
 * @param {Array} deps - Dependencies that trigger icon refresh
 * @deprecated Use lucide-react components instead
 */
export const useLucideIcons = (deps = []) => {
    useEffect(() => {
        // Use double RAF to ensure DOM is fully updated
        let rafId1, rafId2;
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
    }, deps);
};

// Re-export optimistic sync hook
export { useOptimisticSync, SyncStatus } from './useOptimisticSync';
