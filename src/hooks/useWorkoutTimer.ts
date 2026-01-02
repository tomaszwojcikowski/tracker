/**
 * useWorkoutTimer Hook
 *
 * Manages workout timer state with start, pause, resume, and stop functionality.
 * The timer counts up from 0 with a maximum of 3 hours (10,800 seconds).
 * Timer state is persisted to localStorage for resuming workouts.
 * Timer state is also synced to WorkoutSessionData for cloud sync.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { safeGetJSON, safeRemove, safeSetJSON } from '../utils/storage';
import { getNamespacedKey, getSessionKey } from '../services/storageNamespace';
import { syncService } from '../services/SyncService';
import type { WorkoutSessionData } from '../types/workout';

// Maximum timer duration: 3 hours in seconds
export const MAX_TIMER_SECONDS = 3 * 60 * 60; // 10,800 seconds

/**
 * Timer state stored in localStorage
 */
export interface WorkoutTimerState {
  /** Elapsed time in seconds */
  elapsedSeconds: number;
  /** Whether timer is currently running */
  isRunning: boolean;
  /** Timestamp when timer was started or resumed (for accurate time tracking) */
  startedAt: number | null;
  /** Week number for the workout */
  week: number;
  /** Day number for the workout */
  day: number;
}

/**
 * Return type for useWorkoutTimer hook
 */
export interface WorkoutTimerReturn {
  /** Current elapsed time in seconds */
  elapsedSeconds: number;
  /** Whether timer is currently running */
  isRunning: boolean;
  /** Start or resume the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Toggle between running and paused */
  toggle: () => void;
  /** Stop the timer and return final duration */
  stop: () => number;
  /** Reset the timer to zero */
  reset: () => void;
  /** Formatted time string (MM:SS or HH:MM:SS) */
  formattedTime: string;
}

/**
 * Get localStorage key for timer state
 */
function getLegacyTimerStorageKey(week: number, day: number): string {
  return `workout_timer_w${week}d${day}`;
}

function getTimerStorageKey(week: number, day: number): string {
  return getNamespacedKey(getLegacyTimerStorageKey(week, day));
}

interface WorkoutTimerKeys {
  timerStorageKey: string;
  legacyTimerStorageKey: string;
  sessionKey: string;
}

function getTimerKeys(week: number, day: number): WorkoutTimerKeys {
  return {
    timerStorageKey: getTimerStorageKey(week, day),
    legacyTimerStorageKey: getLegacyTimerStorageKey(week, day),
    sessionKey: getSessionKey(week, day),
  };
}

/**
 * Format seconds into a human-readable time string
 * @param seconds - Total seconds to format
 * @returns Formatted string (MM:SS or HH:MM:SS if >= 1 hour)
 */
export function formatTimerTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Hook for managing workout timer state
 *
 * @param week - Week number for the workout
 * @param day - Day number for the workout
 * @param autoStart - Whether to auto-start the timer on mount (default: true)
 * @returns Timer state and control functions
 */
