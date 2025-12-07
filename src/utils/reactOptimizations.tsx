/**
 * React Performance Optimizations
 * 
 * Utilities for optimizing React component performance including
 * memoization helpers, render tracking, and component wrappers.
 */

import React, { ComponentType, memo, PropsWithChildren } from 'react';

/**
 * Enhanced memo with custom comparison function
 * Useful for components with complex props
 */
export function deepMemo<P extends object>(
    Component: ComponentType<P>,
    propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): ComponentType<P> {
    return memo(Component, propsAreEqual);
}

/**
 * Shallow comparison for memo
 * More efficient than deep comparison for most cases
 */
export function shallowEqual(obj1: Record<string, unknown>, obj2: Record<string, unknown>): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
}

/**
 * Memoize component with shallow comparison
 */
export function shallowMemo<P extends object>(Component: ComponentType<P>): ComponentType<P> {
    return memo(Component, (prevProps, nextProps) => 
        shallowEqual(prevProps as Record<string, unknown>, nextProps as Record<string, unknown>)
    );
}

/**
 * Track component renders in development
 * Logs to console when component re-renders
 */
export function trackRenders<P extends object>(
    Component: ComponentType<P>,
    componentName?: string
): ComponentType<P> {
    if (import.meta.env.PROD) {
        return Component;
    }

    const name = componentName || Component.displayName || Component.name || 'Unknown';

    return (props: P) => {
        console.debug(`🔄 ${name} rendered`);
        return <Component {...props} />;
    };
}

/**
 * Render count tracker hook
 * Returns current render count for debugging
 */
export function useRenderCount(componentName: string): number {
    const renderCount = React.useRef(0);
    
    React.useEffect(() => {
        renderCount.current += 1;
        if (import.meta.env.DEV) {
            console.debug(`🔢 ${componentName} render count: ${renderCount.current}`);
        }
    });

    return renderCount.current;
}

/**
 * Why did you render helper
 * Logs which props changed causing a re-render
 */
export function useWhyDidYouUpdate(
    name: string,
    props: Record<string, unknown>
): void {
    const previousProps = React.useRef<Record<string, unknown> | undefined>(undefined);

    React.useEffect(() => {
        if (previousProps.current && import.meta.env.DEV) {
            const allKeys = Object.keys({ ...previousProps.current, ...props });
            const changedProps: Record<string, { from: unknown; to: unknown }> = {};

            allKeys.forEach(key => {
                if (previousProps.current![key] !== props[key]) {
                    changedProps[key] = {
                        from: previousProps.current![key],
                        to: props[key],
                    };
                }
            });

            if (Object.keys(changedProps).length > 0) {
                console.debug(`🔍 ${name} re-rendered due to:`, changedProps);
            }
        }

        previousProps.current = props;
    });
}

/**
 * Lazy load component with retry logic
 * Useful for handling chunk load failures
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
    componentImport: () => Promise<{ default: T }>,
    retries = 3,
    retryDelay = 1000
): React.LazyExoticComponent<T> {
    return React.lazy(async () => {
        for (let i = 0; i < retries; i++) {
            try {
                return await componentImport();
            } catch (error) {
                if (i === retries - 1) {
                    throw error;
                }
                
                console.warn(`Failed to load component, retrying... (${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        
        throw new Error('Failed to load component after retries');
    });
}

/**
 * Suspense wrapper with error boundary
 */
interface SuspenseBoundaryProps extends PropsWithChildren {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
}

interface SuspenseBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class SuspenseBoundary extends React.Component<
    SuspenseBoundaryProps,
    SuspenseBoundaryState
> {
    constructor(props: SuspenseBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): SuspenseBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('SuspenseBoundary caught error:', error, errorInfo);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return this.props.errorFallback || (
                <div className="flex items-center justify-center p-4">
                    <div className="text-center">
                        <p className="text-sys-error mb-2">Failed to load component</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-sys-primary underline"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <React.Suspense fallback={this.props.fallback || <div>Loading...</div>}>
                {this.props.children}
            </React.Suspense>
        );
    }
}

/**
 * Batched update wrapper
 * Groups multiple state updates to reduce re-renders
 */
export function batchUpdates<T extends (...args: unknown[]) => void>(
    callback: T
): T {
    return ((...args: unknown[]) => {
        // React 18+ automatically batches updates
        // This wrapper is for compatibility and explicit batching
        React.startTransition(() => {
            callback(...args);
        });
    }) as T;
}

/**
 * Virtualized list item wrapper
 * Optimizes rendering of large lists
 */
interface VirtualItemProps extends PropsWithChildren {
    index: number;
    isVisible?: boolean;
}

export const VirtualItem: React.FC<VirtualItemProps> = memo(({ 
    index: _index, 
    isVisible = true, 
    children 
}) => {
    if (!isVisible) {
        return null;
    }

    return <>{children}</>;
});

VirtualItem.displayName = 'VirtualItem';

/**
 * Debounced render component
 * Delays rendering until props stabilize
 */
interface DebouncedRenderProps<P> extends PropsWithChildren {
    delay?: number;
    component: ComponentType<P>;
    componentProps: P;
}

export function DebouncedRender<P extends object>({
    delay = 300,
    component: Component,
    componentProps,
}: DebouncedRenderProps<P>): React.ReactElement | null {
    const [debouncedProps, setDebouncedProps] = React.useState<P>(componentProps);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedProps(componentProps);
        }, delay);

        return () => clearTimeout(handler);
    }, [componentProps, delay]);

    return <Component {...(debouncedProps as P)} />;
}

/**
 * Intersection observer component for lazy rendering
 */
interface LazyRenderProps extends PropsWithChildren {
    rootMargin?: string;
    threshold?: number;
    placeholder?: React.ReactNode;
}

export const LazyRender: React.FC<LazyRenderProps> = ({
    rootMargin = '100px',
    threshold = 0,
    placeholder = null,
    children,
}) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin, threshold }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [rootMargin, threshold]);

    return (
        <div ref={ref}>
            {isVisible ? children : placeholder}
        </div>
    );
};

LazyRender.displayName = 'LazyRender';
