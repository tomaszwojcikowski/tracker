/**
 * useRestTimer Hook
 *
 * Manages rest timer state with countdown, haptic feedback, and toast notifications.
 * Extracted from WorkoutPlayer for reuse across workout views.
 */

import { useState, useEffect, useCallback } from 'react';
import type { HapticFeedback } from './index';

// ============================================================================
// TYPES
// ============================================================================

export interface UseRestTimerOptions {
    /** Haptic feedback interface */
    haptic: HapticFeedback;
}

export interface UseRestTimerReturn {
    /** Current timer seconds */
    seconds: number;
    /** Whether timer is active */
    active: boolean;
    /** Whether toast is visible */
    showToast: boolean;
    /** Start the timer with specified seconds */
    start: (seconds: number) => void;
    /** Stop the timer */
    stop: () => void;
    /** Dismiss the toast */
    dismissToast: () => void;
    /** Set timer seconds directly */
    setSeconds: React.Dispatch<React.SetStateAction<number>>;
    /** Set timer active state directly */
    setActive: React.Dispatch<React.SetStateAction<boolean>>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useRestTimer({ haptic }: UseRestTimerOptions): UseRestTimerReturn {
    const [seconds, setSeconds] = useState(0);
    const [active, setActive] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Timer countdown effect
    useEffect(() => {
        if (active && seconds > 0) {
            const interval = setInterval(() => setSeconds((s) => s - 1), 1000);
            return () => clearInterval(interval);
        }
        if (seconds === 0 && active) {
            setActive(false);
            haptic.timer();
            setShowToast(true);
        }
    }, [active, seconds, haptic]);

    // Escape key to dismiss toast
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showToast) {
                setShowToast(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showToast]);

    const start = useCallback((newSeconds: number) => {
        setSeconds(newSeconds);
        setActive(true);
    }, []);

    const stop = useCallback(() => {
        setActive(false);
    }, []);

    const dismissToast = useCallback(() => {
        setShowToast(false);
    }, []);

    return {
        seconds,
        active,
        showToast,
        start,
        stop,
        dismissToast,
        setSeconds,
        setActive,
    };
}
