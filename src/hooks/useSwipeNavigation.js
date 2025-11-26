import { useState, useCallback, useRef } from 'react';

/**
 * Enhanced swipe navigation hook for navigating between items
 * Supports swipe with visual feedback and velocity-based detection
 *
 * @param {Object} options
 * @param {Function} options.onSwipeLeft - Callback for left swipe (next)
 * @param {Function} options.onSwipeRight - Callback for right swipe (previous)
 * @param {number} options.threshold - Minimum swipe distance in pixels (default: 50)
 * @param {number} options.velocityThreshold - Minimum velocity for quick swipes (default: 0.3)
 * @returns {Object} Swipe state and handlers
 */
export const useSwipeNavigation = ({
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    velocityThreshold = 0.3,
}) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);

    const startX = useRef(0);
    const startY = useRef(0);
    const startTime = useRef(0);
    const isHorizontalSwipe = useRef(null);

    const handleTouchStart = useCallback((e) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        startTime.current = Date.now();
        isHorizontalSwipe.current = null;
        setIsSwiping(true);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isSwiping) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - startX.current;
        const diffY = currentY - startY.current;

        // Determine swipe direction on first significant movement
        if (isHorizontalSwipe.current === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
            isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
        }

        // Only track horizontal swipes
        if (isHorizontalSwipe.current) {
            // Apply resistance at edges
            const maxOffset = 100;
            const resistance = 0.5;
            const offset = Math.max(-maxOffset, Math.min(maxOffset, diffX * resistance));
            setSwipeOffset(offset);
        }
    }, [isSwiping]);

    const handleTouchEnd = useCallback(() => {
        if (!isSwiping) return;

        const endTime = Date.now();
        const duration = endTime - startTime.current;
        const velocity = Math.abs(swipeOffset) / duration;

        // Trigger callback based on threshold or velocity
        const shouldTrigger = Math.abs(swipeOffset) > threshold || velocity > velocityThreshold;

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
    const swipeDirection = swipeOffset > 0 ? 'right' : swipeOffset < 0 ? 'left' : null;
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
