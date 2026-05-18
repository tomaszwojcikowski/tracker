/**
 * Storage Namespace Service
 *
 * Provides program-scoped localStorage keys to isolate data between programs.
 * This ensures that logs, history, and progress are recorded uniquely per program.
 *
 * Storage Key Format:
 * - Legacy (global): `exercise_history`, `session_w1d1`
 * - Namespaced: `p:{programId}:exercise_history`, `p:{programId}:session_w1d1`
 *
 * The namespace prefix `p:{programId}:` ensures:
 * 1. No cross-program contamination
 * 2. Clear identification of program-specific data
 * 3. Easy migration of legacy data
 */

import { getProgramRegistry, DEFAULT_PROGRAM_ID } from './programRegistry';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Prefix for namespaced storage keys */
export const NAMESPACE_PREFIX = 'p:';

/** Separator between namespace parts */
export const NAMESPACE_SEPARATOR = ':';

/**
 * Storage keys that should be namespaced per program.
 * These keys store program-specific data that should be isolated.
 */
export const NAMESPACED_KEYS = [
  'exercise_history',
  'global_history',
  // Session keys are matched by pattern, not exact match
] as const;

/**
 * Pattern for session storage keys that should be namespaced
 */
export const SESSION_KEY_PATTERN = /^session_w\d+d\d+$/;
export const EMPTY_SESSION_PATTERN = /^session_empty_\d+$/;

/**
 * Storage keys that should NOT be namespaced (global settings)
 */
export const GLOBAL_KEYS = [
  'tracker_app_state',
  'tracker_program_registry',
  'tracker_active_program',
  'firebase_sync_enabled',
  'firebase_last_sync_time',
  'emom_interval',
  'tracker_week',
] as const;

// ============================================================================
// TYPES
// ============================================================================

export type NamespacedKey = (typeof NAMESPACED_KEYS)[number];
export type GlobalKey = (typeof GLOBAL_KEYS)[number];

export interface NamespaceInfo {
  programId: string;
  originalKey: string;
}

// ============================================================================
// KEY GENERATION
// ============================================================================

/**
 * Get the current active program ID from the registry
 * Falls back to DEFAULT_PROGRAM_ID if no active program
 */
export function getActiveProgramId(): string {
  try {
    const registry = getProgramRegistry();
    return registry.getActiveProgramId() ?? DEFAULT_PROGRAM_ID;
  } catch {
    // During initialization or if registry is not ready
    return DEFAULT_PROGRAM_ID;
  }
}

/**
 * Create a namespaced storage key for the active program
 * @param key - Original storage key
 * @returns Namespaced key in format `p:{programId}:{key}`
 */
export function getNamespacedKey(key: string): string {
  const programId = getActiveProgramId();
  return `${NAMESPACE_PREFIX}${programId}${NAMESPACE_SEPARATOR}${key}`;
}

/**
 * Create a namespaced storage key for a specific program
 * @param programId - Program identifier
 * @param key - Original storage key
 * @returns Namespaced key in format `p:{programId}:{key}`
 */
export function getNamespacedKeyForProgram(programId: string, key: string): string {
  return `${NAMESPACE_PREFIX}${programId}${NAMESPACE_SEPARATOR}${key}`;
}

/**
 * Parse a namespaced key back to its components
 * @param namespacedKey - The full namespaced key
 * @returns NamespaceInfo with programId and originalKey, or null if not namespaced
 */
export function parseNamespacedKey(namespacedKey: string): NamespaceInfo | null {
  if (!namespacedKey.startsWith(NAMESPACE_PREFIX)) {
    return null;
  }

  // Remove prefix and split by separator
  const withoutPrefix = namespacedKey.slice(NAMESPACE_PREFIX.length);
  const separatorIndex = withoutPrefix.indexOf(NAMESPACE_SEPARATOR);

  if (separatorIndex === -1) {
    return null;
  }

  return {
    programId: withoutPrefix.slice(0, separatorIndex),
    originalKey: withoutPrefix.slice(separatorIndex + 1),
  };
}

/**
 * Check if a key should be namespaced based on its pattern
 * @param key - Storage key to check
 * @returns true if the key should be namespaced
 */
