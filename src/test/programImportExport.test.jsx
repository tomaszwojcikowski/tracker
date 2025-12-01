/**
 * Program Import/Export Tests
 *
 * Tests for the program import/export utilities.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  validateWorkoutPlan,
  migrateWorkoutPlan,
  importProgram,
  exportProgram,
  calculateProgramProgress,
  archiveProgress,
  getArchivedProgress,
  deleteArchive,
  resetProgramProgress,
  restoreProgressFromArchive,
  isVersionSupported,
} from '../utils/programImportExport';
import { resetProgramRegistry, getProgramRegistry } from '../services/programRegistry';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Sample valid workout plan for testing
const validPlanV2_3 = {
  formatVersion: '2.3.0',
  plan: {
    id: 'test-program-v1',
    name: 'Test Workout Program',
    version: '1.0.0',
    description: 'A test workout program',
    author: 'Test Author',
    durationWeeks: 4,
    targetLevel: 'intermediate',
    goals: ['strength', 'muscle-building'],
    equipment: ['barbell', 'dumbbells'],
    routineTemplates: [],
    exerciseTemplates: [],
    dayTemplates: [],
    phases: [
      {
        phaseNumber: 1,
        name: 'Foundation',
        startWeek: 1,
        endWeek: 4,
        weeks: [
          {
            weekNumber: 1,
            days: [
              {
                dayNumber: 1,
                name: 'Day 1',
                exercises: [
                  {
                    exerciseName: 'Pull-Ups',
                    sets: 3,
                    repsType: 'reps',
                    repsValue: 5,
                    category: 'main',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

const validPlanV2_0 = {
  formatVersion: '2.0.0',
  plan: {
    id: 'v2-program',
    name: 'V2 Program',
    version: '1.0.0',
    durationWeeks: 2,
    phases: [
      {
        phaseNumber: 1,
        name: 'Phase 1',
        startWeek: 1,
        endWeek: 2,
        weeks: [
          {
            weekNumber: 1,
            days: [
              {
                dayNumber: 1,
                exercises: [
                  { exerciseName: 'Push-Ups', sets: 3, reps: '10' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

describe('Program Import/Export Utilities', () => {
  beforeEach(() => {
    resetProgramRegistry();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateWorkoutPlan', () => {
    it('should validate a valid v2.3.0 plan', () => {
      const result = validateWorkoutPlan(validPlanV2_3);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.formatVersion).toBe('2.3.0');
    });

    it('should validate a valid v2.0.0 plan', () => {
      const result = validateWorkoutPlan(validPlanV2_0);
      expect(result.valid).toBe(true);
      expect(result.formatVersion).toBe('2.0.0');
    });

    it('should reject null data', () => {
      const result = validateWorkoutPlan(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid JSON: data must be an object');
    });

    it('should reject missing formatVersion', () => {
      const invalidPlan = { plan: { id: 'test', name: 'Test', durationWeeks: 1, phases: [] } };
      const result = validateWorkoutPlan(invalidPlan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: formatVersion');
    });

    it('should reject invalid formatVersion format', () => {
      const invalidPlan = { formatVersion: '1.0.0', plan: validPlanV2_3.plan };
      const result = validateWorkoutPlan(invalidPlan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid formatVersion: 1.0.0. Must be 2.x.x format');
    });

    it('should reject missing plan object', () => {
      const invalidPlan = { formatVersion: '2.3.0' };
      const result = validateWorkoutPlan(invalidPlan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: plan');
    });

    it('should reject missing plan.id', () => {
      const invalidPlan = {
        formatVersion: '2.3.0',
        plan: { name: 'Test', durationWeeks: 1, phases: [] },
      };
      const result = validateWorkoutPlan(invalidPlan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('plan.id is required and must be a non-empty string');
    });

    it('should reject missing plan.name', () => {
      const invalidPlan = {
        formatVersion: '2.3.0',
        plan: { id: 'test', durationWeeks: 1, phases: [] },
      };
      const result = validateWorkoutPlan(invalidPlan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('plan.name is required and must be a non-empty string');
    });

    it('should reject invalid durationWeeks', () => {
      const invalidPlan = {
        formatVersion: '2.3.0',
        plan: { id: 'test', name: 'Test', durationWeeks: 0, phases: [] },
      };
      const result = validateWorkoutPlan(invalidPlan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('plan.durationWeeks is required and must be a positive integer');
    });

    it('should reject empty phases array', () => {
      const invalidPlan = {
        formatVersion: '2.3.0',
        plan: { id: 'test', name: 'Test', durationWeeks: 1, phases: [] },
      };
      const result = validateWorkoutPlan(invalidPlan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('plan.phases is required and must be a non-empty array');
    });

    it('should add warnings for missing optional fields', () => {
      const minimalPlan = {
        formatVersion: '2.3.0',
        plan: {
          id: 'test',
          name: 'Test',
          durationWeeks: 1,
          phases: [
            {
              phaseNumber: 1,
              name: 'Phase 1',
              startWeek: 1,
              endWeek: 1,
              weeks: [],
            },
          ],
        },
      };
      const result = validateWorkoutPlan(minimalPlan);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('plan.version is recommended for tracking plan changes');
      expect(result.warnings).toContain('plan.author is recommended for attribution');
    });
  });

  describe('isVersionSupported', () => {
    it('should return true for supported versions', () => {
      expect(isVersionSupported('2.0.0')).toBe(true);
      expect(isVersionSupported('2.1.0')).toBe(true);
      expect(isVersionSupported('2.2.0')).toBe(true);
      expect(isVersionSupported('2.3.0')).toBe(true);
    });

    it('should return false for unsupported versions', () => {
      expect(isVersionSupported('1.0.0')).toBe(false);
      expect(isVersionSupported('3.0.0')).toBe(false);
      expect(isVersionSupported('2.4.0')).toBe(false);
    });
  });

  describe('migrateWorkoutPlan', () => {
    it('should not migrate a plan already at target version', () => {
      const result = migrateWorkoutPlan(validPlanV2_3, '2.3.0');
      expect(result.migrated).toBe(false);
      expect(result.originalVersion).toBe('2.3.0');
      expect(result.targetVersion).toBe('2.3.0');
    });

    it('should migrate v2.0.0 to v2.3.0', () => {
      const result = migrateWorkoutPlan(validPlanV2_0, '2.3.0');
      expect(result.migrated).toBe(true);
      expect(result.originalVersion).toBe('2.0.0');
      expect(result.targetVersion).toBe('2.3.0');
      expect(result.data.formatVersion).toBe('2.3.0');
      expect(result.data.plan.routineTemplates).toEqual([]);
      expect(result.data.plan.exerciseTemplates).toEqual([]);
      expect(result.data.plan.dayTemplates).toEqual([]);
    });

    it('should migrate v2.1.0 to v2.3.0', () => {
      const v2_1_plan = { ...validPlanV2_0, formatVersion: '2.1.0' };
      v2_1_plan.plan.dayTemplates = [];
      const result = migrateWorkoutPlan(v2_1_plan, '2.3.0');
      expect(result.migrated).toBe(true);
      expect(result.originalVersion).toBe('2.1.0');
      expect(result.targetVersion).toBe('2.3.0');
    });

    it('should throw for invalid plans', () => {
      expect(() => migrateWorkoutPlan({ invalid: true })).toThrow('Cannot migrate invalid workout plan');
    });

    it('should throw for unsupported source version', () => {
      const invalidVersion = { ...validPlanV2_3, formatVersion: '1.9.0' };
      expect(() => migrateWorkoutPlan(invalidVersion)).toThrow('Invalid formatVersion');
    });
  });

  describe('importProgram', () => {
    it('should import a valid program from object', async () => {
      const result = await importProgram(validPlanV2_3);
      expect(result.success).toBe(true);
      expect(result.manifest).toBeDefined();
      expect(result.manifest?.id).toBe('test-program-v1');
      expect(result.manifest?.name).toBe('Test Workout Program');
    });

    it('should import a valid program from JSON string', async () => {
      const result = await importProgram(JSON.stringify(validPlanV2_3));
      expect(result.success).toBe(true);
      expect(result.manifest).toBeDefined();
    });

    it('should reject invalid JSON string', async () => {
      const result = await importProgram('{ invalid json }');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should auto-migrate older versions by default', async () => {
      const result = await importProgram(validPlanV2_0);
      expect(result.success).toBe(true);
      expect(result.migrated).toBe(true);
      expect(result.originalVersion).toBe('2.0.0');
      expect(result.targetVersion).toBe('2.3.0');
    });

    it('should reject duplicate program IDs', async () => {
      await importProgram(validPlanV2_3);
      const result = await importProgram(validPlanV2_3);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Program with ID "test-program-v1" already exists');
    });

    it('should set program as active when requested', async () => {
      const result = await importProgram(validPlanV2_3, { setActive: true });
      expect(result.success).toBe(true);
      
      const registry = getProgramRegistry();
      expect(registry.getActiveProgramId()).toBe('test-program-v1');
    });
  });

  describe('exportProgram', () => {
    beforeEach(async () => {
      await importProgram(validPlanV2_3);
    });

    it('should export a program without progress', () => {
      const exported = exportProgram('test-program-v1');
      expect(exported).not.toBeNull();
      expect(exported?.exportMetadata.programId).toBe('test-program-v1');
      expect(exported?.exportMetadata.includesProgress).toBe(false);
      expect(exported?.progress).toBeUndefined();
    });

    it('should export a program with progress when requested', () => {
      const exported = exportProgram('test-program-v1', { includeProgress: true });
      expect(exported).not.toBeNull();
      expect(exported?.exportMetadata.includesProgress).toBe(true);
      expect(exported?.progress).toBeDefined();
      expect(exported?.progress?.completionStats).toBeDefined();
    });

    it('should return null for non-existent program', () => {
      const exported = exportProgram('non-existent');
      expect(exported).toBeNull();
    });
  });

  describe('calculateProgramProgress', () => {
    beforeEach(async () => {
      await importProgram(validPlanV2_3);
    });

    it('should calculate progress for a program with no completed workouts', () => {
      const progress = calculateProgramProgress('test-program-v1');
      expect(progress.programId).toBe('test-program-v1');
      expect(progress.completedWorkouts).toBe(0);
      expect(progress.completionPercentage).toBe(0);
      expect(progress.totalWeeks).toBe(4);
    });

    it('should return zeros for non-existent program', () => {
      const progress = calculateProgramProgress('non-existent');
      expect(progress.programId).toBe('non-existent');
      expect(progress.totalWorkouts).toBe(0);
      expect(progress.completedWorkouts).toBe(0);
    });
  });

  describe('archiveProgress and getArchivedProgress', () => {
    beforeEach(async () => {
      await importProgram(validPlanV2_3);
    });

    it('should archive progress and create archive ID', () => {
      const archiveId = archiveProgress('test-program-v1');
      expect(archiveId).not.toBeNull();
      expect(archiveId).toContain('test-program-v1');
    });

    it('should retrieve archived progress', () => {
      const archiveId = archiveProgress('test-program-v1');
      expect(archiveId).not.toBeNull();

      const archives = getArchivedProgress('test-program-v1');
      expect(archives).toHaveLength(1);
      expect(archives[0].id).toBe(archiveId);
      expect(archives[0].programId).toBe('test-program-v1');
    });

    it('should return empty array for program with no archives', () => {
      const archives = getArchivedProgress('test-program-v1');
      expect(archives).toHaveLength(0);
    });

    it('should sort archives by date descending', () => {
      // Create multiple archives with small delay
      const archiveId1 = archiveProgress('test-program-v1');
      const archiveId2 = archiveProgress('test-program-v1');

      const archives = getArchivedProgress('test-program-v1');
      expect(archives).toHaveLength(2);
      // Most recent should be first
      expect(archives[0].id).toBe(archiveId2);
      expect(archives[1].id).toBe(archiveId1);
    });
  });

  describe('deleteArchive', () => {
    beforeEach(async () => {
      await importProgram(validPlanV2_3);
    });

    it('should delete an existing archive', () => {
      const archiveId = archiveProgress('test-program-v1');
      expect(archiveId).not.toBeNull();

      const result = deleteArchive(archiveId);
      expect(result).toBe(true);

      const archives = getArchivedProgress('test-program-v1');
      expect(archives).toHaveLength(0);
    });

    it('should return false for non-existent archive', () => {
      const result = deleteArchive('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('resetProgramProgress', () => {
    beforeEach(async () => {
      await importProgram(validPlanV2_3);
      // Simulate some progress data
      localStorageMock.setItem(
        'p:test-program-v1:session_w1d1',
        JSON.stringify({ completed: true })
      );
      localStorageMock.setItem(
        'p:test-program-v1:exercise_history',
        JSON.stringify({ 'Pull-Ups': [] })
      );
    });

    it('should reset program progress and archive by default', () => {
      const result = resetProgramProgress('test-program-v1');
      expect(result.success).toBe(true);
      expect(result.archiveId).toBeDefined();

      // Progress data should be cleared
      expect(localStorageMock.getItem('p:test-program-v1:session_w1d1')).toBeNull();
      expect(localStorageMock.getItem('p:test-program-v1:exercise_history')).toBeNull();
    });

    it('should reset without archiving when specified', () => {
      const result = resetProgramProgress('test-program-v1', false);
      expect(result.success).toBe(true);
      expect(result.archiveId).toBeUndefined();

      const archives = getArchivedProgress('test-program-v1');
      expect(archives).toHaveLength(0);
    });
  });

  describe('restoreProgressFromArchive', () => {
    beforeEach(async () => {
      await importProgram(validPlanV2_3);
      // Create some progress data
      localStorageMock.setItem(
        'p:test-program-v1:session_w1d1',
        JSON.stringify({ completed: true, week: 1, day: 1 })
      );
      localStorageMock.setItem(
        'p:test-program-v1:exercise_history',
        JSON.stringify({ 'Pull-Ups': [{ date: '2024-01-01' }] })
      );
    });

    it('should restore progress from archive', () => {
      const archiveId = archiveProgress('test-program-v1');
      expect(archiveId).not.toBeNull();

      // Clear progress
      resetProgramProgress('test-program-v1', false);
      expect(localStorageMock.getItem('p:test-program-v1:session_w1d1')).toBeNull();

      // Restore from archive
      const result = restoreProgressFromArchive(archiveId);
      expect(result).toBe(true);

      // Progress should be restored
      const exerciseHistory = localStorageMock.getItem('p:test-program-v1:exercise_history');
      expect(exerciseHistory).not.toBeNull();
      expect(JSON.parse(exerciseHistory)).toHaveProperty('Pull-Ups');
    });

    it('should return false for non-existent archive', () => {
      const result = restoreProgressFromArchive('non-existent');
      expect(result).toBe(false);
    });
  });
});
