import React from 'react';
import { usePullToRefresh, PullToRefreshReturn } from '../hooks/usePullToRefresh';
import { RefreshCw } from '../icons';

export interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
}

/**
 * Pull-to-refresh wrapper component
 * Wraps content with pull-to-refresh functionality for touch devices
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, className = '' }) => {
    const {
        containerRef,
        isRefreshing,
        pullDistance,
        progress,
        canRefresh,
        handlers,
    }: PullToRefreshReturn = usePullToRefresh({ onRefresh });

    return (
        <div
            ref={containerRef as React.RefObject<HTMLDivElement>}
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
                        canRefresh ? 'bg-sys-primary' : 'bg-sys-surfaceContainerLow'
                    } ${isRefreshing ? 'animate-spin' : ''}`}
                    style={{
                        transform: `rotate(${progress * 360}deg)`,
                    }}
                >
                    <RefreshCw
                        size={20}
                        className={canRefresh ? 'text-sys-onPrimary' : 'text-sys-onSurfaceVar'}
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
