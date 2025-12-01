import React from 'react';
import { Clock, Maximize2 } from '../icons';

export interface FloatingTimerProps {
    /** Current timer seconds */
    seconds: number;
    /** Whether timer is active */
    active: boolean;
    /** Callback to expand timer to fullscreen/ActionBar */
    onExpand: () => void;
    /** Whether the ActionBar is currently visible (to avoid duplication) */
    actionBarVisible?: boolean;
}

/**
 * FloatingTimer - Compact minimized timer indicator
 * 
 * This component shows ONLY when:
 * 1. Timer is active
 * 2. ActionBar is NOT visible (user scrolled away or in different view)
 * 
 * Tapping expands to full ActionBar/fullscreen timer.
 * This prevents the UI conflict of showing timers in multiple places.
 */
export const FloatingTimer: React.FC<FloatingTimerProps> = ({ 
    seconds, 
    active, 
    onExpand,
    actionBarVisible = false 
}) => {
    // Don't show if timer not active, no time left, or ActionBar is visible
    if (!active || seconds <= 0 || actionBarVisible) return null;

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const isUrgent = seconds <= 10;

    return (
        <button
            onClick={onExpand}
            className={`fixed top-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-95 surface-elevation-2 ${
                isUrgent
                    ? 'bg-error-500/90 animate-pulse'
                    : 'bg-sys-surfaceHigh/95 border border-sys-outline'
            }`}
            aria-label={`Timer: ${minutes}:${secs < 10 ? '0' : ''}${secs} remaining. Tap to expand.`}
        >
            <Clock size={16} className={isUrgent ? 'text-white' : 'text-sys-accent'} />
            <span
                className={`font-mono font-bold text-base min-w-[52px] ${
                    isUrgent ? 'text-white' : 'text-white'
                }`}
            >
                {minutes}:{secs < 10 ? '0' : ''}{secs}
            </span>
            <Maximize2 size={14} className={isUrgent ? 'text-white/70' : 'text-sys-onSurfaceVar'} />
        </button>
    );
};

export default FloatingTimer;
