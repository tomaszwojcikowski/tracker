/**
 * LocalStorage Utilities
 *
 * Safe wrappers for localStorage operations with error handling.
 * These functions prevent crashes from quota exceeded, JSON parse errors,
 * or localStorage being unavailable.
 * 
 * Program-Scoped Storage:
 * Functions like getInProgressWorkout, isWorkoutInProgress, getWorkoutProgress,
 * and hasWorkoutData now use program-scoped namespaced keys to isolate
 * data between different workout programs.
 */

import type { StorageResult } from '../types';
import { getWorkoutForDay } from '../data/programData';
import { getSessionKey as getNamespacedSessionKey, parseSessionKey, getActiveProgramId, NAMESPACE_PREFIX, NAMESPACE_SEPARATOR } from '../services/storageNamespace';

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
  completedSets: number;
  totalSets: number;
  completedExercises: number;
  totalExercises: number;
  lastModified: Date;
  progress: number; // 0-100 percentage based on completed sets
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
 * Get total sets and exercises for a workout day from the workout plan
 * @param week - week number
 * @param day - day number
 * @returns object with totalSets and totalExercises from the workout plan
 */
function getWorkoutTotalsFromPlan(week: number, day: number): { totalSets: number; totalExercises: number } {
  try {
    const workout = getWorkoutForDay(week, day);
    let totalSets = 0;
    let totalExercises = 0;

    for (const section of workout.sections) {
      for (const exercise of section.exercises) {
        totalExercises += 1;
        totalSets += exercise.sets;
      }
    }

    return { totalSets, totalExercises };
  } catch (error) {
    // Log with context for debugging - this can happen if workout plan data is not loaded
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to get workout totals for week ${week} day ${day}: ${errorMessage}`);
    // Return zeros as fallback - progress will show 0% which is a safe default
    return { totalSets: 0, totalExercises: 0 };
  }
}

/**
 * Get information about the most recent in-progress workout
 * Searches for in-progress workouts scoped to the active program
 * @returns InProgressWorkout if one exists, null otherwise
 */
export function getInProgressWorkout(): InProgressWorkout | null {
  try {
    // Pattern to match namespaced session keys: p:{programId}:session_w{week}d{day}
    const programId = getActiveProgramId();
    const prefix = `${NAMESPACE_PREFIX}${programId}${NAMESPACE_SEPARATOR}`;
    
    let mostRecent: InProgressWorkout | null = null;
    let mostRecentTime = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Check if key belongs to current program's namespace
      if (!key.startsWith(prefix)) continue;

      // Parse session info from the key
      const sessionInfo = parseSessionKey(key);
      if (!sessionInfo) continue;

      const session = safeGetJSON<WorkoutSessionData>(key);
      if (!session || session.completed) continue;

      const { week, day } = sessionInfo;

      // Get completed sets from session (what user has logged)
      const { completed: completedSets } = countSetsFromSession(session);

      // Only consider if there's actual progress (at least one set logged)
      if (completedSets === 0) continue;

      // Count completed exercises from session
      const { completed: completedExercises } = countExercisesFromSession(session);

      // Get total sets and exercises from workout plan (all exercises in the day)
      const { totalSets, totalExercises } = getWorkoutTotalsFromPlan(week, day);

      const lastModified = session.lastModified ? new Date(session.lastModified).getTime() : 0;

      if (lastModified > mostRecentTime) {
        mostRecentTime = lastModified;
        mostRecent = {
          week,
          day,
          completedSets,
          totalSets,
          completedExercises,
          totalExercises,
          lastModified: new Date(lastModified),
          // Progress is based on sets completed, not exercises
          progress: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
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
 * Uses program-scoped namespaced key
 * @param week - week number
 * @param day - day number
 * @returns true if the workout has started but not completed
 */
export function isWorkoutInProgress(week: number, day: number): boolean {
  const key = getNamespacedSessionKey(week, day);
  const session = safeGetJSON<WorkoutSessionData>(key);

  if (!session || session.completed) return false;

  const { completed: completedSets } = countSetsFromSession(session);
  return completedSets > 0;
}

/**
 * Get progress information for a specific workout
 * Uses program-scoped namespaced key
 * @param week - week number
 * @param day - day number
 * @returns progress info or null if workout hasn't started
 */
export function getWorkoutProgress(week: number, day: number): { completedSets: number; totalSets: number; completedExercises: number; totalExercises: number; progress: number } | null {
  const key = getNamespacedSessionKey(week, day);
  const session = safeGetJSON<WorkoutSessionData>(key);

  if (!session) return null;

  // Get completed sets/exercises from session (what user has logged)
  const { completed: completedSets } = countSetsFromSession(session);

  if (completedSets === 0) return null;

  const { completed: completedExercises } = countExercisesFromSession(session);

  // Get total sets and exercises from workout plan (all exercises in the day)
  const { totalSets, totalExercises } = getWorkoutTotalsFromPlan(week, day);

  return {
    completedSets,
    totalSets,
    completedExercises,
    totalExercises,
    // Progress is based on sets completed, not exercises
    progress: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
  };
}

/**
 * Check if a workout session has any existing data (even if not in progress)
 * Uses program-scoped namespaced key
 * @param week - week number
 * @param day - day number
 * @returns true if any data exists for this session
 */
export function hasWorkoutData(week: number, day: number): boolean {
  const key = getNamespacedSessionKey(week, day);
  const session = safeGetJSON<WorkoutSessionData>(key);
  
  if (!session) return false;
  if (session.completed) return true;
  
  const { total } = countSetsFromSession(session);
  return total > 0;
}
