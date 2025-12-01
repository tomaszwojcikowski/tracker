/**
 * Program Import/Export Utilities
 *
 * This module provides utilities for importing and exporting workout programs,
 * including JSON validation, version migration, and progress data handling.
 */

import { safeGetJSON, safeSetJSON, safeRemove } from './storage';
import {
  getAllKeysForProgram,
  getExerciseHistoryKeyForProgram,
  NAMESPACE_PREFIX,
  NAMESPACE_SEPARATOR,
} from '../services/storageNamespace';
import { getProgramRegistry, type ProgramManifest } from '../services/programRegistry';
import { loadWorkoutPlan, type V2WorkoutPlan } from '../workout-plan-utils';
import type { ExerciseHistory } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Validation result for imported programs
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  formatVersion?: string;
}

/**
 * Import result containing the imported manifest and any issues
 */
export interface ImportResult {
  success: boolean;
  manifest?: ProgramManifest;
  errors: string[];
  warnings: string[];
  migrated?: boolean;
  originalVersion?: string;
  targetVersion?: string;
}

/**
 * Export options for program data
 */
export interface ExportOptions {
  /** Include user progress data (session logs, exercise history) */
  includeProgress?: boolean;
  /** Include only completed workouts */
  completedOnly?: boolean;
}

/**
 * Exported program data structure
 */
export interface ExportedProgram {
  /** The workout plan JSON */
  plan: V2WorkoutPlan;
  /** Export metadata */
  exportMetadata: {
    exportedAt: string;
    includesProgress: boolean;
    programId: string;
    version: string;
  };
  /** User progress data (if includeProgress is true) */
  progress?: {
    exerciseHistory?: ExerciseHistory;
    sessions?: Record<string, unknown>;
    completionStats?: ProgramProgress;
  };
}

/**
 * Program progress statistics
 */
export interface ProgramProgress {
  /** Program ID */
  programId: string;
  /** Total number of workouts in the program */
  totalWorkouts: number;
  /** Number of completed workouts */
  completedWorkouts: number;
  /** Completion percentage (0-100) */
  completionPercentage: number;
  /** Total sets in the program */
  totalSets: number;
  /** Completed sets */
  completedSets: number;
  /** Date of first workout */
  firstWorkoutDate?: string;
  /** Date of most recent workout */
  lastWorkoutDate?: string;
  /** Number of weeks with at least one workout */
  activeWeeks: number;
  /** Total weeks in the program */
  totalWeeks: number;
}

/**
 * Archived progress data for program reset
 */
