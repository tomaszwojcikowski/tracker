import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for storage namespace service
 * Tests program-scoped storage key generation and parsing
 */

describe('Storage Namespace Service', () => {
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
  });

  describe('getNamespacedKey', () => {
    it('should create namespaced key with program ID prefix', async () => {
      const { getNamespacedKey, getActiveProgramId } = await import(
        '../services/storageNamespace'
      );

      const programId = getActiveProgramId();
      const namespacedKey = getNamespacedKey('exercise_history');

      expect(namespacedKey).toBe(`p:${programId}:exercise_history`);
    });

    it('should include program ID in namespaced key', async () => {
      const { getNamespacedKeyForProgram } = await import(
        '../services/storageNamespace'
      );

      const key = getNamespacedKeyForProgram('my-program', 'exercise_history');

      expect(key).toBe('p:my-program:exercise_history');
    });
  });

  describe('getSessionKey', () => {
    it('should create namespaced session key', async () => {
      const { getSessionKey, getActiveProgramId } = await import(
        '../services/storageNamespace'
      );

      const programId = getActiveProgramId();
      const sessionKey = getSessionKey(1, 1);

      expect(sessionKey).toBe(`p:${programId}:session_w1d1`);
    });

    it('should create session key for specific program', async () => {
      const { getSessionKeyForProgram } = await import(
        '../services/storageNamespace'
      );

      const sessionKey = getSessionKeyForProgram('my-program', 5, 3);

      expect(sessionKey).toBe('p:my-program:session_w5d3');
    });
  });

  describe('parseNamespacedKey', () => {
    it('should parse namespaced key into components', async () => {
      const { parseNamespacedKey } = await import(
        '../services/storageNamespace'
      );

      const result = parseNamespacedKey('p:my-program:exercise_history');

      expect(result).toEqual({
        programId: 'my-program',
        originalKey: 'exercise_history',
      });
    });

    it('should return null for non-namespaced keys', async () => {
      const { parseNamespacedKey } = await import(
        '../services/storageNamespace'
      );

      const result = parseNamespacedKey('exercise_history');

      expect(result).toBeNull();
    });

    it('should handle session keys correctly', async () => {
      const { parseNamespacedKey } = await import(
        '../services/storageNamespace'
      );

      const result = parseNamespacedKey('p:test-program:session_w1d1');

      expect(result).toEqual({
        programId: 'test-program',
        originalKey: 'session_w1d1',
      });
    });
  });

  describe('parseSessionKey', () => {
    it('should parse session key with namespace', async () => {
      const { parseSessionKey } = await import(
        '../services/storageNamespace'
      );

      const result = parseSessionKey('p:my-program:session_w5d3');

      expect(result).toEqual({ week: 5, day: 3 });
    });

    it('should parse session key without namespace (legacy)', async () => {
      const { parseSessionKey } = await import(
        '../services/storageNamespace'
      );

      const result = parseSessionKey('session_w1d2');

      expect(result).toEqual({ week: 1, day: 2 });
    });

    it('should return null for invalid session keys', async () => {
      const { parseSessionKey } = await import(
        '../services/storageNamespace'
      );

      const result = parseSessionKey('not_a_session_key');

      expect(result).toBeNull();
    });
  });

  describe('shouldBeNamespaced', () => {
    it('should return true for exercise_history', async () => {
      const { shouldBeNamespaced } = await import(
        '../services/storageNamespace'
      );

      expect(shouldBeNamespaced('exercise_history')).toBe(true);
    });

    it('should return true for session keys', async () => {
      const { shouldBeNamespaced } = await import(
        '../services/storageNamespace'
      );

      expect(shouldBeNamespaced('session_w1d1')).toBe(true);
      expect(shouldBeNamespaced('session_w21d5')).toBe(true);
    });

    it('should return true for empty session keys', async () => {
      const { shouldBeNamespaced } = await import(
        '../services/storageNamespace'
      );

      expect(shouldBeNamespaced('session_empty_1234567890')).toBe(true);
    });

    it('should return false for global keys', async () => {
      const { shouldBeNamespaced } = await import(
        '../services/storageNamespace'
      );

      expect(shouldBeNamespaced('tracker_app_state')).toBe(false);
      expect(shouldBeNamespaced('firebase_sync_enabled')).toBe(false);
    });
  });

  describe('isNamespacedKey', () => {
    it('should return true for namespaced keys', async () => {
      const { isNamespacedKey } = await import(
        '../services/storageNamespace'
      );

      expect(isNamespacedKey('p:my-program:exercise_history')).toBe(true);
    });

    it('should return false for non-namespaced keys', async () => {
      const { isNamespacedKey } = await import(
        '../services/storageNamespace'
      );

      expect(isNamespacedKey('exercise_history')).toBe(false);
    });
  });

  describe('getOriginalKey', () => {
    it('should extract original key from namespaced key', async () => {
      const { getOriginalKey } = await import(
        '../services/storageNamespace'
      );

      const result = getOriginalKey('p:my-program:exercise_history');

      expect(result).toBe('exercise_history');
    });

    it('should return key as-is if not namespaced', async () => {
      const { getOriginalKey } = await import(
        '../services/storageNamespace'
      );

      const result = getOriginalKey('exercise_history');

      expect(result).toBe('exercise_history');
    });
  });

  describe('getLegacyKeys', () => {
    it('should find legacy keys that need migration', async () => {
      // Add some legacy keys
      testStorage['session_w1d1'] = JSON.stringify({ completed: true });
      testStorage['exercise_history'] = JSON.stringify({});
      testStorage['tracker_app_state'] = JSON.stringify({}); // Global key, should not be included

      // Mock localStorage.length and localStorage.key
      const keys = Object.keys(testStorage);
      Object.defineProperty(localStorage, 'length', {
        get: () => keys.length,
        configurable: true,
      });
      localStorage.key = vi.fn((i) => keys[i] || null);

      const { getLegacyKeys } = await import(
        '../services/storageNamespace'
      );

      const legacyKeys = getLegacyKeys();

      expect(legacyKeys).toContain('session_w1d1');
      expect(legacyKeys).toContain('exercise_history');
      expect(legacyKeys).not.toContain('tracker_app_state');
    });
  });
});
