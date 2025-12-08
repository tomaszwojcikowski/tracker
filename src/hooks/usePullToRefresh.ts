import { useState, useCallback, useRef, RefObject } from 'react';

// ============================================================================
// PULL TO REFRESH TYPES
// ============================================================================

/**
 * Options for pull-to-refresh behavior
 */
export interface PullToRefreshOptions {
    /** Async function to call on refresh */
    onRefresh: () => Promise<void>;
    /** Pull distance to trigger refresh (default: 80) */
    threshold?: number;
    /** Maximum pull distance (default: 120) */
    maxPull?: number;
}

/**
 * Touch event handlers for pull-to-refresh
 */
export interface PullToRefreshHandlers {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
}

/**
 * Return type for usePullToRefresh hook
 */
export interface PullToRefreshReturn {
    /** Ref to attach to the scrollable container */
    containerRef: RefObject<HTMLElement | null>;
    /** Whether a refresh is in progress */
    isRefreshing: boolean;
    /** Whether user is currently pulling */
    isPulling: boolean;
    /** Current pull distance in pixels */
    pullDistance: number;
    /** Progress percentage (0-1) toward threshold */
    progress: number;
    /** Whether pull distance has reached threshold */
    canRefresh: boolean;
    /** Touch event handlers to attach to container */
    handlers: PullToRefreshHandlers;
}

/**
 * Pull-to-refresh hook for touch devices
 * Returns handlers to attach to the scrollable container and refresh state
 *
 * @param options - Configuration options
 * @returns Pull-to-refresh state and handlers
 *
 * @example
 * const { containerRef, isRefreshing, handlers, progress } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await fetchNewData();
 *   }
 * });
 *
 * return (
 *   <div ref={containerRef} {...handlers}>
 *     {isRefreshing && <Spinner />}
 *     <Content />
 *   </div>
 * );
 */
export const usePullToRefresh = ({
    onRefresh,
    threshold = 80,
    maxPull = 120,
}: PullToRefreshOptions): PullToRefreshReturn => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);

    const startY = useRef(0);
    const currentY = useRef(0);
    const containerRef = useRef<HTMLElement | null>(null);

    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            // Only enable pull-to-refresh when scrolled to top
            if (containerRef.current && containerRef.current.scrollTop > 0) {
                return;
            }
            startY.current = e.touches[0].clientY;
            setIsPulling(true);
        },
        []
    );

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
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
        },
        [isPulling, isRefreshing, maxPull]
    );

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
