import React from 'react';
import { usePullToRefresh } from '../hooks';
import { RefreshCw } from '../icons';

/**
 * Pull-to-refresh wrapper component
 * Wraps content with pull-to-refresh functionality for touch devices
 *
 * @param {Object} props
 * @param {Function} props.onRefresh - Async function to call on refresh
 * @param {React.ReactNode} props.children - Content to wrap
 * @param {string} props.className - Additional CSS classes
 */
export const PullToRefresh = ({ onRefresh, children, className = '' }) => {
    const {
        containerRef,
        isRefreshing,
        pullDistance,
        progress,
        canRefresh,
        handlers,
    } = usePullToRefresh({ onRefresh });

    return (
        <div
            ref={containerRef}
            className={`relative overflow-auto ${className}`}
            {...handlers}
        >
            {/* Pull indicator */}
            <div
                className="absolute left-0 right-0 flex justify-center pointer-events-none z-10 transition-opacity"
                style={{
                    top: -40,
                    transform: `translateY(${pullDistance}px)`,
                    opacity: pullDistance > 10 ? 1 : 0,
                }}
            >
                <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full transition-all ${
                        canRefresh ? 'bg-sys-accent' : 'bg-sys-surfaceHigh'
                    } ${isRefreshing ? 'animate-spin' : ''}`}
                    style={{
                        transform: `rotate(${progress * 360}deg)`,
                    }}
                >
                    <RefreshCw
                        size={20}
                        className={canRefresh ? 'text-white' : 'text-sys-onSurfaceVar'}
                    />
                </div>
            </div>

            {/* Content with pull transform */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none',
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
