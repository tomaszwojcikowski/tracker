/**
 * Services Module
 *
 * Exports all service modules for the tracker app.
 */

// Program Registry
export {
  getProgramRegistry,
  resetProgramRegistry,
  extractManifestFromPlan,
  initializeDefaultProgram,
  DEFAULT_PROGRAM_ID,
} from './programRegistry';

export type {
  ProgramManifest,
  ProgramRegistry,
  ProgramData,
  WorkoutPlanJson,
} from './programRegistry';

// Storage Namespace
export {
  getNamespacedKey,
  getNamespacedKeyForProgram,
  parseNamespacedKey,
  shouldBeNamespaced,
  isNamespacedKey,
  getOriginalKey,
  getSessionKey,
  getSessionKeyForProgram,
  parseSessionKey,
  getExerciseHistoryKey,
  getExerciseHistoryKeyForProgram,
  getAllKeysForProgram,
  getLegacyKeys,
  needsMigration,
  getActiveProgramId,
  NAMESPACE_PREFIX,
  NAMESPACE_SEPARATOR,
  NAMESPACED_KEYS,
  SESSION_KEY_PATTERN,
  EMPTY_SESSION_PATTERN,
  GLOBAL_KEYS,
} from './storageNamespace';

export type { NamespaceInfo, NamespacedKey, GlobalKey } from './storageNamespace';

// Storage Migration
export {
  runMigration,
  autoMigrate,
  getMigrationStatus,
  isMigrationCompleted,
  needsMigration as migrationNeeded,
  cleanupLegacyKeys,
  resetMigrationStatus,
  MIGRATION_STATUS_KEY,
  MIGRATION_VERSION,
} from './storageMigration';

export type { MigrationStatus, MigrationResult } from './storageMigration';
