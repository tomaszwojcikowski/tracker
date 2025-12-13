/**
 * useDensityTimer Hook
 *
 * Manages density timer - a countdown timer for density exercises where you
 * complete a target number of reps within a time limit (e.g., 30 reps in 10 minutes).
 * Includes countdown ticks, haptic feedback, and audio cues.
 */

import { useState, useEffect, useCallback } from 'react';
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

    // Countdown timer effect with enhanced haptics
    useEffect(() => {
        if (active && seconds > 0) {
            const timerInterval = window.setInterval(() => {
                setSeconds((s) => {
                    const newValue = s - 1;
                    // Play tick sound for last 10 seconds
                    if (newValue <= 10 && newValue >= 1) {
                        playTickSound();
                    }
                    return newValue;
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

    // Enhanced haptic feedback at key intervals
    useEffect(() => {
        if (!active) return;

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
        setSeconds(minutes * 60);
        setActive(true);
    }, []);

    const stop = useCallback(() => {
        setActive(false);
    }, []);

    const toggle = useCallback((minutes: number) => {
        if (active) {
            setActive(false);
        } else {
            setTimeMinutes(minutes);
            setSeconds(minutes * 60);
            setActive(true);
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
        setSeconds,
        setActive,
    };
}
