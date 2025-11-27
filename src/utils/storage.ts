/**
 * LocalStorage Utilities
 *
 * Safe wrappers for localStorage operations with error handling.
 * These functions prevent crashes from quota exceeded, JSON parse errors,
 * or localStorage being unavailable.
 */

import type { StorageResult } from '../types';

/**
 * Safely get and parse JSON from localStorage
 * @param key - localStorage key
 * @param defaultValue - value to return if key doesn't exist or parsing fails
 * @returns parsed value or defaultValue
 */
export function safeGetJSON<T>(key: string, defaultValue: T): T;
export function safeGetJSON<T>(key: string): T | null;
export function safeGetJSON<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue ?? null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to parse JSON for key "${key}":`, error);
    return defaultValue ?? null;
  }
}

/**
 * Safely stringify and save JSON to localStorage
 * @param key - localStorage key
 * @param value - value to stringify and save
 * @returns true if successful, false otherwise
 */
export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save JSON for key "${key}":`, error);
    // Storage might be full
    return false;
  }
}

/**
 * Safely remove item from localStorage
 * @param key - localStorage key
 * @returns true if successful, false otherwise
 */
export function safeRemove(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove key "${key}":`, error);
    return false;
  }
}

/**
 * Get all localStorage keys matching a pattern
 * @param pattern - RegExp pattern to match keys
 * @returns array of matching keys
 */
export function getMatchingKeys(pattern: RegExp): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && pattern.test(key)) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.error('Failed to enumerate localStorage keys:', error);
  }
  return keys;
}

/**
 * Clear all localStorage items matching a prefix
 * @param prefix - key prefix to match
 * @returns number of items removed
 */
export function clearByPrefix(prefix: string): number {
  let count = 0;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      count++;
    });
  } catch (error) {
    console.error(`Failed to clear items with prefix "${prefix}":`, error);
  }
  return count;
}

/**
 * Get storage usage information
 * @returns object with used and available storage info
 */
export function getStorageInfo(): { used: number; available: boolean } {
  let used = 0;
  let available = true;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) ?? '';
        used += key.length + value.length;
      }
    }
    // Convert to bytes (rough estimate, each char is ~2 bytes in UTF-16)
    used *= 2;
  } catch (error) {
    available = false;
  }

  return { used, available };
}

/**
 * Type-safe storage result wrapper
 * @param key - localStorage key
 * @param operation - operation description for error messages
 * @param fn - function to execute
 * @returns StorageResult with data or error
 */
export function withStorageResult<T>(
  key: string,
  operation: string,
  fn: () => T
): StorageResult<T> {
  try {
    const data = fn();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `${operation} for "${key}" failed: ${message}` };
  }
}

// ============================================================================
// IN-PROGRESS WORKOUT DETECTION
// ============================================================================

/**
 * Workout session data stored in localStorage
 */
interface WorkoutSessionData {
  completed?: boolean;
  completedAt?: string;
  lastModified?: string;
  week?: number;
  day?: number;
  workoutNotes?: string;
  [exerciseId: string]: unknown;
}

/**
 * Information about an in-progress workout
 */
export interface InProgressWorkout {
  week: number;
  day: number;
  completedExercises: number;
  totalExercises: number;
  lastModified: Date;
  progress: number; // 0-100 percentage based on exercises
}

/**
 * Count completed sets from session data
 */
function countSetsFromSession(session: WorkoutSessionData): { completed: number; total: number } {
  let completedSets = 0;
  let totalSets = 0;

  for (const [key, value] of Object.entries(session)) {
    // Skip metadata fields
    if (['completed', 'completedAt', 'lastModified', 'week', 'day', 'workoutNotes', 'addedExercises'].includes(key)) {
      continue;
    }

    // Check if it's an exercise log entry with sets
    if (value && typeof value === 'object' && !Array.isArray(value) && 'sets' in value) {
      const sets = (value as { sets?: boolean[] }).sets;
      if (Array.isArray(sets)) {
        totalSets += sets.length;
        completedSets += sets.filter(Boolean).length;
      }
    }
  }

  return { completed: completedSets, total: totalSets };
}

/**
 * Count completed exercises from session data
 * An exercise is considered "completed" if all its sets are done
 */
function countExercisesFromSession(session: WorkoutSessionData): { completed: number; total: number } {
  let completedExercises = 0;
  let totalExercises = 0;

  for (const [key, value] of Object.entries(session)) {
    // Skip metadata fields
    if (['completed', 'completedAt', 'lastModified', 'week', 'day', 'workoutNotes', 'addedExercises'].includes(key)) {
      continue;
    }

    // Check if it's an exercise log entry with sets
    if (value && typeof value === 'object' && !Array.isArray(value) && 'sets' in value) {
      const sets = (value as { sets?: boolean[] }).sets;
      if (Array.isArray(sets) && sets.length > 0) {
        totalExercises += 1;
        // An exercise is completed when all its sets are done
        if (sets.every(Boolean)) {
          completedExercises += 1;
        }
      }
    }
  }

  return { completed: completedExercises, total: totalExercises };
}

/**
 * Get information about the most recent in-progress workout
 * @returns InProgressWorkout if one exists, null otherwise
 */
export function getInProgressWorkout(): InProgressWorkout | null {
  try {
    const sessionPattern = /^session_w(\d+)d(\d+)$/;
    let mostRecent: InProgressWorkout | null = null;
    let mostRecentTime = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const match = key.match(sessionPattern);
      if (!match) continue;

      const session = safeGetJSON<WorkoutSessionData>(key);
      if (!session || session.completed) continue;

      // Check if session has any workout data (not just empty)
      const { completed: completedSets } = countSetsFromSession(session);

      // Only consider if there's actual progress (at least one set logged)
      if (completedSets === 0) continue;

      // Count exercises for progress display
      const { completed: completedExercises, total: totalExercises } = countExercisesFromSession(session);

      const lastModified = session.lastModified ? new Date(session.lastModified).getTime() : 0;

      if (lastModified > mostRecentTime) {
        mostRecentTime = lastModified;
        mostRecent = {
          week: parseInt(match[1], 10),
          day: parseInt(match[2], 10),
          completedExercises,
          totalExercises,
          lastModified: new Date(lastModified),
          progress: totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0,
        };
      }
    }

    return mostRecent;
  } catch (error) {
    console.error('Failed to get in-progress workout:', error);
    return null;
  }
}

/**
 * Check if a specific workout session is in progress
 * @param week - week number
 * @param day - day number
 * @returns true if the workout has started but not completed
 */
export function isWorkoutInProgress(week: number, day: number): boolean {
  const key = `session_w${week}d${day}`;
  const session = safeGetJSON<WorkoutSessionData>(key);

  if (!session || session.completed) return false;

  const { completed: completedSets } = countSetsFromSession(session);
  return completedSets > 0;
}

/**
 * Get progress information for a specific workout
 * @param week - week number
 * @param day - day number
 * @returns progress info or null if workout hasn't started
 */
export function getWorkoutProgress(week: number, day: number): { completedExercises: number; totalExercises: number; progress: number } | null {
  const key = `session_w${week}d${day}`;
  const session = safeGetJSON<WorkoutSessionData>(key);

  if (!session) return null;

  const { completed: completedSets } = countSetsFromSession(session);

  if (completedSets === 0) return null;

  const { completed: completedExercises, total: totalExercises } = countExercisesFromSession(session);

  return {
    completedExercises,
    totalExercises,
    progress: totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0,
  };
}
