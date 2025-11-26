/**
 * Firebase Sync Utilities
 *
 * Functions for syncing data between local storage and Firebase.
 */

import { safeGetJSON, safeSetJSON } from './storage';
import type { WeekNumber, TrainingDay, ExerciseHistory } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Session key format
 */
export type SessionKey = `session_w${number}d${number}`;

/**
 * Session data stored in localStorage
 */
export interface SessionData {
    week: WeekNumber;
    day: TrainingDay;
    completedSets: Record<string, boolean[]>;
    weights: Record<string, string | number>;
    rpeData: Record<string, Record<number, string>>;
    notes: Record<string, string>;
    lastModified: string;
}

/**
 * Cloud data structure for sync
 */
export interface CloudData {
    sessions?: Record<SessionKey, SessionData>;
    exercise_history?: ExerciseHistory;
    settings?: Record<string, unknown>;
    lastSyncTime?: string;
}

/**
 * Local data structure for sync
 */
export interface LocalData {
    exercise_history: ExerciseHistory;
    sessions: Record<SessionKey, SessionData>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Storage key for Firebase sync enabled setting
 */
export const FIREBASE_SYNC_ENABLED_KEY = 'firebase_sync_enabled';

/**
 * Storage key for exercise history
 */
export const EXERCISE_HISTORY_KEY = 'exercise_history';

/**
 * Valid training days (Day 4 is rest)
 */
const TRAINING_DAYS: TrainingDay[] = [1, 2, 3, 5];

// ============================================================================
// DATA COLLECTION
// ============================================================================

/**
 * Get all local data that should be synced to Firebase
 *
 * This includes workout sessions and exercise history.
 *
 * Note: This function iterates through all possible workout sessions (84 total).
 * This is intentional and not a performance issue because:
 * 1. It's only called on login and manual sync (infrequent operations)
 * 2. Most sessions are empty and filtered out quickly
 * 3. localStorage access is fast (synchronous, in-memory)
 * 4. The actual data transfer to Firebase is the bottleneck, not this collection
 */
export function getAllLocalData(): LocalData {
    const data: LocalData = {
        exercise_history: safeGetJSON<ExerciseHistory>(EXERCISE_HISTORY_KEY, {}),
        sessions: {} as Record<SessionKey, SessionData>,
    };

    // Collect all workout session data (21 weeks × 4 days = 84 sessions max)
    // Only non-empty sessions are included in the sync
    for (let week = 1; week <= 21; week++) {
        for (const day of TRAINING_DAYS) {
            const key = `session_w${week}d${day}` as SessionKey;
            const sessionData = safeGetJSON<SessionData | null>(key, null);
            if (sessionData && Object.keys(sessionData).length > 0) {
                data.sessions[key] = sessionData;
            }
        }
    }

    return data;
}

// ============================================================================
// DATA MERGING
// ============================================================================

/**
 * Merge cloud data with local data based on timestamps
 *
 * For workout sessions, this function compares the `lastModified` timestamp
 * of local and cloud versions, keeping the newer version.
 *
 * Fallback behavior (in order of precedence):
 * 1. If no local session exists: use cloud data
 * 2. If either timestamp is missing: use cloud data (backward compatibility)
 * 3. If either timestamp is invalid (NaN): use cloud data
 * 4. Otherwise: compare timestamps and keep the newer version
 *
 * Note: Exercise history always uses cloud data (no timestamp comparison)
 *
 * @param cloudData - Data from Firebase
 */
export function mergeCloudData(cloudData: CloudData | null | undefined): void {
    if (!cloudData) return;

    console.log('Merging cloud data with local data');

    // Merge exercise history (always use cloud history)
    if (cloudData.exercise_history) {
        safeSetJSON(EXERCISE_HISTORY_KEY, cloudData.exercise_history);
    }

    // Merge workout sessions based on timestamps
    if (cloudData.sessions) {
        Object.keys(cloudData.sessions).forEach(keyString => {
            const key = keyString as SessionKey;
            const cloudSession = cloudData.sessions![key];
            const localSession = safeGetJSON<SessionData | null>(key, null);

            // If no local session exists, use cloud data
            if (!localSession) {
                console.log(`No local session for ${key}, using cloud data`);
                safeSetJSON(key, cloudSession);
                return;
            }

            // Compare timestamps to determine which version is newer
            const cloudTimestamp = cloudSession.lastModified;
            const localTimestamp = localSession.lastModified;

            // If either timestamp is missing, use cloud data (backward compatibility)
            if (!cloudTimestamp || !localTimestamp) {
                console.log(
                    `Missing timestamp for ${key}, using cloud data (cloud: ${cloudTimestamp || 'none'}, local: ${localTimestamp || 'none'})`
                );
                safeSetJSON(key, cloudSession);
                return;
            }

            // Compare timestamps and keep the newer version
            const cloudDate = new Date(cloudTimestamp);
            const localDate = new Date(localTimestamp);

            // Check for invalid dates (NaN) - if either is invalid, use cloud data
            if (isNaN(cloudDate.getTime()) || isNaN(localDate.getTime())) {
                console.log(
                    `Invalid timestamp detected for ${key}, using cloud data (cloud: ${cloudTimestamp}, local: ${localTimestamp})`
                );
                safeSetJSON(key, cloudSession);
                return;
            }

            if (cloudDate > localDate) {
                // Cloud data is newer, use it
                console.log(
                    `Using cloud data for ${key} (cloud: ${cloudTimestamp}, local: ${localTimestamp})`
                );
                safeSetJSON(key, cloudSession);
            } else {
                // Local data is newer or equal, keep it
                console.log(
                    `Keeping local data for ${key} (cloud: ${cloudTimestamp}, local: ${localTimestamp})`
                );
            }
        });
    }

    console.log('Cloud data merged successfully');
}

// ============================================================================
// SYNC STATUS
// ============================================================================

/**
 * Check if Firebase sync is enabled
 */
export function isSyncEnabled(): boolean {
    return safeGetJSON<boolean>(FIREBASE_SYNC_ENABLED_KEY, false);
}

/**
 * Set Firebase sync enabled status
 */
export function setSyncEnabled(enabled: boolean): void {
    safeSetJSON(FIREBASE_SYNC_ENABLED_KEY, enabled);
}

/**
 * Generate a session key for a given week and day
 */
export function getSessionKey(week: WeekNumber, day: TrainingDay): SessionKey {
    return `session_w${week}d${day}`;
}

/**
 * Get session data for a given week and day
 */
export function getSessionData(week: WeekNumber, day: TrainingDay): SessionData | null {
    const key = getSessionKey(week, day);
    return safeGetJSON<SessionData | null>(key, null);
}

/**
 * Save session data for a given week and day
 */
export function saveSessionData(week: WeekNumber, day: TrainingDay, data: SessionData): boolean {
    const key = getSessionKey(week, day);
    return safeSetJSON(key, data);
}
