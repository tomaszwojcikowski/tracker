/**
 * Firebase Sync Utilities
 *
 * Functions for syncing data between local storage and Firebase.
 * All sync operations now use program-scoped namespaced keys.
 */

import { safeGetJSON, safeSetJSON } from './storage';
import type { WeekNumber, TrainingDay, ExerciseHistory, CloudData as TypesCloudData } from '../types';
import {
    getExerciseHistoryKey,
    getSessionKey,
    getGlobalHistoryKey,
} from '../services/storageNamespace';

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
    /** Active timer state for in-progress workouts (synced to cloud) */
    timerState?: {
        /** Elapsed time in seconds */
        elapsedSeconds: number;
        /** Whether timer is currently running */
        isRunning: boolean;
        /** Timestamp when timer was started or resumed (for accurate time tracking) */
        startedAt: number | null;
    };
}

/**
 * Exercise summary entry within a global history entry
 */
export interface ExerciseSummaryEntry {
    name: string;
    prescription: string;
    completedSets: number;
    totalSets: number;
    weight?: string | number | null;
    rpe?: Record<string, string>;
    isBodyweight?: boolean;
}

/**
 * Global history entry for workout timeline
 */
export interface GlobalHistoryEntry {
    date: string;
    week: number;
    day: number;
    title?: string;
    exercises?: ExerciseSummaryEntry[];
    workoutNotes?: string | null;
    isEmptyWorkout?: boolean;
    durationSeconds?: number;
}

/**
 * Cloud data structure for sync
 */
export interface CloudData {
    sessions?: Record<SessionKey, SessionData>;
    exercise_history?: ExerciseHistory;
    global_history?: GlobalHistoryEntry[];
    settings?: Record<string, unknown>;
    lastSyncTime?: string;
}

/**
 * Local data structure for sync
 */
