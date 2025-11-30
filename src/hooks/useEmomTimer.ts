/**
 * useEmomTimer Hook
 *
 * Manages EMOM (Every Minute On the Minute) timer with countdown ticks,
 * auto-restart, haptic feedback, and audio cues.
 * Extracted from WorkoutPlayer for reuse across workout views.
 */

import { useState, useEffect, useCallback } from 'react';
import { safeGetJSON, safeSetJSON } from '../utils/storage';
import { playTickSound, playBeepSound } from '../utils/audio';
import type { HapticFeedback } from './index';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_EMOM_INTERVAL = 60;
const EMOM_INTERVAL_STORAGE_KEY = 'emom_interval';

// ============================================================================
// TYPES
// ============================================================================

export interface UseEmomTimerOptions {
    /** Haptic feedback interface */
    haptic: HapticFeedback;
}

export interface UseEmomTimerReturn {
    /** Current seconds remaining in interval */
    seconds: number;
    /** Whether EMOM timer is active */
    active: boolean;
    /** Current interval setting (seconds per round) */
    interval: number;
    /** Start the EMOM timer */
    start: () => void;
    /** Stop the EMOM timer */
    stop: () => void;
    /** Toggle the EMOM timer */
    toggle: () => void;
    /** Set the interval duration */
    setInterval: (seconds: number) => void;
    /** Set seconds directly */
    setSeconds: React.Dispatch<React.SetStateAction<number>>;
    /** Set active state directly */
    setActive: React.Dispatch<React.SetStateAction<boolean>>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useEmomTimer({ haptic }: UseEmomTimerOptions): UseEmomTimerReturn {
    const [seconds, setSeconds] = useState(0);
    const [active, setActive] = useState(false);
    const [interval, setIntervalState] = useState(() =>
        safeGetJSON<number>(EMOM_INTERVAL_STORAGE_KEY, DEFAULT_EMOM_INTERVAL) ?? DEFAULT_EMOM_INTERVAL
    );

    // EMOM timer effect
    useEffect(() => {
        if (active && seconds > 0) {
            const timerInterval = window.setInterval(() => {
                setSeconds((s) => {
                    const newValue = s - 1;
                    // Play tick sound for last 5 seconds
                    if (newValue <= 5 && newValue >= 1) {
                        playTickSound();
                    }
                    return newValue;
                });
            }, 1000);
            return () => clearInterval(timerInterval);
        }
        if (seconds === 0 && active) {
            // Reset to interval and continue
            setSeconds(interval);
            haptic.timer();
            playBeepSound();
        }
    }, [active, seconds, interval, haptic]);

    // Save interval preference when it changes
    useEffect(() => {
        safeSetJSON(EMOM_INTERVAL_STORAGE_KEY, interval);
    }, [interval]);

    const start = useCallback(() => {
        setSeconds(interval);
        setActive(true);
    }, [interval]);

    const stop = useCallback(() => {
        setActive(false);
    }, []);

    const toggle = useCallback(() => {
        if (active) {
            setActive(false);
        } else {
            setSeconds(interval);
            setActive(true);
        }
    }, [active, interval]);

    const setInterval = useCallback((newInterval: number) => {
        setIntervalState(newInterval);
    }, []);

    return {
        seconds,
        active,
        interval,
        start,
        stop,
        toggle,
        setInterval,
        setSeconds,
        setActive,
    };
}
