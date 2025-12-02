/**
 * useScrollToElement - Hook for scrolling to elements or top of page
 *
 * Provides scroll-to-element functionality for view transitions.
 */

import { useEffect, useRef } from 'react';

export interface UseScrollToElementOptions {
    /** Element ID to scroll to (if provided, scrolls to element; otherwise scrolls to top) */
    elementId?: string | null;
    /** Delay before scrolling in ms (default: 100) */
    delay?: number;
    /** Scroll behavior (default: 'smooth') */
    behavior?: ScrollBehavior;
    /** Whether to enable the scroll effect (default: true) */
    enabled?: boolean;
}

/**
 * Hook that scrolls to a specific element or to the top of the page on mount
 *
 * @param options - Configuration options for scrolling
 */
export function useScrollToElement({
    elementId,
    delay = 100,
    behavior = 'smooth',
    enabled = true,
}: UseScrollToElementOptions = {}): void {
    // Track if this is the initial mount
    const hasScrolled = useRef(false);

    useEffect(() => {
        if (!enabled || hasScrolled.current) return;

        const scrollTimeout = setTimeout(() => {
            if (elementId) {
                // Scroll to specific element
                const element = document.getElementById(elementId);
                if (element) {
                    element.scrollIntoView({ behavior, block: 'start' });
                    hasScrolled.current = true;
                }
            } else {
                // Scroll to top
                window.scrollTo({ top: 0, behavior });
                hasScrolled.current = true;
            }
        }, delay);

        return () => clearTimeout(scrollTimeout);
    }, [elementId, delay, behavior, enabled]);
}

/**
 * Hook that scrolls to the top of the page on mount
 *
 * @param options - Configuration options for scrolling
 */
export function useScrollToTop(options?: Omit<UseScrollToElementOptions, 'elementId'>): void {
    useScrollToElement({ ...options, elementId: undefined });
}
