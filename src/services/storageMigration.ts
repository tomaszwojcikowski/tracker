/**
 * Storage Migration Utility
 *
 * Handles one-time migration of legacy (non-namespaced) storage keys
 * to program-scoped namespaced keys.
 *
 * Migration Process:
 * 1. Detect legacy storage keys
 * 2. Determine target program (default program for existing users)
 * 3. Copy data to namespaced keys
 * 4. Mark migration as complete
 * 5. Optionally clean up legacy keys
 *
 * Backward Compatibility:
 * - Legacy keys are preserved until explicitly cleaned up
 * - Migration can be run multiple times safely (idempotent)
 * - Failed migrations are logged and can be retried
 */

import { safeGetJSON, safeSetJSON, safeRemove } from '../utils/storage';
import {
  getLegacyKeys,
  getNamespacedKeyForProgram,
} from './storageNamespace';
import { DEFAULT_PROGRAM_ID, getProgramRegistry } from './programRegistry';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Storage key for migration status */
export const MIGRATION_STATUS_KEY = 'tracker_storage_migration_v1';

/** Migration version - increment when migration logic changes */
export const MIGRATION_VERSION = 1;

// ============================================================================
// TYPES
// ============================================================================

export interface MigrationStatus {
  /** Migration version that was completed */
  version: number;
  /** ISO timestamp of when migration completed */
  completedAt: string;
  /** Number of keys migrated */
  keysMigrated: number;
  /** Program ID data was migrated to */
  targetProgramId: string;
  /** Whether legacy keys were cleaned up */
  legacyKeysCleaned: boolean;
}

export interface MigrationResult {
  /** Whether migration was successful */
  success: boolean;
  /** Number of keys migrated */
  keysMigrated: number;
  /** Any errors encountered */
  errors: string[];
  /** Keys that were migrated */
  migratedKeys: string[];
  /** Keys that failed to migrate */
  failedKeys: string[];
}

// ============================================================================
// MIGRATION STATUS
// ============================================================================

/**
 * Get the current migration status
 * @returns MigrationStatus or null if not migrated
 */
export function getMigrationStatus(): MigrationStatus | null {
  return safeGetJSON<MigrationStatus>(MIGRATION_STATUS_KEY);
}

/**
 * Check if migration has been completed
 * @returns true if migration was completed for current version
 */
export function isMigrationCompleted(): boolean {
  const status = getMigrationStatus();
  return status !== null && status.version >= MIGRATION_VERSION;
}

/**
 * Check if migration is needed
 * @returns true if there are legacy keys that need migration
 */
export function needsMigration(): boolean {
  // If already migrated, no need
  if (isMigrationCompleted()) {
    return false;
  }

  // Check for legacy keys
  const legacyKeys = getLegacyKeys();
  return legacyKeys.length > 0;
}

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

/**
 * Migrate a single key to the namespaced format
 * @param key - Legacy key to migrate
 * @param targetProgramId - Program ID to migrate data to
 * @returns true if migration succeeded
 */
function migrateKey(key: string, targetProgramId: string): boolean {
  try {
    // Get the current value
    const value = safeGetJSON(key, null);
    if (value === null) {
      // Key exists but has no value, skip
      return true;
    }

    // Generate namespaced key
    const namespacedKey = getNamespacedKeyForProgram(targetProgramId, key);

    // Check if namespaced key already exists (don't overwrite)
    const existingValue = safeGetJSON(namespacedKey, null);
    if (existingValue !== null) {
      console.log(`Migration: Namespaced key ${namespacedKey} already exists, skipping`);
      return true;
    }

    // Write to namespaced key
    const success = safeSetJSON(namespacedKey, value);
    if (!success) {
      console.error(`Migration: Failed to write namespaced key ${namespacedKey}`);
      return false;
    }

    console.log(`Migration: Migrated ${key} -> ${namespacedKey}`);
    return true;
  } catch (error) {
    console.error(`Migration: Error migrating key ${key}:`, error);
    return false;
  }
}

/**
 * Run the full migration process
 * @param targetProgramId - Program ID to migrate data to (defaults to active or default program)
 * @param cleanupLegacy - Whether to remove legacy keys after migration
 * @returns MigrationResult with details of the migration
 */