export function useWorkoutTimer(
  week: number,
  day: number,
  autoStart: boolean = true
): WorkoutTimerReturn {
  const keysRef = useRef<WorkoutTimerKeys>(getTimerKeys(week, day));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to load saved timer state from localStorage or session data
  const loadSavedState = useCallback((keys: WorkoutTimerKeys): WorkoutTimerState | null => {
    // First try the dedicated, program-scoped timer storage key
    const saved = safeGetJSON<WorkoutTimerState>(keys.timerStorageKey);
    if (saved && saved.week === week && saved.day === day) {
      return saved;
    }

    // Backward compatibility: fall back to legacy (non-namespaced) key
    const legacySaved = safeGetJSON<WorkoutTimerState>(keys.legacyTimerStorageKey);
    if (legacySaved && legacySaved.week === week && legacySaved.day === day) {
      // Best-effort migration to namespaced key
      safeSetJSON(keys.timerStorageKey, legacySaved);
      safeRemove(keys.legacyTimerStorageKey);
      return legacySaved;
    }

    // Fallback to session data (for cloud-synced timer state)
    const sessionData = safeGetJSON<WorkoutSessionData>(keys.sessionKey);
    if (sessionData?.timerState) {
      return {
        elapsedSeconds: sessionData.timerState.elapsedSeconds,
        isRunning: sessionData.timerState.isRunning,
        startedAt: sessionData.timerState.startedAt,
        week,
        day,
      };
    }

    return null;
  }, [day, week]);

  // Load initial state from localStorage
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const saved = loadSavedState(keysRef.current);
    if (saved) {
      // If timer was running when we left, calculate elapsed time
      if (saved.isRunning && saved.startedAt) {
        const additionalSeconds = Math.floor((Date.now() - saved.startedAt) / 1000);
        return Math.min(saved.elapsedSeconds + additionalSeconds, MAX_TIMER_SECONDS);
      }
      return saved.elapsedSeconds;
    }
    return 0;
  });

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    const saved = loadSavedState(keysRef.current);
    if (saved) {
      return saved.isRunning;
    }
    return autoStart;
  });

  const [startedAt, setStartedAt] = useState<number | null>(() => {
    if (autoStart) {
      const saved = loadSavedState(keysRef.current);
      if (saved && saved.isRunning) {
        return saved.startedAt;
      }
      return Date.now();
    }
    return null;
  });

  // Persist state to localStorage
  const persistState = useCallback(
    (elapsed: number, running: boolean, started: number | null) => {
      const keys = keysRef.current;
      const state: WorkoutTimerState = {
        elapsedSeconds: elapsed,
        isRunning: running,
        // When running, store a fresh timestamp so reloads only add missing time
        startedAt: running ? Date.now() : started,
        week,
        day,
      };
      safeSetJSON(keys.timerStorageKey, state);

      // Also save timer state to session data for cloud sync
      const sessionData = safeGetJSON<WorkoutSessionData>(keys.sessionKey, {});
      const updatedSessionData: WorkoutSessionData = {
        ...sessionData,
        timerState: {
          elapsedSeconds: elapsed,
          isRunning: running,
          startedAt: running ? Date.now() : started,
        },
        lastModified: new Date().toISOString(),
      };
      safeSetJSON(keys.sessionKey, updatedSessionData);

      // Trigger cloud sync (debounced)
      syncService.scheduleSync();
    },
    [day, week]
  );

  // Keep timer scoped to workout mode: start when entering, pause when leaving.
  // We intentionally only depend on autoStart to avoid re-triggering when isRunning/elapsedSeconds change.
  useEffect(() => {
    if (autoStart) {
      if (!isRunning && elapsedSeconds < MAX_TIMER_SECONDS) {
        const now = Date.now();
        setIsRunning(true);
        setStartedAt(now);
      }
      return;
    }

    if (isRunning) {
      setIsRunning(false);
      setStartedAt(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // Reload timer state when switching to a different week/day.
  useEffect(() => {
    // Stop any existing interval immediately; the next effect run will re-create if needed.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const nextKeys = getTimerKeys(week, day);
    keysRef.current = nextKeys;

    const saved = loadSavedState(nextKeys);
    const nextElapsed = (() => {
      if (!saved) return 0;
      if (saved.isRunning && saved.startedAt) {
        const additionalSeconds = Math.floor((Date.now() - saved.startedAt) / 1000);
        return Math.min(saved.elapsedSeconds + additionalSeconds, MAX_TIMER_SECONDS);
      }
      return saved.elapsedSeconds;
    })();

    setElapsedSeconds(nextElapsed);

    if (autoStart) {
      setIsRunning(saved?.isRunning ?? true);
      setStartedAt(saved?.isRunning ? saved.startedAt : Date.now());
    } else {
      setIsRunning(false);
      setStartedAt(null);
    }
  }, [week, day, autoStart, loadSavedState]);

  // Timer tick effect
  useEffect(() => {
    if (isRunning && elapsedSeconds < MAX_TIMER_SECONDS) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_TIMER_SECONDS) {
            // Stop at max time
            setIsRunning(false);
            setStartedAt(null);
            return MAX_TIMER_SECONDS;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, elapsedSeconds]);

  // Persist state on changes
  useEffect(() => {
    persistState(elapsedSeconds, isRunning, startedAt);
  }, [elapsedSeconds, isRunning, startedAt, persistState]);

  const start = useCallback(() => {
    if (!isRunning && elapsedSeconds < MAX_TIMER_SECONDS) {
      const now = Date.now();
      setIsRunning(true);
      setStartedAt(now);
    }
  }, [isRunning, elapsedSeconds]);

  const pause = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      setStartedAt(null);
    }
  }, [isRunning]);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  const stop = useCallback((): number => {
    setIsRunning(false);
    setStartedAt(null);
    return elapsedSeconds;
  }, [elapsedSeconds]);

  const reset = useCallback(() => {
    setElapsedSeconds(0);
    setIsRunning(false);
    setStartedAt(null);
  }, []);

  const formattedTime = formatTimerTime(elapsedSeconds);

  return {
    elapsedSeconds,
    isRunning,
    start,
    pause,
    toggle,
    stop,
    reset,
    formattedTime,
  };
}
