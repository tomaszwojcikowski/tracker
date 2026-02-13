/**
 * useDensityTimer Hook
 *
 * Manages density timer - a countdown timer for density exercises where you
 * complete a target number of reps within a time limit (e.g., 30 reps in 10 minutes).
 * Includes countdown ticks, haptic feedback, and audio cues.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { safeGetJSON, safeSetJSON } from '../utils/storage';
import { playTickSound, playBeepSound } from '../utils/audio';
import type { HapticFeedback } from './index';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DENSITY_TIME = 10; // 10 minutes
const DENSITY_TIME_STORAGE_KEY = 'density_timer_minutes';

// ============================================================================
// TYPES
// ============================================================================

export interface UseDensityTimerOptions {
    /** Haptic feedback interface */
    haptic: HapticFeedback;
}

export interface UseDensityTimerReturn {
    /** Current seconds remaining */
    seconds: number;
    /** Whether density timer is active */
    active: boolean;
    /** Total time in minutes */
    timeMinutes: number;
    /** Start the density timer with specified time */
    start: (minutes: number) => void;
    /** Stop the density timer */
    stop: () => void;
    /** Toggle the density timer */
    toggle: (minutes: number) => void;
    /** Set time in minutes */
    setTimeMinutes: (minutes: number) => void;
    /** Set seconds directly */
    setSeconds: React.Dispatch<React.SetStateAction<number>>;
    /** Set active state directly */
    setActive: React.Dispatch<React.SetStateAction<boolean>>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useDensityTimer({ haptic }: UseDensityTimerOptions): UseDensityTimerReturn {
    const [seconds, setSeconds] = useState(0);
    const [active, setActive] = useState(false);
    const [timeMinutes, setTimeMinutes] = useState(() =>
        safeGetJSON<number>(DENSITY_TIME_STORAGE_KEY, DEFAULT_DENSITY_TIME) ?? DEFAULT_DENSITY_TIME
    );

    // Store target end time for robust background handling
    const endTimeRef = useRef<number>(0);

    // Wrap setSeconds to keep ref in sync
    const handleSetSeconds: React.Dispatch<React.SetStateAction<number>> = useCallback((action) => {
        setSeconds(prev => {
            const nextSeconds = typeof action === 'function' ? action(prev) : action;
            if (active) {
                endTimeRef.current = Date.now() + nextSeconds * 1000;
            }
            return nextSeconds;
        });
    }, [active]);

    // Countdown timer effect
    useEffect(() => {
        if (active && seconds > 0) {
            const timerInterval = window.setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

                setSeconds(prev => {
                    if (remaining !== prev) {
                        return remaining;
                    }
                    return prev;
                });
            }, 1000);
            return () => clearInterval(timerInterval);
        }
        if (seconds === 0 && active) {
            // Time's up - stop timer
            setActive(false);
            // Use enhanced timer complete haptic pattern
            haptic.timerComplete();
            playBeepSound();
        }
    }, [active, seconds, haptic]);

    // Enhanced haptic feedback and audio at key intervals
    useEffect(() => {
        if (!active) return;

        // Audio ticks for last 10 seconds
        if (seconds <= 10 && seconds >= 1) {
             playTickSound();
        }

        // Warning at 60 seconds remaining
        if (seconds === 60) {
            haptic.emomWarning();
        }
        // Warning at 30 seconds remaining
        else if (seconds === 30) {
            haptic.emomWarning();
        }
        // Countdown ticks for last 10 seconds
        else if (seconds <= 10 && seconds > 0) {
            haptic.countdown();
        }
    }, [active, seconds, haptic]);

    // Save time preference when it changes
    useEffect(() => {
        safeSetJSON(DENSITY_TIME_STORAGE_KEY, timeMinutes);
    }, [timeMinutes]);

    const start = useCallback((minutes: number) => {
        setTimeMinutes(minutes);
        const secs = minutes * 60;
        setSeconds(secs);
        setActive(true);
        endTimeRef.current = Date.now() + secs * 1000;
    }, []);

    const stop = useCallback(() => {
        setActive(false);
    }, []);

    const toggle = useCallback((minutes: number) => {
        if (active) {
            setActive(false);
        } else {
            setTimeMinutes(minutes);
            const secs = minutes * 60;
            setSeconds(secs);
            setActive(true);
            endTimeRef.current = Date.now() + secs * 1000;
        }
    }, [active]);

    return {
        seconds,
        active,
        timeMinutes,
        start,
        stop,
        toggle,
        setTimeMinutes,
        setSeconds: handleSetSeconds,
        setActive,
    };
}
