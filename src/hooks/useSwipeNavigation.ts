import { useState, useCallback, useRef } from 'react';

// ============================================================================
// SWIPE NAVIGATION TYPES
// ============================================================================

/**
 * Options for swipe navigation behavior
 */
export interface SwipeNavigationOptions {
    /** Callback for left swipe (next) */
    onSwipeLeft?: () => void;
    /** Callback for right swipe (previous) */
    onSwipeRight?: () => void;
    /** Minimum swipe distance in pixels (default: 50) */
    threshold?: number;
    /** Minimum velocity for quick swipes (default: 0.3) */
    velocityThreshold?: number;
}

/**
 * Touch event handlers for swipe navigation
 */
export interface SwipeNavigationHandlers {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
}

/**
 * Swipe direction type
 */
export type SwipeDirection = 'left' | 'right' | null;

/**
 * Return type for useSwipeNavigation hook
 */
export interface SwipeNavigationReturn {
    /** Current horizontal offset from swipe */
    swipeOffset: number;
    /** Whether user is currently swiping */
    isSwiping: boolean;
    /** Direction of swipe ('left', 'right', or null) */
    swipeDirection: SwipeDirection;
    /** Progress percentage (0-1) toward threshold */
    swipeProgress: number;
    /** Touch event handlers to attach to container */
    handlers: SwipeNavigationHandlers;
}

/**
 * Enhanced swipe navigation hook for navigating between items
 * Supports swipe with visual feedback and velocity-based detection
 *
 * @param options - Configuration options
 * @returns Swipe state and handlers
 *
 * @example
 * const { swipeOffset, isSwiping, handlers } = useSwipeNavigation({
 *   onSwipeLeft: () => goToNextDay(),
 *   onSwipeRight: () => goToPrevDay(),
 * });
 *
 * return (
 *   <div
 *     {...handlers}
 *     style={{ transform: `translateX(${swipeOffset}px)` }}
 *   >
 *     <Content />
 *   </div>
 * );
 */
export const useSwipeNavigation = ({
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    velocityThreshold = 0.3,
}: SwipeNavigationOptions): SwipeNavigationReturn => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);

    const startX = useRef(0);
    const startY = useRef(0);
    const startTime = useRef(0);
    const isHorizontalSwipe = useRef<boolean | null>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        startTime.current = Date.now();
        isHorizontalSwipe.current = null;
        setIsSwiping(true);
    }, []);

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!isSwiping) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = currentX - startX.current;
            const diffY = currentY - startY.current;

            // Determine swipe direction on first significant movement
            if (
                isHorizontalSwipe.current === null &&
                (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)
            ) {
                isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
            }

            // Only track horizontal swipes
            if (isHorizontalSwipe.current) {
                // Apply resistance at edges
                const maxOffset = 100;
                const resistance = 0.5;
                const offset = Math.max(
                    -maxOffset,
                    Math.min(maxOffset, diffX * resistance)
                );
                setSwipeOffset(offset);
            }
        },
        [isSwiping]
    );

    const handleTouchEnd = useCallback(() => {
        if (!isSwiping) return;

        const endTime = Date.now();
        const duration = endTime - startTime.current;
        const velocity = Math.abs(swipeOffset) / duration;

        // Trigger callback based on threshold or velocity
        const shouldTrigger =
            Math.abs(swipeOffset) > threshold || velocity > velocityThreshold;

        if (shouldTrigger) {
            if (swipeOffset < 0 && onSwipeLeft) {
                onSwipeLeft();
            } else if (swipeOffset > 0 && onSwipeRight) {
                onSwipeRight();
            }
        }

        setSwipeOffset(0);
        setIsSwiping(false);
        isHorizontalSwipe.current = null;
    }, [isSwiping, swipeOffset, threshold, velocityThreshold, onSwipeLeft, onSwipeRight]);

    // Calculate swipe direction for visual feedback
    const swipeDirection: SwipeDirection =
        swipeOffset > 0 ? 'right' : swipeOffset < 0 ? 'left' : null;
    const swipeProgress = Math.min(Math.abs(swipeOffset) / threshold, 1);

    return {
        swipeOffset,
        isSwiping,
        swipeDirection,
        swipeProgress,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
    };
};

export default useSwipeNavigation;
