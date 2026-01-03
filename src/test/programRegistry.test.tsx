/**
 * Program Registry Tests
 *
 * Tests for the program registry service.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getProgramRegistry,
  resetProgramRegistry,
  extractManifestFromPlan,
  initializeDefaultProgram,
  DEFAULT_PROGRAM_ID,
} from '../services/programRegistry';

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

// Sample workout plan JSON for testing
const samplePlanJson = {
  formatVersion: '2.1.0',
  plan: {
    id: 'test-program-v1',
    name: 'Test Workout Program',
    version: '1.0.0',
    description: 'A test workout program',
    author: 'Test Author',
    durationWeeks: 12,
    targetLevel: 'intermediate',
    goals: ['strength', 'muscle-building'],
    equipment: ['barbell', 'dumbbells'],
  },
};

const anotherPlanJson = {
  formatVersion: '2.1.0',
  plan: {
    id: 'another-program-v1',
    name: 'Another Workout Program',
    version: '2.0.0',
    description: 'Another test workout program',
    author: 'Another Author',
    durationWeeks: 8,
    targetLevel: 'beginner',
    goals: ['weight-loss'],
    equipment: ['bodyweight'],
  },
};

describe('Program Registry Service', () => {
  beforeEach(() => {
    // Reset the registry and localStorage before each test
    resetProgramRegistry();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const registry1 = getProgramRegistry();
      const registry2 = getProgramRegistry();
      expect(registry1).toBe(registry2);
    });

    it('should return a new instance after reset', () => {
      const registry1 = getProgramRegistry();
      resetProgramRegistry();
      const registry2 = getProgramRegistry();
      // They won't be the same object reference after reset
      expect(registry1).not.toBe(registry2);
    });
  });

  describe('getAvailablePrograms', () => {
    it('should return empty array when no programs registered', () => {
      const registry = getProgramRegistry();
      expect(registry.getAvailablePrograms()).toEqual([]);
    });

    it('should return registered programs', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);

      const programs = registry.getAvailablePrograms();
      expect(programs).toHaveLength(1);
      expect(programs[0].id).toBe('test-program-v1');
    });
  });

  describe('importProgram', () => {
    it('should create a manifest from plan JSON', async () => {
      const registry = getProgramRegistry();
      const manifest = await registry.importProgram(samplePlanJson);

      expect(manifest.id).toBe('test-program-v1');
      expect(manifest.name).toBe('Test Workout Program');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.description).toBe('A test workout program');
      expect(manifest.author).toBe('Test Author');
      expect(manifest.durationWeeks).toBe(12);
      expect(manifest.targetLevel).toBe('intermediate');
      expect(manifest.goals).toEqual(['strength', 'muscle-building']);
      expect(manifest.equipment).toEqual(['barbell', 'dumbbells']);
      expect(manifest.installedAt).toBeInstanceOf(Date);
    });

    it('should set first imported program as active', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);

      const activeProgram = registry.getActiveProgram();
      expect(activeProgram).not.toBeNull();
      expect(activeProgram?.id).toBe('test-program-v1');
    });

    it('should throw error for invalid plan JSON', async () => {
      const registry = getProgramRegistry();
      const invalidPlan = { plan: { name: 'Missing ID' } };

      await expect(registry.importProgram(invalidPlan)).rejects.toThrow(
        'Invalid workout plan: missing or invalid fields'
      );
    });
  });

  describe('setActiveProgram', () => {
    it('should set the active program', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);
      await registry.importProgram(anotherPlanJson);

      // Use force: true to override the locked active program
      registry.setActiveProgram('another-program-v1', { force: true });

      const activeProgram = registry.getActiveProgram();
      expect(activeProgram?.id).toBe('another-program-v1');
    });

    it('should update isActive flag on all programs', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);
      await registry.importProgram(anotherPlanJson);

      // Use force: true to override the locked active program
      registry.setActiveProgram('another-program-v1', { force: true });

      const programs = registry.getAvailablePrograms();
      const testProgram = programs.find(p => p.id === 'test-program-v1');
      const anotherProgram = programs.find(p => p.id === 'another-program-v1');

      expect(testProgram?.isActive).toBe(false);
      expect(anotherProgram?.isActive).toBe(true);
    });

    it('should throw error for non-existent program', () => {
      const registry = getProgramRegistry();

      expect(() => registry.setActiveProgram('non-existent')).toThrow(
        'Program with ID "non-existent" not found in registry'
      );
    });
  });

  describe('getProgramById', () => {
    it('should return program by ID', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);

      const program = registry.getProgramById('test-program-v1');
      expect(program).not.toBeUndefined();
      expect(program?.name).toBe('Test Workout Program');
    });

    it('should return undefined for non-existent ID', () => {
      const registry = getProgramRegistry();

      const program = registry.getProgramById('non-existent');
      expect(program).toBeUndefined();
    });
  });

  describe('unregisterProgram', () => {
    it('should remove a program from registry', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);
      await registry.importProgram(anotherPlanJson);

      registry.setActiveProgram('another-program-v1');
      const result = registry.unregisterProgram('test-program-v1');

      expect(result).toBe(true);
      expect(registry.getAvailablePrograms()).toHaveLength(1);
      expect(registry.getProgramById('test-program-v1')).toBeUndefined();
    });

    it('should return false for non-existent program', () => {
      const registry = getProgramRegistry();

      const result = registry.unregisterProgram('non-existent');
      expect(result).toBe(false);
    });

    it('should throw error when trying to unregister the only program', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);

      expect(() => registry.unregisterProgram('test-program-v1')).toThrow(
        'Cannot unregister the only active program'
      );
    });

    it('should switch active program when unregistering active one', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);
      await registry.importProgram(anotherPlanJson);

      // First program is active by default
      expect(registry.getActiveProgram()?.id).toBe('test-program-v1');

      registry.unregisterProgram('test-program-v1');

      // Should switch to the other program
      expect(registry.getActiveProgram()?.id).toBe('another-program-v1');
    });
  });

  describe('localStorage Persistence', () => {
    it('should persist programs to localStorage', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);

      expect(localStorageMock.setItem).toHaveBeenCalled();

      // Check that registry key was set
      const registryKey = 'tracker_program_registry';
      const savedData = localStorageMock.getItem(registryKey);
      expect(savedData).not.toBeNull();

      const parsed = JSON.parse(savedData);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('test-program-v1');
    });

    it('should persist active program ID to localStorage', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);

      const activeKey = 'tracker_active_program';
      const savedId = localStorageMock.getItem(activeKey);
      expect(savedId).toBe('"test-program-v1"');
    });

    it('should load persisted data on initialization', async () => {
      // First, save some data
      const registry1 = getProgramRegistry();
      await registry1.importProgram(samplePlanJson);

      // Reset and create new instance (simulating page reload)
      resetProgramRegistry();
      const registry2 = getProgramRegistry();

      const programs = registry2.getAvailablePrograms();
      expect(programs).toHaveLength(1);
      expect(programs[0].id).toBe('test-program-v1');
    });
  });

  describe('extractManifestFromPlan', () => {
    it('should extract manifest from plan JSON', () => {
      const manifest = extractManifestFromPlan(samplePlanJson);

      expect(manifest.id).toBe('test-program-v1');
      expect(manifest.name).toBe('Test Workout Program');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.durationWeeks).toBe(12);
    });

    it('should use defaults for optional fields', () => {
      const minimalPlan = {
        plan: {
          id: 'minimal-program',
          name: 'Minimal Program',
          version: '1.0.0',
          durationWeeks: 4,
        },
      };

      const manifest = extractManifestFromPlan(minimalPlan);

      expect(manifest.description).toBe('');
      expect(manifest.author).toBe('Unknown');
      expect(manifest.targetLevel).toBe('all-levels');
      expect(manifest.goals).toEqual([]);
      expect(manifest.equipment).toEqual([]);
    });
  });

  describe('initializeDefaultProgram', () => {
    it('should register default program when registry is empty', () => {
      initializeDefaultProgram(samplePlanJson);

      const registry = getProgramRegistry();
      const programs = registry.getAvailablePrograms();

      expect(programs).toHaveLength(1);
      expect(programs[0].id).toBe('test-program-v1');
    });

    it('should not re-register if programs already exist', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(anotherPlanJson);

      initializeDefaultProgram(samplePlanJson);

      const programs = registry.getAvailablePrograms();
      expect(programs).toHaveLength(1);
      expect(programs[0].id).toBe('another-program-v1');
    });

    it('should set the default program as active', () => {
      initializeDefaultProgram(samplePlanJson);

      const registry = getProgramRegistry();
      const activeProgram = registry.getActiveProgram();

      expect(activeProgram).not.toBeNull();
      expect(activeProgram?.id).toBe('test-program-v1');
    });
  });

  describe('DEFAULT_PROGRAM_ID', () => {
    it('should export the default program ID constant', () => {
      expect(DEFAULT_PROGRAM_ID).toBe('integrated-strength-v26-9');
    });
  });

  describe('Program Data Storage', () => {
    it('should store program data for a program', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);

      const programData = {
        schedule: [{ w: 1, d: 1, ex: 'Pull-Ups', s: 3, r: '5 reps' }],
        metadata: {
          version: '2.0.0',
          name: 'Test Program',
          durationWeeks: 12,
        },
      };

      registry.setProgramData('test-program-v1', programData);

      const retrieved = registry.getProgramData('test-program-v1');
      expect(retrieved).not.toBeNull();
      expect(retrieved.schedule).toHaveLength(1);
      expect(retrieved.metadata.name).toBe('Test Program');
    });

    it('should return null for non-existent program data', () => {
      const registry = getProgramRegistry();

      const data = registry.getProgramData('non-existent');
      expect(data).toBeNull();
    });

    it('should get active program data', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);

      const programData = {
        schedule: [{ w: 1, d: 1, ex: 'Push-Ups', s: 3, r: '10 reps' }],
        metadata: {
          version: '2.0.0',
          name: 'Active Program',
          durationWeeks: 8,
        },
      };

      registry.setProgramData('test-program-v1', programData);

      const activeData = registry.getActiveProgramData();
      expect(activeData).not.toBeNull();
      expect(activeData.metadata.name).toBe('Active Program');
    });

    it('should return null for active program data when no active program', () => {
      const registry = getProgramRegistry();

      const activeData = registry.getActiveProgramData();
      expect(activeData).toBeNull();
    });

    it('should check if program data exists', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);

      expect(registry.hasProgramData('test-program-v1')).toBe(false);

      registry.setProgramData('test-program-v1', {
        schedule: [],
        metadata: { version: '2.0.0', name: 'Test', durationWeeks: 1 },
      });

      expect(registry.hasProgramData('test-program-v1')).toBe(true);
    });

    it('should remove program data when unregistering a program', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);
      await registry.importProgram(anotherPlanJson);

      registry.setProgramData('test-program-v1', {
        schedule: [],
        metadata: { version: '2.0.0', name: 'Test', durationWeeks: 1 },
      });

      expect(registry.hasProgramData('test-program-v1')).toBe(true);

      registry.setActiveProgram('another-program-v1');
      registry.unregisterProgram('test-program-v1');

      expect(registry.hasProgramData('test-program-v1')).toBe(false);
    });
  });

  describe('getActiveProgramId', () => {
    it('should return null when no active program', () => {
      const registry = getProgramRegistry();
      expect(registry.getActiveProgramId()).toBeNull();
    });

    it('should return the active program ID', async () => {
      const registry = getProgramRegistry();
      await registry.importProgram(samplePlanJson);

      expect(registry.getActiveProgramId()).toBe('test-program-v1');
    });
  });
});