export interface LocalData {
    exercise_history: ExerciseHistory;
    global_history: GlobalHistoryEntry[];
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
 * Storage key for exercise history (base key - use getExerciseHistoryKey() for namespaced version)
 * @deprecated Use getExerciseHistoryKey() from storageNamespace service for program-scoped access
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
 * This includes workout sessions, exercise history, and global history for the active program.
 *
 * Note: This function iterates through all possible workout sessions (84 total).
 * This is intentional and not a performance issue because:
 * 1. It's only called on login and manual sync (infrequent operations)
 * 2. Most sessions are empty and filtered out quickly
 * 3. localStorage access is fast (synchronous, in-memory)
 * 4. The actual data transfer to Firebase is the bottleneck, not this collection
 */
export function getAllLocalData(): LocalData {
    const exerciseHistoryStorageKey = getExerciseHistoryKey();
    const globalHistoryStorageKey = getGlobalHistoryKey();
    const data: LocalData = {
        exercise_history: safeGetJSON<ExerciseHistory>(exerciseHistoryStorageKey, {}),
        global_history: safeGetJSON<GlobalHistoryEntry[]>(globalHistoryStorageKey, []),
        sessions: {} as Record<SessionKey, SessionData>,
    };

    // Collect all workout session data (21 weeks × 4 days = 84 sessions max)
    // Only non-empty sessions are included in the sync
    // Uses namespaced keys for program isolation
    for (let week = 1; week <= 21; week++) {
        for (const day of TRAINING_DAYS) {
            const namespacedKey = getSessionKey(week, day);
            const baseKey = getBaseSessionKey(week as WeekNumber, day);
            const sessionData = safeGetJSON<SessionData | null>(namespacedKey, null);
            if (sessionData && Object.keys(sessionData).length > 0) {
                // Store with base key in the data structure for Firebase compatibility
                data.sessions[baseKey] = sessionData;
            }
        }
    }

    return data;
}

/**
 * Convert LocalData to CloudData format for Firebase sync
 * This handles the naming convention differences between the two interfaces
 * @param localData - Data collected from localStorage
 * @returns CloudData formatted for Firebase (compatible with firebase-service types)
 */
export function localDataToCloudData(localData: LocalData): TypesCloudData {
    return {
        sessions: localData.sessions as TypesCloudData['sessions'],
        exercise_history: localData.exercise_history,
        global_history: localData.global_history,
        lastSyncTime: new Date().toISOString(),
    };
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
 * All data is stored using program-scoped namespaced keys.
 *
 * @param cloudData - Data from Firebase
 */
export function mergeCloudData(cloudData: CloudData | null | undefined): void {
    if (!cloudData) return;

    console.log('Merging cloud data with local data');

    // Merge exercise history (always use cloud history) - use namespaced key
    if (cloudData.exercise_history) {
        const exerciseHistoryStorageKey = getExerciseHistoryKey();
        safeSetJSON(exerciseHistoryStorageKey, cloudData.exercise_history);
    }

    // Merge global history - merge entries based on date to avoid duplicates
    if (cloudData.global_history && Array.isArray(cloudData.global_history)) {
        const globalHistoryStorageKey = getGlobalHistoryKey();
        const localGlobalHistory = safeGetJSON<GlobalHistoryEntry[]>(globalHistoryStorageKey, []);
        
        // Create a Set of existing entry keys (date + week + day) for quick lookup
        const existingEntryKeys = new Set(
            localGlobalHistory.map(entry => `${entry.date}-${entry.week}-${entry.day}`)
        );
        
        // Add cloud entries that don't exist locally
        const mergedHistory = [...localGlobalHistory];
        cloudData.global_history.forEach(cloudEntry => {
            const entryKey = `${cloudEntry.date}-${cloudEntry.week}-${cloudEntry.day}`;
            if (!existingEntryKeys.has(entryKey)) {
                mergedHistory.push(cloudEntry);
            }
        });
        
        // Sort by date (newest first would be consistent with how history is displayed)
        mergedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        safeSetJSON(globalHistoryStorageKey, mergedHistory);
        console.log(`Merged global history: ${localGlobalHistory.length} local + ${cloudData.global_history.length} cloud = ${mergedHistory.length} total`);
    }

    // Merge workout sessions based on timestamps
    // Cloud data uses base keys (session_w1d1), we convert to namespaced keys
    if (cloudData.sessions) {
        Object.keys(cloudData.sessions).forEach(keyString => {
            const baseKey = keyString as SessionKey;
            const cloudSession = cloudData.sessions![baseKey];
            
            // Parse week and day from base key
            const match = baseKey.match(/^session_w(\d+)d(\d+)$/);
            if (!match) {
                console.warn(`Invalid session key format: ${baseKey}`);
                return;
            }
            const week = parseInt(match[1], 10);
            const day = parseInt(match[2], 10);
            
            // Get the namespaced key for the current program
            const namespacedKey = getSessionKey(week, day);
            const localSession = safeGetJSON<SessionData | null>(namespacedKey, null);

            // If no local session exists, use cloud data
            if (!localSession) {
                console.log(`No local session for ${namespacedKey}, using cloud data`);
                safeSetJSON(namespacedKey, cloudSession);
                syncTimerStateFromCloud(cloudSession, week, day);
                return;
            }

            // Compare timestamps to determine which version is newer
            const cloudTimestamp = cloudSession.lastModified;
            const localTimestamp = localSession.lastModified;

            // If either timestamp is missing, use cloud data (backward compatibility)
            if (!cloudTimestamp || !localTimestamp) {
                console.log(
                    `Missing timestamp for ${namespacedKey}, using cloud data (cloud: ${cloudTimestamp || 'none'}, local: ${localTimestamp || 'none'})`
                );
                safeSetJSON(namespacedKey, cloudSession);
                syncTimerStateFromCloud(cloudSession, week, day);
                return;
            }

            // Compare timestamps and keep the newer version
            const cloudDate = new Date(cloudTimestamp);
            const localDate = new Date(localTimestamp);

            // Check for invalid dates (NaN) - if either is invalid, use cloud data
            if (isNaN(cloudDate.getTime()) || isNaN(localDate.getTime())) {
                console.log(
                    `Invalid timestamp detected for ${namespacedKey}, using cloud data (cloud: ${cloudTimestamp}, local: ${localTimestamp})`
                );
                safeSetJSON(namespacedKey, cloudSession);
                syncTimerStateFromCloud(cloudSession, week, day);
                return;
            }

            if (cloudDate > localDate) {
                // Cloud data is newer, use it
                console.log(
                    `Using cloud data for ${namespacedKey} (cloud: ${cloudTimestamp}, local: ${localTimestamp})`
                );
                safeSetJSON(namespacedKey, cloudSession);
                syncTimerStateFromCloud(cloudSession, week, day);
            } else {
                // Local data is newer or equal, keep it
                console.log(
                    `Keeping local data for ${namespacedKey} (cloud: ${cloudTimestamp}, local: ${localTimestamp})`
                );
            }
        });
    }

    console.log('Cloud data merged successfully');
}

/**
 * Helper function to sync timer state from cloud session to dedicated timer storage
 * @param cloudSession - Cloud session data with potential timer state
 * @param week - Week number
 * @param day - Day number
 */
function syncTimerStateFromCloud(cloudSession: SessionData, week: number, day: number): void {
    if (cloudSession.timerState) {
        const timerKey = `workout_timer_w${week}d${day}`;
        const timerState = {
            elapsedSeconds: cloudSession.timerState.elapsedSeconds,
            isRunning: cloudSession.timerState.isRunning,
            startedAt: cloudSession.timerState.startedAt,
            week,
            day,
        };
        safeSetJSON(timerKey, timerState);
        console.log(`Synced timer state for ${timerKey} from cloud`);
    }
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
 * Generate a base session key (without namespace prefix)
 * @deprecated Use getSessionKey from storageNamespace for namespaced keys
 * @example
 * // Instead of:
 * const key = getBaseSessionKey(1, 1); // 'session_w1d1'
 * 
 * // Use for namespaced storage:
 * import { getSessionKey } from '../services/storageNamespace';
 * const key = getSessionKey(1, 1); // 'p:program-id:session_w1d1'
 */
export function getBaseSessionKey(week: WeekNumber, day: TrainingDay): SessionKey {
    return `session_w${week}d${day}`;
}

/**
 * Get session data for a given week and day
 * Uses program-scoped namespaced key
 */
export function getSessionData(week: WeekNumber, day: TrainingDay): SessionData | null {
    const namespacedKey = getSessionKey(week, day);
    return safeGetJSON<SessionData | null>(namespacedKey, null);
}

/**
 * Save session data for a given week and day
 * Uses program-scoped namespaced key
 */
export function saveSessionData(week: WeekNumber, day: TrainingDay, data: SessionData): boolean {
    const namespacedKey = getSessionKey(week, day);
    return safeSetJSON(namespacedKey, data);
}