export interface ArchivedProgress {
  /** Archive ID */
  id: string;
  /** Program ID this archive belongs to */
  programId: string;
  /** When the archive was created */
  archivedAt: string;
  /** Progress statistics at time of archive */
  stats: ProgramProgress;
  /** Exercise history */
  exerciseHistory: ExerciseHistory;
  /** Session data */
  sessions: Record<string, unknown>;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a workout plan JSON against the expected schema
 * @param data - The data to validate
 * @returns ValidationResult with errors and warnings
 */
export function validateWorkoutPlan(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Invalid JSON: data must be an object'],
      warnings: [],
    };
  }

  const obj = data as Record<string, unknown>;

  // Check formatVersion
  if (!obj.formatVersion) {
    errors.push('Missing required field: formatVersion');
  } else if (typeof obj.formatVersion !== 'string') {
    errors.push('formatVersion must be a string');
  } else {
    const versionMatch = (obj.formatVersion as string).match(/^2\.(\d+)\.(\d+)$/);
    if (!versionMatch) {
      errors.push(`Invalid formatVersion: ${obj.formatVersion}. Must be 2.x.x format`);
    }
  }

  // Check plan object
  if (!obj.plan) {
    errors.push('Missing required field: plan');
  } else if (typeof obj.plan !== 'object') {
    errors.push('plan must be an object');
  } else {
    const plan = obj.plan as Record<string, unknown>;

    // Validate required plan fields
    if (!plan.id || typeof plan.id !== 'string' || (plan.id as string).length === 0) {
      errors.push('plan.id is required and must be a non-empty string');
    }

    if (!plan.name || typeof plan.name !== 'string' || (plan.name as string).length === 0) {
      errors.push('plan.name is required and must be a non-empty string');
    }

    if (typeof plan.durationWeeks !== 'number' || plan.durationWeeks < 1) {
      errors.push('plan.durationWeeks is required and must be a positive integer');
    }

    if (!Array.isArray(plan.phases) || plan.phases.length === 0) {
      errors.push('plan.phases is required and must be a non-empty array');
    } else {
      // Validate phases
      (plan.phases as unknown[]).forEach((phase, idx) => {
        if (!phase || typeof phase !== 'object') {
          errors.push(`plan.phases[${idx}] must be an object`);
          return;
        }

        const p = phase as Record<string, unknown>;
        if (typeof p.phaseNumber !== 'number') {
          errors.push(`plan.phases[${idx}].phaseNumber is required`);
        }
        if (!p.name || typeof p.name !== 'string') {
          errors.push(`plan.phases[${idx}].name is required`);
        }
        if (typeof p.startWeek !== 'number') {
          errors.push(`plan.phases[${idx}].startWeek is required`);
        }
        if (typeof p.endWeek !== 'number') {
          errors.push(`plan.phases[${idx}].endWeek is required`);
        }
        if (!Array.isArray(p.weeks)) {
          errors.push(`plan.phases[${idx}].weeks is required and must be an array`);
        }
      });
    }

    // Check for optional fields with warnings
    if (!plan.version) {
      warnings.push('plan.version is recommended for tracking plan changes');
    }
    if (!plan.author) {
      warnings.push('plan.author is recommended for attribution');
    }
    if (!plan.description) {
      warnings.push('plan.description is recommended for user understanding');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    formatVersion: typeof obj.formatVersion === 'string' ? obj.formatVersion : undefined,
  };
}

// ============================================================================
// VERSION MIGRATION
// ============================================================================

/**
 * Supported format versions
 */
const SUPPORTED_VERSIONS = ['2.0.0', '2.1.0', '2.2.0', '2.3.0'];

/**
 * Current target version for migration
 */
const CURRENT_VERSION = '2.3.0';

/**
 * Check if a version is supported
 */
export function isVersionSupported(version: string): boolean {
  return SUPPORTED_VERSIONS.includes(version);
}

/**
 * Get the version order (for comparison)
 */
function getVersionOrder(version: string): number {
  const idx = SUPPORTED_VERSIONS.indexOf(version);
  return idx >= 0 ? idx : -1;
}

/**
 * Migrate a workout plan from one version to another
 * @param data - The workout plan data
 * @param targetVersion - Target version to migrate to (defaults to current)
 * @returns Migrated data and migration info
 */
export function migrateWorkoutPlan(
  data: unknown,
  targetVersion: string = CURRENT_VERSION
): { data: V2WorkoutPlan; migrated: boolean; originalVersion: string; targetVersion: string } {
  const validation = validateWorkoutPlan(data);
  if (!validation.valid) {
    throw new Error(`Cannot migrate invalid workout plan: ${validation.errors.join(', ')}`);
  }

  const originalVersion = validation.formatVersion!;
  const originalOrder = getVersionOrder(originalVersion);
  const targetOrder = getVersionOrder(targetVersion);

  if (originalOrder < 0) {
    throw new Error(`Unsupported source version: ${originalVersion}`);
  }

  if (targetOrder < 0) {
    throw new Error(`Unsupported target version: ${targetVersion}`);
  }

  // If already at or above target version, no migration needed
  if (originalOrder >= targetOrder) {
    return {
      data: data as V2WorkoutPlan,
      migrated: false,
      originalVersion,
      targetVersion: originalVersion,
    };
  }

  // Clone the data for migration
  let migratedData = JSON.parse(JSON.stringify(data)) as V2WorkoutPlan;

  // Apply migrations step by step
  for (let i = originalOrder; i < targetOrder; i++) {
    const fromVersion = SUPPORTED_VERSIONS[i];
    const toVersion = SUPPORTED_VERSIONS[i + 1];
    migratedData = applyMigration(migratedData, fromVersion, toVersion);
  }

  return {
    data: migratedData,
    migrated: true,
    originalVersion,
    targetVersion,
  };
}

