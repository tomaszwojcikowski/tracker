import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for storage migration utility
 * Tests one-time migration of legacy storage keys to namespaced keys
 */

describe('Storage Migration', () => {
  // Test storage mock
  let testStorage = {};

  // Mock localStorage
  beforeEach(() => {
    testStorage = {};
    localStorage.clear();
    localStorage.setItem.mockClear();
    localStorage.getItem.mockClear();
    localStorage.removeItem.mockClear();

    // Set up program registry for tests (store as JSON strings)
    const registryData = [
      {
        id: 'test-program-1',
        name: 'Test Program',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        durationWeeks: 21,
        targetLevel: 'intermediate',
        goals: [],
        equipment: [],
        dataPath: '',
        isActive: true,
        installedAt: new Date().toISOString(),
      },
    ];
    testStorage['tracker_program_registry'] = JSON.stringify(registryData);
    testStorage['tracker_active_program'] = JSON.stringify('test-program-1');

    localStorage.getItem.mockImplementation((key) => {
      if (testStorage[key] !== undefined) {
        return testStorage[key];
      }
      return null;
    });

    localStorage.setItem.mockImplementation((key, value) => {
      testStorage[key] = value;
    });

    localStorage.removeItem.mockImplementation((key) => {
      delete testStorage[key];
    });
  });

  // Helper to set up localStorage.length and key()
  function setupLocalStorageMock() {
    const keys = Object.keys(testStorage);
    Object.defineProperty(localStorage, 'length', {
      get: () => keys.length,
      configurable: true,
    });
    localStorage.key = vi.fn((i) => keys[i] || null);
  }

  describe('isMigrationCompleted', () => {
    it('should return false when no migration has occurred', async () => {
      const { isMigrationCompleted } = await import(
        '../services/storageMigration'
      );

      expect(isMigrationCompleted()).toBe(false);
    });

    it('should return true when migration status exists', async () => {
      testStorage['tracker_storage_migration_v1'] = JSON.stringify({
        version: 1,
        completedAt: new Date().toISOString(),
        keysMigrated: 5,
        targetProgramId: 'test-program-1',
        legacyKeysCleaned: false,
      });

      const { isMigrationCompleted } = await import(
        '../services/storageMigration'
      );

      expect(isMigrationCompleted()).toBe(true);
    });
  });

  describe('needsMigration', () => {
    it('should return false when already migrated', async () => {
      testStorage['tracker_storage_migration_v1'] = JSON.stringify({
        version: 1,
        completedAt: new Date().toISOString(),
        keysMigrated: 0,
        targetProgramId: 'test-program-1',
        legacyKeysCleaned: true,
      });

      const { needsMigration } = await import(
        '../services/storageMigration'
      );

      expect(needsMigration()).toBe(false);
    });

    it('should return true when legacy keys exist', async () => {
      testStorage['session_w1d1'] = JSON.stringify({ completed: true });
      testStorage['exercise_history'] = JSON.stringify({});
      setupLocalStorageMock();

      const { needsMigration } = await import(
        '../services/storageMigration'
      );

      expect(needsMigration()).toBe(true);
    });

    it('should return false when no legacy keys exist', async () => {
      setupLocalStorageMock();

      const { needsMigration } = await import(
        '../services/storageMigration'
      );

      // No legacy keys, but not yet marked as migrated
      // When there are no keys to migrate and not yet marked complete, returns false
      expect(needsMigration()).toBe(false);
    });
  });

  describe('runMigration', () => {
    it('should migrate legacy keys to namespaced keys', async () => {
      // Add legacy data
      const legacySessionData = { completed: true, lastModified: '2024-01-15' };
      const legacyHistory = { 'Pull-Ups': [{ date: '2024-01-15', sets: 3 }] };
      
      testStorage['session_w1d1'] = JSON.stringify(legacySessionData);
      testStorage['exercise_history'] = JSON.stringify(legacyHistory);
      setupLocalStorageMock();

      const { runMigration } = await import(
        '../services/storageMigration'
      );

      const result = runMigration('test-program-1');

      expect(result.success).toBe(true);
      expect(result.keysMigrated).toBe(2);
      expect(result.migratedKeys).toContain('session_w1d1');
      expect(result.migratedKeys).toContain('exercise_history');

      // Check namespaced keys were created
      expect(testStorage['p:test-program-1:session_w1d1']).toBeDefined();
      expect(testStorage['p:test-program-1:exercise_history']).toBeDefined();
    });

    it('should not overwrite existing namespaced data', async () => {
      // Add legacy data and existing namespaced data
      testStorage['session_w1d1'] = JSON.stringify({ completed: false });
      testStorage['p:test-program-1:session_w1d1'] = JSON.stringify({ completed: true });
      setupLocalStorageMock();

      const { runMigration } = await import(
        '../services/storageMigration'
      );

      const result = runMigration('test-program-1');

      // Should still report success, skipping the existing key
      expect(result.success).toBe(true);

      // Namespaced data should remain unchanged
      const namespacedData = JSON.parse(testStorage['p:test-program-1:session_w1d1']);
      expect(namespacedData.completed).toBe(true);
    });

    it('should clean up legacy keys when requested', async () => {
      testStorage['session_w1d1'] = JSON.stringify({ completed: true });
      setupLocalStorageMock();

      const { runMigration } = await import(
        '../services/storageMigration'
      );

      const result = runMigration('test-program-1', true);

      expect(result.success).toBe(true);
      // Legacy key should be removed
      expect(testStorage['session_w1d1']).toBeUndefined();
    });

    it('should save migration status after completion', async () => {
      testStorage['session_w1d1'] = JSON.stringify({ completed: true });
      setupLocalStorageMock();

      const { runMigration, getMigrationStatus } = await import(
        '../services/storageMigration'
      );

      runMigration('test-program-1');

      const status = getMigrationStatus();
      expect(status).not.toBeNull();
      expect(status.version).toBe(1);
      expect(status.targetProgramId).toBe('test-program-1');
      expect(status.keysMigrated).toBe(1);
    });
  });

  describe('autoMigrate', () => {
    it('should run migration automatically if needed', async () => {
      testStorage['session_w1d1'] = JSON.stringify({ completed: true });
      setupLocalStorageMock();

      const { autoMigrate, isMigrationCompleted } = await import(
        '../services/storageMigration'
      );

      const result = autoMigrate();

      expect(result).toBe(true);
      expect(isMigrationCompleted()).toBe(true);
    });

    it('should skip migration if already completed', async () => {
      testStorage['tracker_storage_migration_v1'] = JSON.stringify({
        version: 1,
        completedAt: new Date().toISOString(),
        keysMigrated: 0,
        targetProgramId: 'test-program-1',
        legacyKeysCleaned: true,
      });

      const { autoMigrate } = await import(
        '../services/storageMigration'
      );

      const result = autoMigrate();

      expect(result).toBe(true);
    });
  });

  describe('cleanupLegacyKeys', () => {
    it('should remove legacy keys that have been migrated', async () => {
      // Set up migrated state
      testStorage['session_w1d1'] = JSON.stringify({ completed: true });
      testStorage['p:test-program-1:session_w1d1'] = JSON.stringify({ completed: true });
      testStorage['tracker_storage_migration_v1'] = JSON.stringify({
        version: 1,
        completedAt: new Date().toISOString(),
        keysMigrated: 1,
        targetProgramId: 'test-program-1',
        legacyKeysCleaned: false,
      });
      setupLocalStorageMock();

      const { cleanupLegacyKeys } = await import(
        '../services/storageMigration'
      );

      const removedCount = cleanupLegacyKeys();

      expect(removedCount).toBe(1);
      expect(testStorage['session_w1d1']).toBeUndefined();
    });

    it('should not remove legacy keys if namespaced version missing', async () => {
      testStorage['session_w1d1'] = JSON.stringify({ completed: true });
      // No namespaced version exists
      testStorage['tracker_storage_migration_v1'] = JSON.stringify({
        version: 1,
        completedAt: new Date().toISOString(),
        keysMigrated: 1,
        targetProgramId: 'test-program-1',
        legacyKeysCleaned: false,
      });
      setupLocalStorageMock();

      const { cleanupLegacyKeys } = await import(
        '../services/storageMigration'
      );
      
      // Suppress console.warn during test
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const removedCount = cleanupLegacyKeys();

      expect(removedCount).toBe(0);
      expect(testStorage['session_w1d1']).toBeDefined();
      
      warnSpy.mockRestore();
    });
  });
});
