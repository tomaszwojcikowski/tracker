import { useState, useCallback, useRef } from 'react';

/**
 * Pull-to-refresh hook for touch devices
 * Returns handlers to attach to the scrollable container and refresh state
 *
 * @param {Object} options
 * @param {Function} options.onRefresh - Async function to call on refresh
 * @param {number} options.threshold - Pull distance to trigger refresh (default: 80)
 * @param {number} options.maxPull - Maximum pull distance (default: 120)
 * @returns {Object} Pull-to-refresh state and handlers
 */
export const usePullToRefresh = ({ onRefresh, threshold = 80, maxPull = 120 }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);

    const startY = useRef(0);
    const currentY = useRef(0);
    const containerRef = useRef(null);

    const handleTouchStart = useCallback((e) => {
        // Only enable pull-to-refresh when scrolled to top
        if (containerRef.current && containerRef.current.scrollTop > 0) {
            return;
        }
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isPulling || isRefreshing) return;

        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;

        // Only allow pulling down (positive diff) and limit the pull distance
        if (diff > 0) {
            // Apply resistance to make it feel natural
            const resistance = 0.4;
            const distance = Math.min(diff * resistance, maxPull);
            setPullDistance(distance);

            // Prevent default scroll when pulling
            if (distance > 10) {
                e.preventDefault();
            }
        }
    }, [isPulling, isRefreshing, maxPull]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling) return;

        setIsPulling(false);

        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(threshold); // Keep at threshold during refresh

            try {
                await onRefresh();
            } catch (error) {
                console.error('Refresh failed:', error);
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

    // Calculate progress percentage for visual feedback
    const progress = Math.min(pullDistance / threshold, 1);
    const canRefresh = pullDistance >= threshold;

    return {
        containerRef,
        isRefreshing,
        isPulling,
        pullDistance,
        progress,
        canRefresh,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
    };
};

export default usePullToRefresh;