export function runMigration(
  targetProgramId?: string,
  cleanupLegacy: boolean = false
): MigrationResult {
  const result: MigrationResult = {
    success: true,
    keysMigrated: 0,
    errors: [],
    migratedKeys: [],
    failedKeys: [],
  };

  // Determine target program
  const programId = targetProgramId ?? getTargetProgramId();

  // Get legacy keys that need migration
  const legacyKeys = getLegacyKeys();

  if (legacyKeys.length === 0) {
    console.log('Migration: No legacy keys found, marking as complete');
    saveMigrationStatus(programId, 0, cleanupLegacy);
    return result;
  }

  console.log(`Migration: Found ${legacyKeys.length} legacy keys to migrate`);

  // Migrate each key
  for (const key of legacyKeys) {
    const success = migrateKey(key, programId);
    if (success) {
      result.keysMigrated++;
      result.migratedKeys.push(key);
    } else {
      result.success = false;
      result.errors.push(`Failed to migrate key: ${key}`);
      result.failedKeys.push(key);
    }
  }

  // Cleanup legacy keys if requested and all migrations succeeded
  if (cleanupLegacy && result.success) {
    for (const key of result.migratedKeys) {
      safeRemove(key);
    }
    console.log(`Migration: Cleaned up ${result.migratedKeys.length} legacy keys`);
  }

  // Save migration status
  saveMigrationStatus(programId, result.keysMigrated, cleanupLegacy && result.success);

  console.log(
    `Migration: Completed. Migrated ${result.keysMigrated} keys, ` +
      `${result.failedKeys.length} failed`
  );

  return result;
}

/**
 * Determine the target program ID for migration
 * Uses active program if available, falls back to default
 */
function getTargetProgramId(): string {
  try {
    const registry = getProgramRegistry();
    const activeId = registry.getActiveProgramId();
    if (activeId) {
      return activeId;
    }
  } catch {
    // Registry not ready
  }
  return DEFAULT_PROGRAM_ID;
}

/**
 * Save migration status to localStorage
 */
function saveMigrationStatus(
  programId: string,
  keysMigrated: number,
  legacyKeysCleaned: boolean
): void {
  const status: MigrationStatus = {
    version: MIGRATION_VERSION,
    completedAt: new Date().toISOString(),
    keysMigrated,
    targetProgramId: programId,
    legacyKeysCleaned,
  };
  safeSetJSON(MIGRATION_STATUS_KEY, status);
}

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Clean up legacy keys after successful migration
 * Only removes keys that have been successfully migrated
 * @returns Number of keys removed
 */
export function cleanupLegacyKeys(): number {
  const status = getMigrationStatus();
  if (!status) {
    console.warn('Migration: Cannot cleanup - no migration status found');
    return 0;
  }

  if (status.legacyKeysCleaned) {
    console.log('Migration: Legacy keys already cleaned');
    return 0;
  }

  const legacyKeys = getLegacyKeys();
  let removedCount = 0;

  for (const key of legacyKeys) {
    // Verify the data exists in the namespaced key before removing
    const namespacedKey = getNamespacedKeyForProgram(status.targetProgramId, key);
    const namespacedValue = safeGetJSON(namespacedKey, null);

    if (namespacedValue !== null) {
      if (safeRemove(key)) {
        removedCount++;
      }
    } else {
      console.warn(`Migration: Skipping cleanup of ${key} - namespaced version not found`);
    }
  }

  // Update migration status
  if (removedCount > 0) {
    status.legacyKeysCleaned = true;
    safeSetJSON(MIGRATION_STATUS_KEY, status);
  }

  console.log(`Migration: Cleaned up ${removedCount} legacy keys`);
  return removedCount;
}

/**
 * Reset migration status (for testing or re-migration)
 * Does NOT restore legacy keys - use with caution
 */
export function resetMigrationStatus(): void {
  safeRemove(MIGRATION_STATUS_KEY);
  console.log('Migration: Status reset');
}

// ============================================================================
// AUTO-MIGRATION
// ============================================================================

/**
 * Run migration automatically if needed
 * This is safe to call on every app start
 * @returns true if migration ran (or wasn't needed)
 */
export function autoMigrate(): boolean {
  if (isMigrationCompleted()) {
    return true;
  }

  if (!needsMigration()) {
    // No legacy keys, mark as complete
    saveMigrationStatus(getTargetProgramId(), 0, true);
    return true;
  }

  const result = runMigration();
  return result.success;
}
