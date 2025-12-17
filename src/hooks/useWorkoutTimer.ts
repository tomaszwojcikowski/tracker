/**
 * useWorkoutTimer Hook
 *
 * Manages workout timer state with start, pause, resume, and stop functionality.
 * The timer counts up from 0 with a maximum of 3 hours (10,800 seconds).
 * Timer state is persisted to localStorage for resuming workouts.
 * Timer state is also synced to WorkoutSessionData for cloud sync.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { safeGetJSON, safeSetJSON } from '../utils/storage';
import { getSessionKey } from '../services/storageNamespace';
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
function getTimerStorageKey(week: number, day: number): string {
  return `workout_timer_w${week}d${day}`;
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
  const storageKey = getTimerStorageKey(week, day);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to load saved timer state from localStorage or session data
  const loadSavedState = (): WorkoutTimerState | null => {
    // First try the dedicated timer storage key
    const saved = safeGetJSON<WorkoutTimerState>(storageKey);
    if (saved && saved.week === week && saved.day === day) {
      return saved;
    }
    
    // Fallback to session data (for cloud-synced timer state)
    const sessionKey = getSessionKey(week, day);
    const sessionData = safeGetJSON<WorkoutSessionData>(sessionKey);
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
  };

  // Load initial state from localStorage
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const saved = loadSavedState();
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
    const saved = loadSavedState();
    if (saved) {
      return saved.isRunning;
    }
    return autoStart;
  });

  const [startedAt, setStartedAt] = useState<number | null>(() => {
    if (autoStart) {
      const saved = loadSavedState();
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
      const state: WorkoutTimerState = {
        elapsedSeconds: elapsed,
        isRunning: running,
        startedAt: started,
        week,
        day,
      };
      safeSetJSON(storageKey, state);
      
      // Also save timer state to session data for cloud sync
      const sessionKey = getSessionKey(week, day);
      const sessionData = safeGetJSON<WorkoutSessionData>(sessionKey, {});
      const updatedSessionData: WorkoutSessionData = {
        ...sessionData,
        timerState: {
          elapsedSeconds: elapsed,
          isRunning: running,
          startedAt: started,
        },
        lastModified: new Date().toISOString(),
      };
      safeSetJSON(sessionKey, updatedSessionData);
      
      // Trigger cloud sync (debounced)
      syncService.scheduleSync();
    },
    [storageKey, week, day]
  );

  // Auto-start timer when autoStart becomes true (e.g., entering workout mode)
  // We intentionally only depend on autoStart to avoid re-triggering when isRunning/elapsedSeconds change
  useEffect(() => {
    if (autoStart && !isRunning && elapsedSeconds < MAX_TIMER_SECONDS) {
      const now = Date.now();
      setIsRunning(true);
      setStartedAt(now);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

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
