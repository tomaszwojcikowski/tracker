/**
 * Performance Optimizations Utilities
 * 
 * Mobile-specific performance optimizations including:
 * - Passive event listeners for better scroll performance
 * - Request animation frame throttling
 * - Intersection observer utilities
 */

/**
 * Add passive event listener for better scroll performance
 * on mobile devices. Passive listeners indicate the event handler
 * will not call preventDefault(), allowing browsers to optimize scrolling.
 */
export function addPassiveEventListener(
    element: HTMLElement | Window | Document,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
): () => void {
    const passiveOptions: AddEventListenerOptions = {
        ...options,
        passive: true,
    };
    
    element.addEventListener(event, handler, passiveOptions);
    
    // Return cleanup function
    return () => {
        element.removeEventListener(event, handler);
    };
}

/**
 * Throttle function using requestAnimationFrame for smooth 60fps updates
 * Useful for scroll handlers, resize handlers, and other frequent events
 */
export function throttleRAF<T extends (...args: unknown[]) => void>(
    callback: T
): (...args: Parameters<T>) => void {
    let rafId: number | null = null;
    let lastArgs: Parameters<T> | null = null;

    return (...args: Parameters<T>) => {
        lastArgs = args;
        
        if (rafId !== null) {
            return;
        }

        rafId = requestAnimationFrame(() => {
            if (lastArgs !== null) {
                callback(...lastArgs);
                lastArgs = null;
            }
            rafId = null;
        });
    };
}

/**
 * Create an intersection observer with default options optimized for mobile
 */
export function createOptimizedIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
): IntersectionObserver {
    const defaultOptions: IntersectionObserverInit = {
        // Use root margin to trigger loading before items are visible
        rootMargin: '50px 0px',
        // Trigger at 10% visibility
        threshold: 0.1,
        ...options,
    };

    return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Lazy load images using intersection observer
 * Returns cleanup function to disconnect observer
 */
export function setupLazyImageLoading(
    images: HTMLImageElement[],
    onLoad?: (img: HTMLImageElement) => void
): () => void {
    if (!('IntersectionObserver' in window)) {
        // Fallback: load all images immediately if IntersectionObserver not supported
        images.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                onLoad?.(img);
            }
        });
        return () => {};
    }

    const observer = createOptimizedIntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    onLoad?.(img);
                    observer.unobserve(img);
                }
            }
        });
    });

    images.forEach((img) => observer.observe(img));

    return () => observer.disconnect();
}

/**
 * Detect if user prefers reduced motion for accessibility
 */
export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get optimized animation duration based on user preferences
 */
export function getAnimationDuration(defaultMs: number): number {
    return prefersReducedMotion() ? 0 : defaultMs;
}

/**
 * Check if device is low-end based on hardware concurrency and memory
 * Useful for conditionally disabling expensive features
 */
export function isLowEndDevice(): boolean {
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    
    // Consider low-end if 2 or fewer cores
    if (hardwareConcurrency <= 2) {
        return true;
    }

    // Check device memory if available (Chrome only)
    if ('deviceMemory' in navigator) {
        const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
        // Less than 4GB RAM
        if (deviceMemory < 4) {
            return true;
        }
    }

    return false;
}

/**
 * Measure and log performance metrics using Performance API
 */
export function measurePerformance(
    name: string,
    fn: () => void | Promise<void>
): void | Promise<void> {
    if (!('performance' in window)) {
        return fn();
    }

    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-duration`;

    performance.mark(startMark);

    const result = fn();

    if (result instanceof Promise) {
        return result.finally(() => {
            performance.mark(endMark);
            performance.measure(measureName, startMark, endMark);
            
            const measure = performance.getEntriesByName(measureName)[0];
            if (measure) {
                console.debug(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
                performance.clearMarks(startMark);
                performance.clearMarks(endMark);
                performance.clearMeasures(measureName);
            }
        });
    } else {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        
        const measure = performance.getEntriesByName(measureName)[0];
        if (measure) {
            console.debug(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
            performance.clearMarks(startMark);
            performance.clearMarks(endMark);
            performance.clearMeasures(measureName);
        }
    }
}

/**
 * Batch DOM updates using requestAnimationFrame
 * Collects multiple updates and applies them in a single frame
 */
export function batchDOMUpdates<T>(
    updates: Array<() => void>
): Promise<void> {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            updates.forEach(update => update());
            resolve();
        });
    });
}

/**
 * Debounce with leading edge option for immediate feedback
 */
export function debounceLeading<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number,
    leading = true
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let hasInvoked = false;

    return (...args: Parameters<T>) => {
        if (leading && !hasInvoked) {
            func(...args);
            hasInvoked = true;
        }

        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            if (!leading) {
                func(...args);
            }
            hasInvoked = false;
            timeoutId = null;
        }, wait);
    };
}
