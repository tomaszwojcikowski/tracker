/**
 * useEmomTimer Hook
 *
 * Manages EMOM (Every Minute On the Minute) timer with countdown ticks,
 * auto-restart, haptic feedback, and audio cues.
 * Extracted from WorkoutPlayer for reuse across workout views.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
    /** Current round number (1-based, starts at 1 when timer starts) */
    round: number;
    /** Start the EMOM timer */
    start: () => void;
    /** Stop the EMOM timer */
    stop: () => void;
    /** Toggle the EMOM timer */
    toggle: () => void;
    /** Set the interval duration (simple number setter) */
    setIntervalDuration: (seconds: number) => void;
    /** Set seconds directly */
    setSeconds: React.Dispatch<React.SetStateAction<number>>;
    /** Set active state directly */
    setActive: React.Dispatch<React.SetStateAction<boolean>>;
    /** Set interval state directly (supports functional updates) */
    setIntervalState: React.Dispatch<React.SetStateAction<number>>;
    /** Set round directly */
    setRound: React.Dispatch<React.SetStateAction<number>>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useEmomTimer({ haptic }: UseEmomTimerOptions): UseEmomTimerReturn {
    const [seconds, setSeconds] = useState(0);
    const [active, setActive] = useState(false);
    const [round, setRound] = useState(0);
    const [interval, setIntervalState] = useState(() =>
        safeGetJSON<number>(EMOM_INTERVAL_STORAGE_KEY, DEFAULT_EMOM_INTERVAL) ?? DEFAULT_EMOM_INTERVAL
    );

    const startTimeRef = useRef<number>(0);

    // EMOM timer effect with enhanced haptics
    useEffect(() => {
        if (active) {
            const timerInterval = window.setInterval(() => {
                const now = Date.now();
                const intervalSec = Math.max(1, interval);
                const elapsed = Math.floor((now - startTimeRef.current) / 1000);

                const currentRound = Math.floor(elapsed / intervalSec) + 1;
                const remaining = intervalSec - (elapsed % intervalSec);

                setRound(prevRound => {
                    if (currentRound > prevRound) {
                        // Round completed
                        haptic.timerComplete();
                        playBeepSound();
                        return currentRound;
                    }
                    return prevRound;
                });

                setSeconds(prevSeconds => {
                    // Play tick sound for last 5 seconds (only if value changed)
                    if (remaining <= 5 && remaining >= 1 && remaining !== prevSeconds) {
                        playTickSound();
                    }
                    return remaining;
                });
            }, 1000);
            return () => clearInterval(timerInterval);
        }
    }, [active, interval, haptic]);

    // Enhanced haptic feedback at key intervals for EMOM
    useEffect(() => {
        if (!active) return;

        // EMOM warning at 10 seconds remaining - escalating pulse
        if (seconds === 10) {
            haptic.emomWarning();
        }
        // Countdown ticks for last 5 seconds
        else if (seconds <= 5 && seconds > 0) {
            haptic.countdown();
        }
    }, [active, seconds, haptic]);

    // Save interval preference when it changes
    useEffect(() => {
        safeSetJSON(EMOM_INTERVAL_STORAGE_KEY, interval);
    }, [interval]);

    const start = useCallback(() => {
        setSeconds(interval);
        setRound(1);
        setActive(true);
        startTimeRef.current = Date.now();
    }, [interval]);

    const stop = useCallback(() => {
        setActive(false);
        setRound(0);
    }, []);

    const toggle = useCallback(() => {
        if (active) {
            setActive(false);
            setRound(0);
        } else {
            setSeconds(interval);
            setRound(1);
            setActive(true);
            startTimeRef.current = Date.now();
        }
    }, [active, interval]);

    const setIntervalDuration = useCallback((newInterval: number) => {
        setIntervalState(newInterval);
    }, []);

    return {
        seconds,
        active,
        interval,
        round,
        start,
        stop,
        toggle,
        setIntervalDuration,
        setSeconds,
        setActive,
        setIntervalState,
        setRound,
    };
}
