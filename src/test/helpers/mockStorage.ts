/**
 * Mock Storage Helpers for Testing
 *
 * This module provides reusable mock localStorage implementations for tests.
 */

/**
 * Create a mock localStorage implementation
 * @returns Mock storage object with standard localStorage methods
 */
export function createMockStorage() {
  const storage: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => storage[key] ?? null,
    setItem: (key: string, value: string): void => {
      storage[key] = value;
    },
    removeItem: (key: string): void => {
      delete storage[key];
    },
    clear: (): void => {
      Object.keys(storage).forEach(k => delete storage[k]);
    },
    get length(): number {
      return Object.keys(storage).length;
    },
    key: (index: number): string | null => {
      const keys = Object.keys(storage);
      return keys[index] ?? null;
    },
    // Helper to access raw storage data for assertions
    get data(): Record<string, string> {
      return storage;
    },
  };
}

/**
 * Create a mock localStorage with safe JSON helpers
 * @returns Mock storage with JSON helpers
 */
export function createMockStorageWithJSON() {
  const mockStorage = createMockStorage();

  return {
    ...mockStorage,
    getJSON: <T>(key: string, defaultValue?: T): T | null => {
      try {
        const item = mockStorage.getItem(key);
        if (item === null) return defaultValue ?? null;
        return JSON.parse(item) as T;
      } catch (error) {
        return defaultValue ?? null;
      }
    },
    setJSON: <T>(key: string, value: T): boolean => {
      try {
        mockStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        return false;
      }
    },
  };
}