export function shouldBeNamespaced(key: string): boolean {
  // Check exact matches
  if (NAMESPACED_KEYS.includes(key as NamespacedKey)) {
    return true;
  }

  // Check session patterns
  if (SESSION_KEY_PATTERN.test(key) || EMPTY_SESSION_PATTERN.test(key)) {
    return true;
  }

  return false;
}

/**
 * Check if a key is already namespaced
 * @param key - Storage key to check
 * @returns true if the key is already namespaced
 */
export function isNamespacedKey(key: string): boolean {
  return key.startsWith(NAMESPACE_PREFIX);
}

/**
 * Get the original (un-namespaced) key from a potentially namespaced key
 * @param key - Storage key (possibly namespaced)
 * @returns Original key without namespace prefix
 */
export function getOriginalKey(key: string): string {
  const parsed = parseNamespacedKey(key);
  return parsed ? parsed.originalKey : key;
}

// ============================================================================
// SESSION KEY HELPERS
// ============================================================================

/**
 * Generate a namespaced session key for the active program
 * @param week - Week number
 * @param day - Day number
 * @returns Namespaced session key
 */
export function getSessionKey(week: number, day: number): string {
  const baseKey = `session_w${week}d${day}`;
  return getNamespacedKey(baseKey);
}

/**
 * Generate a namespaced session key for a specific program
 * @param programId - Program identifier
 * @param week - Week number
 * @param day - Day number
 * @returns Namespaced session key
 */
export function getSessionKeyForProgram(programId: string, week: number, day: number): string {
  const baseKey = `session_w${week}d${day}`;
  return getNamespacedKeyForProgram(programId, baseKey);
}

/**
 * Parse session key to extract week and day
 * Works with both legacy and namespaced keys
 * @param sessionKey - Session key (with or without namespace)
 * @returns Object with week and day, or null if invalid
 */
export function parseSessionKey(sessionKey: string): { week: number; day: number } | null {
  // Get original key without namespace if present
  const originalKey = getOriginalKey(sessionKey);

  const match = originalKey.match(/^session_w(\d+)d(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    week: parseInt(match[1], 10),
    day: parseInt(match[2], 10),
  };
}

// ============================================================================
// EXERCISE HISTORY KEY HELPERS
// ============================================================================

/**
 * Get the namespaced exercise history key for the active program
 * @returns Namespaced exercise history key
 */
export function getExerciseHistoryKey(): string {
  return getNamespacedKey('exercise_history');
}

/**
 * Get the namespaced exercise history key for a specific program
 * @param programId - Program identifier
 * @returns Namespaced exercise history key
 */
export function getExerciseHistoryKeyForProgram(programId: string): string {
  return getNamespacedKeyForProgram(programId, 'exercise_history');
}

// ============================================================================
// GLOBAL HISTORY KEY HELPERS
// ============================================================================

/**
 * Get the namespaced global history key for the active program
 * @returns Namespaced global history key
 */
export function getGlobalHistoryKey(): string {
  return getNamespacedKey('global_history');
}

/**
 * Get the namespaced global history key for a specific program
 * @param programId - Program identifier
 * @returns Namespaced global history key
 */
export function getGlobalHistoryKeyForProgram(programId: string): string {
  return getNamespacedKeyForProgram(programId, 'global_history');
}

// ============================================================================
// KEY ENUMERATION
// ============================================================================

/**
 * Get all storage keys for a specific program
 * @param programId - Program identifier
 * @returns Array of all localStorage keys for this program
 */
export function getAllKeysForProgram(programId: string): string[] {
  const prefix = `${NAMESPACE_PREFIX}${programId}${NAMESPACE_SEPARATOR}`;
  const keys: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.warn(`Failed to enumerate storage keys for program "${programId}":`, error);
  }

  return keys;
}

/**
 * Get all legacy (non-namespaced) storage keys that should be migrated
 * @returns Array of legacy keys that need migration
 */
export function getLegacyKeys(): string[] {
  const legacyKeys: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !isNamespacedKey(key) && shouldBeNamespaced(key)) {
        legacyKeys.push(key);
      }
    }
  } catch (error) {
    console.warn('Failed to enumerate legacy storage keys:', error);
  }

  return legacyKeys;
}

/**
 * Check if there are any legacy keys that need migration
 * @returns true if migration is needed
 */
export function needsMigration(): boolean {
  return getLegacyKeys().length > 0;
}