/**
 * Apply a single migration step
 */
function applyMigration(data: V2WorkoutPlan, fromVersion: string, toVersion: string): V2WorkoutPlan {
  // Clone the data
  const result = { ...data };

  switch (`${fromVersion}->${toVersion}`) {
    case '2.0.0->2.1.0':
      // 2.0.0 to 2.1.0: Add dayTemplates support
      // No structural changes required, just version bump
      result.formatVersion = '2.1.0';
      if (!result.plan.dayTemplates) {
        result.plan = { ...result.plan, dayTemplates: [] };
      }
      break;

    case '2.1.0->2.2.0':
      // 2.1.0 to 2.2.0: Add exerciseTemplates support
      result.formatVersion = '2.2.0';
      if (!result.plan.exerciseTemplates) {
        result.plan = { ...result.plan, exerciseTemplates: [] };
      }
      break;

    case '2.2.0->2.3.0':
      // 2.2.0 to 2.3.0: Add routineTemplates support
      result.formatVersion = '2.3.0';
      if (!result.plan.routineTemplates) {
        result.plan = { ...result.plan, routineTemplates: [] };
      }
      break;

    default:
      throw new Error(`No migration path from ${fromVersion} to ${toVersion}`);
  }

  return result as V2WorkoutPlan;
}

// ============================================================================
// IMPORT
// ============================================================================

/**
 * Import a workout program from JSON
 * @param jsonData - The JSON data to import (string or object)
 * @param options - Import options
 * @returns Import result with manifest or errors
 */
export async function importProgram(
  jsonData: string | unknown,
  options: { autoMigrate?: boolean; setActive?: boolean } = {}
): Promise<ImportResult> {
  const { autoMigrate = true, setActive = false } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Parse JSON if string
  let data: unknown;
  if (typeof jsonData === 'string') {
    try {
      data = JSON.parse(jsonData);
    } catch (e) {
      return {
        success: false,
        errors: [`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`],
        warnings: [],
      };
    }
  } else {
    data = jsonData;
  }

  // Validate the data
  const validation = validateWorkoutPlan(data);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  warnings.push(...validation.warnings);

  // Check if migration is needed
  let finalData = data as V2WorkoutPlan;
  let migrated = false;
  let originalVersion = validation.formatVersion;
  let targetVersion = validation.formatVersion;

  if (autoMigrate && validation.formatVersion && getVersionOrder(validation.formatVersion) < getVersionOrder(CURRENT_VERSION)) {
    try {
      const migrationResult = migrateWorkoutPlan(data, CURRENT_VERSION);
      finalData = migrationResult.data;
      migrated = migrationResult.migrated;
      originalVersion = migrationResult.originalVersion;
      targetVersion = migrationResult.targetVersion;

      if (migrated) {
        warnings.push(`Program migrated from ${originalVersion} to ${targetVersion}`);
      }
    } catch (e) {
      errors.push(`Migration failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return {
        success: false,
        errors,
        warnings,
      };
    }
  }

  // Import the program into the registry
  try {
    const registry = getProgramRegistry();

    // Check if program already exists
    const existingProgram = registry.getProgramById(finalData.plan.id);
    if (existingProgram) {
      errors.push(`Program with ID "${finalData.plan.id}" already exists`);
      return {
        success: false,
        errors,
        warnings,
      };
    }

    // Import the program
    const manifest = await registry.importProgram({
      formatVersion: finalData.formatVersion,
      plan: {
        ...finalData.plan,
        // Provide version field required by WorkoutPlanJson (use '1.0.0' as default if not in plan)
        version: (finalData.plan as { version?: string }).version || '1.0.0',
      },
    });

    // Load and store program data
    const loadedPlan = loadWorkoutPlan(finalData);
    registry.setProgramData(manifest.id, {
      schedule: loadedPlan.schedule,
      metadata: loadedPlan.metadata,
    });

    // Set as active if requested
    if (setActive) {
      registry.setActiveProgram(manifest.id);
    }

    return {
      success: true,
      manifest,
      errors: [],
      warnings,
      migrated,
      originalVersion,
      targetVersion,
    };
  } catch (e) {
    errors.push(`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    return {
      success: false,
      errors,
      warnings,
    };
  }
}

/**
 * Import a program from a File object
 * @param file - The file to import
 * @param options - Import options
 * @returns Import result
 */
export async function importProgramFromFile(
  file: File,
  options: { autoMigrate?: boolean; setActive?: boolean } = {}
): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        resolve({
          success: false,
          errors: ['Failed to read file content'],
          warnings: [],
        });
        return;
      }

      const result = await importProgram(content, options);
      resolve(result);
    };

    reader.onerror = () => {
      resolve({
        success: false,
        errors: [`Failed to read file: ${reader.error?.message || 'Unknown error'}`],
        warnings: [],
      });
    };

    reader.readAsText(file);
  });
}

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Export a program to JSON
 * @param programId - The program ID to export
 * @param options - Export options
 * @returns Exported program data or null if not found
 */
