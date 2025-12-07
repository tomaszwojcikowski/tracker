/**
 * Web Vitals Monitoring
 * 
 * Tracks Core Web Vitals and performance metrics for mobile optimization
 */

export interface WebVitalsMetrics {
    /** First Contentful Paint - time until first content is rendered */
    FCP?: number;
    /** Largest Contentful Paint - time until largest content is rendered */
    LCP?: number;
    /** First Input Delay - time from first interaction to browser response */
    FID?: number;
    /** Cumulative Layout Shift - visual stability score */
    CLS?: number;
    /** Time to First Byte - server response time */
    TTFB?: number;
    /** Interaction to Next Paint - responsiveness metric */
    INP?: number;
}

type MetricCallback = (metric: WebVitalsMetrics) => void;

let metricsCallback: MetricCallback | null = null;
const metrics: WebVitalsMetrics = {};

/**
 * Initialize web vitals tracking
 * @param callback Function to call when metrics are collected
 */
export function initWebVitals(callback: MetricCallback): void {
    metricsCallback = callback;
    
    // Use web-vitals library if available (can be dynamically imported)
    if ('PerformanceObserver' in window) {
        observeFCP();
        observeLCP();
        observeFID();
        observeCLS();
        observeINP();
    }
    
    // Measure TTFB using Navigation Timing API
    if ('performance' in window && 'getEntriesByType' in performance) {
        measureTTFB();
    }
}

/**
 * Observe First Contentful Paint
 */
function observeFCP(): void {
    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    metrics.FCP = entry.startTime;
                    reportMetric('FCP', entry.startTime);
                    observer.disconnect();
                }
            }
        });
        observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
        console.debug('FCP observation not supported');
    }
}

/**
 * Observe Largest Contentful Paint
 */
function observeLCP(): void {
    try {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.LCP = lastEntry.startTime;
            reportMetric('LCP', lastEntry.startTime);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // LCP can change, so we observe until page is hidden
        const stopObserving = () => {
            observer.disconnect();
            document.removeEventListener('visibilitychange', stopObserving);
        };
        document.addEventListener('visibilitychange', stopObserving);
    } catch (e) {
        console.debug('LCP observation not supported');
    }
}

/**
 * Observe First Input Delay
 */
function observeFID(): void {
    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                const fidEntry = entry as PerformanceEventTiming;
                const delay = fidEntry.processingStart - fidEntry.startTime;
                metrics.FID = delay;
                reportMetric('FID', delay);
                observer.disconnect();
            }
        });
        observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
        console.debug('FID observation not supported');
    }
}

/**
 * Observe Cumulative Layout Shift
 */
function observeCLS(): void {
    try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                const layoutShiftEntry = entry as LayoutShift;
                if (!layoutShiftEntry.hadRecentInput) {
                    clsValue += layoutShiftEntry.value;
                    metrics.CLS = clsValue;
                }
            }
            reportMetric('CLS', clsValue);
        });
        observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
        console.debug('CLS observation not supported');
    }
}

/**
 * Observe Interaction to Next Paint (new metric replacing FID)
 */
function observeINP(): void {
    try {
        const observer = new PerformanceObserver((list) => {
            let maxDuration = 0;
            for (const entry of list.getEntries()) {
                const eventEntry = entry as PerformanceEventTiming;
                if (eventEntry.duration > maxDuration) {
                    maxDuration = eventEntry.duration;
                    metrics.INP = maxDuration;
                }
            }
            reportMetric('INP', maxDuration);
        });
        observer.observe({ entryTypes: ['event'] });
    } catch (e) {
        console.debug('INP observation not supported');
    }
}

/**
 * Measure Time to First Byte
 */
function measureTTFB(): void {
    try {
        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
            const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
            const ttfb = navEntry.responseStart - navEntry.requestStart;
            metrics.TTFB = ttfb;
            reportMetric('TTFB', ttfb);
        }
    } catch (e) {
        console.debug('TTFB measurement not supported');
    }
}

/**
 * Report metric to callback
 */
function reportMetric(name: string, value: number): void {
    if (metricsCallback) {
        metricsCallback({ ...metrics });
    }
    
    // Log metrics in development
    if (import.meta.env.DEV) {
        console.debug(`📊 ${name}: ${value.toFixed(2)}ms`);
    }
}

/**
 * Get current metrics snapshot
 */
export function getWebVitals(): WebVitalsMetrics {
    return { ...metrics };
}

/**
 * Check if metrics are within acceptable thresholds
 * Based on Google's Core Web Vitals thresholds
 */
export function areMetricsGood(): { pass: boolean; details: Record<string, boolean> } {
    return {
        pass: (
            (!metrics.LCP || metrics.LCP < 2500) &&
            (!metrics.FID || metrics.FID < 100) &&
            (!metrics.CLS || metrics.CLS < 0.1) &&
            (!metrics.INP || metrics.INP < 200)
        ),
        details: {
            LCP: !metrics.LCP || metrics.LCP < 2500,
            FID: !metrics.FID || metrics.FID < 100,
            CLS: !metrics.CLS || metrics.CLS < 0.1,
            INP: !metrics.INP || metrics.INP < 200,
            TTFB: !metrics.TTFB || metrics.TTFB < 600,
        }
    };
}

// Type augmentation for PerformanceEventTiming
interface PerformanceEventTiming extends PerformanceEntry {
    processingStart: number;
    duration: number;
}

// Type augmentation for LayoutShift
interface LayoutShift extends PerformanceEntry {
    value: number;
    hadRecentInput: boolean;
}
