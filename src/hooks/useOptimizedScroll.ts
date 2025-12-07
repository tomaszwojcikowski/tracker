/**
 * Optimized Scroll Hook
 * 
 * Provides scroll position tracking with passive event listeners
 * and requestAnimationFrame throttling for better mobile performance.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { addPassiveEventListener, throttleRAF } from '../utils/performanceOptimizations';

export interface UseOptimizedScrollOptions {
    /** Element to track scroll on (defaults to window) */
    element?: HTMLElement | Window | null;
    /** Threshold for showing/hiding UI elements based on scroll direction */
    threshold?: number;
}

export interface UseOptimizedScrollReturn {
    /** Current scroll position (Y axis) */
    scrollY: number;
    /** Whether user is scrolling down */
    scrollingDown: boolean;
    /** Whether user is scrolling up */
    scrollingUp: boolean;
    /** Whether user is at the top of the scroll container */
    isAtTop: boolean;
    /** Whether user is at the bottom of the scroll container */
    isAtBottom: boolean;
}

/**
 * Hook for tracking scroll position with optimal performance on mobile
 * Uses passive event listeners and RAF throttling
 */
export function useOptimizedScroll(
    options: UseOptimizedScrollOptions = {}
): UseOptimizedScrollReturn {
    const { element, threshold = 10 } = options;
    
    const [scrollY, setScrollY] = useState(0);
    const [scrollingDown, setScrollingDown] = useState(false);
    const [scrollingUp, setScrollingUp] = useState(false);
    const [isAtTop, setIsAtTop] = useState(true);
    const [isAtBottom, setIsAtBottom] = useState(false);
    
    const lastScrollY = useRef(0);

    const handleScroll = useCallback(() => {
        const target = element || window;
        let currentScrollY: number;
        let scrollHeight: number;
        let clientHeight: number;

        if (target === window) {
            currentScrollY = window.scrollY || window.pageYOffset;
            scrollHeight = document.documentElement.scrollHeight;
            clientHeight = window.innerHeight;
        } else {
            const el = target as HTMLElement;
            currentScrollY = el.scrollTop;
            scrollHeight = el.scrollHeight;
            clientHeight = el.clientHeight;
        }

        // Update scroll position
        setScrollY(currentScrollY);

        // Determine scroll direction
        const diff = currentScrollY - lastScrollY.current;
        
        if (Math.abs(diff) > threshold) {
            setScrollingDown(diff > 0);
            setScrollingUp(diff < 0);
            lastScrollY.current = currentScrollY;
        }

        // Check if at top or bottom
        setIsAtTop(currentScrollY <= 0);
        setIsAtBottom(currentScrollY + clientHeight >= scrollHeight - 10);
    }, [element, threshold]);

    // Throttle scroll handler with RAF
    const throttledHandleScroll = useRef(throttleRAF(handleScroll));

    useEffect(() => {
        // Update throttled handler if dependencies change
        throttledHandleScroll.current = throttleRAF(handleScroll);
    }, [handleScroll]);

    useEffect(() => {
        const target = element || window;
        
        // Initial scroll position
        handleScroll();

        // Add passive scroll listener
        const cleanup = addPassiveEventListener(
            target as HTMLElement | Window,
            'scroll',
            throttledHandleScroll.current as EventListener
        );

        return cleanup;
    }, [element, handleScroll]);

    return {
        scrollY,
        scrollingDown,
        scrollingUp,
        isAtTop,
        isAtBottom,
    };
}

export default useOptimizedScroll;