export function exportProgram(
  programId: string,
  options: ExportOptions = {}
): ExportedProgram | null {
  const { includeProgress = false } = options;

  const registry = getProgramRegistry();
  const manifest = registry.getProgramById(programId);

  if (!manifest) {
    return null;
  }

  const programData = registry.getProgramData(programId);
  if (!programData) {
    return null;
  }

  // Build the base workout plan structure
  // Note: We don't have the original raw plan data stored, so we reconstruct from metadata
  // In a real implementation, you might want to store the original plan JSON
  const plan: V2WorkoutPlan = {
    formatVersion: '2.3.0',
    plan: {
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      author: manifest.author,
      durationWeeks: manifest.durationWeeks,
      targetLevel: manifest.targetLevel,
      goals: manifest.goals,
      equipment: manifest.equipment,
      phases: programData.metadata.phases?.map((phase) => ({
        phaseNumber: phase.number,
        name: phase.name,
        description: phase.description,
        startWeek: phase.startWeek,
        endWeek: phase.endWeek,
        focus: phase.focus,
        weeks: [], // Would need to reconstruct from schedule
      })) || [],
    },
  };

  const exportData: ExportedProgram = {
    plan,
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      includesProgress: includeProgress,
      programId,
      version: manifest.version,
    },
  };

  // Include progress data if requested
  if (includeProgress) {
    const progress = calculateProgramProgress(programId);
    const exerciseHistoryKey = getExerciseHistoryKeyForProgram(programId);
    const exerciseHistory = safeGetJSON<ExerciseHistory>(exerciseHistoryKey, {});

    // Get all session data for this program
    const sessionKeys = getAllKeysForProgram(programId).filter((key) =>
      key.includes(':session_')
    );
    const sessions: Record<string, unknown> = {};
    sessionKeys.forEach((key) => {
      const sessionData = safeGetJSON<Record<string, unknown>>(key);
      if (sessionData) {
        // Extract just the session part of the key
        const parts = key.split(':');
        const sessionName = parts[parts.length - 1];
        sessions[sessionName] = sessionData;
      }
    });

    exportData.progress = {
      exerciseHistory,
      sessions,
      completionStats: progress,
    };
  }

  return exportData;
}

/**
 * Export a program to a downloadable JSON file
 * @param programId - The program ID to export
 * @param options - Export options
 * @returns Blob for download or null if not found
 */
