/**
 * useRestTimer Hook
 *
 * Manages rest timer state with countdown, haptic feedback, and toast notifications.
 * Extracted from WorkoutPlayer for reuse across workout views.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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

    // Store the target end time to handle background throttling
    const endTimeRef = useRef<number>(0);

    // Wrapper for setSeconds to ensure endTimeRef stays in sync when manually updating time
    const handleSetSeconds: React.Dispatch<React.SetStateAction<number>> = useCallback((action) => {
        setSeconds(prev => {
            const nextSeconds = typeof action === 'function' ? action(prev) : action;
            // If timer is active, update the end time reference
            // This ensures that if we manually set time (e.g. +30s), the countdown continues from the new value
            if (active) {
                endTimeRef.current = Date.now() + nextSeconds * 1000;
            }
            return nextSeconds;
        });
    // active is a dependency, so this callback updates when active changes
    }, [active]);

    // Timer countdown effect with enhanced haptic patterns
    useEffect(() => {
        if (active && seconds > 0) {
            // Initialize endTimeRef if it wasn't set (e.g. component mount with active state implied?)
            // But usually start() sets it.
            // If we reload app and restore state? useRestTimer doesn't seem to persist state to storage directly except via consumer?
            // "Extracted from WorkoutPlayer". It's mostly ephemeral.

            const interval = setInterval(() => {
                const now = Date.now();
                // Calculate remaining time based on target end time
                const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

                // Only update if value changed to avoid render loop
                setSeconds(prev => {
                     if (remaining !== prev) return remaining;
                     return prev;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
        if (seconds === 0 && active) {
            setActive(false);
            // Use enhanced timer complete haptic pattern
            haptic.timerComplete();
            setShowToast(true);
        }
    }, [active, seconds, haptic]);

    // Enhanced haptic feedback at key intervals
    useEffect(() => {
        if (!active) return;

        // 30 seconds remaining - double tap pattern
        if (seconds === 30) {
            haptic.timer30();
        }
        // 10 seconds remaining - triple tap pattern
        else if (seconds === 10) {
            haptic.timer10();
        }
        // Countdown ticks for last 5 seconds
        else if (seconds <= 5 && seconds > 0) {
            haptic.countdown();
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
        endTimeRef.current = Date.now() + newSeconds * 1000;
    }, []);

    const stop = useCallback(() => {
        setActive(false);
        setSeconds(0);
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
        setSeconds: handleSetSeconds,
        setActive,
    };
}
