import { useState, useCallback, useEffect, useRef, RefObject } from 'react';

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
    // Mirror state in refs so the native (non-passive) touchmove listener
    // can read the latest values without re-binding on every render.
    const isPullingRef = useRef(false);
    const isRefreshingRef = useRef(false);

    useEffect(() => {
        isPullingRef.current = isPulling;
    }, [isPulling]);

    useEffect(() => {
        isRefreshingRef.current = isRefreshing;
    }, [isRefreshing]);

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

    // Native non-passive touchmove listener so e.preventDefault() actually
    // suppresses the browser's pull-to-scroll behavior. React attaches
    // touch handlers as passive by default, which makes preventDefault a no-op.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onTouchMove = (e: TouchEvent) => {
            if (!isPullingRef.current || isRefreshingRef.current) return;

            currentY.current = e.touches[0].clientY;
            const diff = currentY.current - startY.current;

            if (diff > 0) {
                const resistance = 0.4;
                const distance = Math.min(diff * resistance, maxPull);
                setPullDistance(distance);

                if (distance > 10) {
                    // Suppress native scroll while user is pulling down from top.
                    e.preventDefault();
                }
            }
        };

        container.addEventListener('touchmove', onTouchMove, { passive: false });
        return () => {
            container.removeEventListener('touchmove', onTouchMove);
        };
    }, [maxPull]);

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
            // No-op: the actual touchmove listener is attached natively with
            // { passive: false } via useEffect so e.preventDefault() works.
            // Kept on the handlers object for backward compatibility with
            // call sites that spread `handlers` onto an element.
            onTouchMove: () => {},
            onTouchEnd: handleTouchEnd,
        },
    };
};