export function exportProgramToBlob(
  programId: string,
  options: ExportOptions = {}
): Blob | null {
  const exportData = exportProgram(programId, options);
  if (!exportData) {
    return null;
  }

  const jsonString = JSON.stringify(exportData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Trigger a download of the exported program
 * @param programId - The program ID to export
 * @param options - Export options
 * @returns true if download was triggered, false otherwise
 */
export function downloadProgram(
  programId: string,
  options: ExportOptions = {}
): boolean {
  const registry = getProgramRegistry();
  const manifest = registry.getProgramById(programId);

  if (!manifest) {
    return false;
  }

  const blob = exportProgramToBlob(programId, options);
  if (!blob) {
    return false;
  }

  // Create download link
  const url = URL.createObjectURL(blob);
  const filename = `${manifest.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up URL
  URL.revokeObjectURL(url);

  return true;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Calculate program progress statistics
 * @param programId - The program ID to calculate progress for
 * @returns ProgramProgress statistics
 */
export function calculateProgramProgress(programId: string): ProgramProgress {
  const registry = getProgramRegistry();
  const manifest = registry.getProgramById(programId);
  const programData = registry.getProgramData(programId);

  if (!manifest || !programData) {
    return {
      programId,
      totalWorkouts: 0,
      completedWorkouts: 0,
      completionPercentage: 0,
      totalSets: 0,
      completedSets: 0,
      activeWeeks: 0,
      totalWeeks: 0,
    };
  }

  // Calculate total workouts and sets from schedule
  const schedule = programData.schedule;
  const workoutDays = new Set<string>();
  let totalSets = 0;

  schedule.forEach((entry) => {
    workoutDays.add(`${entry.w}-${entry.d}`);
    totalSets += entry.s;
  });

  const totalWorkouts = workoutDays.size;
  const totalWeeks = manifest.durationWeeks;

  // Get completed workouts from session storage
  const allKeys = getAllKeysForProgram(programId);
  const sessionKeys = allKeys.filter((key) => key.includes(':session_w'));

  let completedWorkouts = 0;
  let completedSets = 0;
  let firstWorkoutDate: string | undefined;
  let lastWorkoutDate: string | undefined;
  const activeWeeksSet = new Set<number>();

  sessionKeys.forEach((key) => {
    const session = safeGetJSON<{
      completed?: boolean;
      completedAt?: string;
      week?: number;
      [key: string]: unknown;
    }>(key);

    if (!session) return;

    // Check if workout is completed
    if (session.completed) {
      completedWorkouts++;

      // Track active weeks
      if (session.week) {
        activeWeeksSet.add(session.week);
      }

      // Track dates
      if (session.completedAt) {
        if (!firstWorkoutDate || session.completedAt < firstWorkoutDate) {
          firstWorkoutDate = session.completedAt;
        }
        if (!lastWorkoutDate || session.completedAt > lastWorkoutDate) {
          lastWorkoutDate = session.completedAt;
        }
      }
    }

    // Count completed sets from exercise entries
    Object.entries(session).forEach(([exerciseKey, value]) => {
      if (['completed', 'completedAt', 'lastModified', 'week', 'day', 'workoutNotes', 'addedExercises'].includes(exerciseKey)) {
        return;
      }

      if (value && typeof value === 'object' && 'sets' in value) {
        const sets = (value as { sets?: boolean[] }).sets;
        if (Array.isArray(sets)) {
          completedSets += sets.filter(Boolean).length;
        }
      }
    });
  });

  const completionPercentage = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  return {
    programId,
    totalWorkouts,
    completedWorkouts,
    completionPercentage,
    totalSets,
    completedSets,
    firstWorkoutDate,
    lastWorkoutDate,
    activeWeeks: activeWeeksSet.size,
    totalWeeks,
  };
}

// ============================================================================
// PROGRAM RESET
// ============================================================================

/** Storage key prefix for archived progress */
const ARCHIVE_PREFIX = 'tracker_progress_archive';

/**
 * Archive current program progress
 * @param programId - The program ID to archive progress for
 * @returns Archive ID or null if failed
 */
export function archiveProgress(programId: string): string | null {
  const progress = calculateProgramProgress(programId);
  const exerciseHistoryKey = getExerciseHistoryKeyForProgram(programId);
  const exerciseHistory = safeGetJSON<ExerciseHistory>(exerciseHistoryKey, {});

  // Get all session data
  const sessionKeys = getAllKeysForProgram(programId).filter((key) =>
    key.includes(':session_')
  );
  const sessions: Record<string, unknown> = {};
  sessionKeys.forEach((key) => {
    const sessionData = safeGetJSON<Record<string, unknown>>(key);
    if (sessionData) {
      const parts = key.split(':');
      const sessionName = parts[parts.length - 1];
      sessions[sessionName] = sessionData;
    }
  });

  // Create archive
  const archiveId = `${programId}_${Date.now()}`;
  const archive: ArchivedProgress = {
    id: archiveId,
    programId,
    archivedAt: new Date().toISOString(),
    stats: progress,
    exerciseHistory,
    sessions,
  };

  // Store archive
  const archiveKey = `${ARCHIVE_PREFIX}:${archiveId}`;
  const success = safeSetJSON(archiveKey, archive);

  if (!success) {
    console.error('Failed to save progress archive');
    return null;
  }

  // Update archive index
  const indexKey = `${ARCHIVE_PREFIX}:index:${programId}`;
  const archiveIndex = safeGetJSON<string[]>(indexKey, []);
  archiveIndex.push(archiveId);
  safeSetJSON(indexKey, archiveIndex);

  return archiveId;
}

/**
 * Get all archived progress for a program
 * @param programId - The program ID
 * @returns Array of archived progress entries
 */
export function getArchivedProgress(programId: string): ArchivedProgress[] {
  const indexKey = `${ARCHIVE_PREFIX}:index:${programId}`;
  const archiveIndex = safeGetJSON<string[]>(indexKey, []);

  return archiveIndex
    .map((archiveId) => {
      const archiveKey = `${ARCHIVE_PREFIX}:${archiveId}`;
      return safeGetJSON<ArchivedProgress>(archiveKey);
    })
    .filter((archive): archive is ArchivedProgress => archive !== null)
    .sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
}

/**
 * Delete an archived progress entry
 * @param archiveId - The archive ID to delete
 * @returns true if deleted, false otherwise
 */
export function deleteArchive(archiveId: string): boolean {
  const archiveKey = `${ARCHIVE_PREFIX}:${archiveId}`;
  const archive = safeGetJSON<ArchivedProgress>(archiveKey);

  if (!archive) {
    return false;
  }

  // Remove from index
  const indexKey = `${ARCHIVE_PREFIX}:index:${archive.programId}`;
  const archiveIndex = safeGetJSON<string[]>(indexKey, []);
  const newIndex = archiveIndex.filter((id) => id !== archiveId);
  safeSetJSON(indexKey, newIndex);

  // Remove archive data
  return safeRemove(archiveKey);
}

/**
 * Reset program progress (clears all session data and exercise history)
 * @param programId - The program ID to reset
 * @param archiveFirst - Whether to archive progress before reset (default: true)
 * @returns Object with success status and archive ID if archived
 */
export function resetProgramProgress(
  programId: string,
  archiveFirst: boolean = true
): { success: boolean; archiveId?: string } {
  let archiveId: string | null = null;

  // Archive first if requested
  if (archiveFirst) {
    archiveId = archiveProgress(programId);
    if (!archiveId) {
      console.warn('Failed to archive progress before reset');
    }
  }

  // Get all keys for this program
  const allKeys = getAllKeysForProgram(programId);

  // Remove session and exercise history keys
  let success = true;
  allKeys.forEach((key) => {
    // Only remove session and exercise history data
    if (key.includes(':session_') || key.includes(':exercise_history') || key.includes(':global_history')) {
      if (!safeRemove(key)) {
        success = false;
      }
    }
  });

  return {
    success,
    archiveId: archiveId || undefined,
  };
}

/**
 * Restore progress from an archive
 * @param archiveId - The archive ID to restore from
 * @returns true if restored successfully
 */
export function restoreProgressFromArchive(archiveId: string): boolean {
  const archiveKey = `${ARCHIVE_PREFIX}:${archiveId}`;
  const archive = safeGetJSON<ArchivedProgress>(archiveKey);

  if (!archive) {
    return false;
  }

  // Restore exercise history
  const exerciseHistoryKey = getExerciseHistoryKeyForProgram(archive.programId);
  if (!safeSetJSON(exerciseHistoryKey, archive.exerciseHistory)) {
    return false;
  }

  // Restore sessions
  const prefix = `${NAMESPACE_PREFIX}${archive.programId}${NAMESPACE_SEPARATOR}`;
  for (const [sessionName, sessionData] of Object.entries(archive.sessions)) {
    const sessionKey = `${prefix}${sessionName}`;
    if (!safeSetJSON(sessionKey, sessionData)) {
      console.error(`Failed to restore session: ${sessionName}`);
    }
  }

  return true;
}
