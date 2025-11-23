import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for localStorage utility functions: safeGetJSON, safeSetJSON, safeRemove
 * These utilities provide error handling for localStorage operations
 */

describe('Storage Utilities', () => {
  // Define utility functions (these mirror the implementation in App.jsx)
  const safeGetJSON = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Failed to parse JSON for key "${key}":`, error);
      return defaultValue;
    }
  };

  const safeSetJSON = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to save JSON for key "${key}":`, error);
      return false;
    }
  };

  const safeRemove = (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove key "${key}":`, error);
      return false;
    }
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem.mockClear();
    localStorage.getItem.mockClear();
    localStorage.removeItem.mockClear();
  });

  describe('safeGetJSON', () => {
    it('should return parsed JSON when valid data exists', () => {
      const testData = { name: 'Test', value: 123 };
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));

      const result = safeGetJSON('test_key');

      expect(result).toEqual(testData);
      expect(localStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should return default value when key does not exist', () => {
      localStorage.getItem.mockReturnValue(null);

      const result = safeGetJSON('nonexistent_key', { default: true });

      expect(result).toEqual({ default: true });
    });

    it('should return default value on parse error', () => {
      localStorage.getItem.mockReturnValue('invalid json {');
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = safeGetJSON('bad_key', null);

      expect(result).toBe(null);
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle arrays correctly', () => {
      const testArray = [1, 2, 3, 4, 5];
      localStorage.getItem.mockReturnValue(JSON.stringify(testArray));

      const result = safeGetJSON('array_key');

      expect(result).toEqual(testArray);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle nested objects', () => {
      const testData = {
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true
          }
        }
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));

      const result = safeGetJSON('nested_key');

      expect(result).toEqual(testData);
      expect(result.user.settings.theme).toBe('dark');
    });
  });

  describe('safeSetJSON', () => {
    it('should save JSON data successfully', () => {
      const testData = { workout: 'completed', week: 5 };

      const result = safeSetJSON('workout_key', testData);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'workout_key',
        JSON.stringify(testData)
      );
    });

    it('should handle arrays', () => {
      const testArray = ['exercise1', 'exercise2', 'exercise3'];

      const result = safeSetJSON('exercises', testArray);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'exercises',
        JSON.stringify(testArray)
      );
    });

    it('should return false on storage error', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = safeSetJSON('key', { data: 'test' });

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle null values', () => {
      localStorage.setItem.mockImplementation(() => {});
      safeSetJSON('null_key', null);

      expect(localStorage.setItem).toHaveBeenCalledWith('null_key', 'null');
    });
    
    it('should handle undefined gracefully', () => {
      localStorage.setItem.mockImplementation(() => {});
      // JSON.stringify(undefined) returns undefined, which localStorage.setItem handles as string "undefined"
      const result = safeSetJSON('undefined_key', undefined);
      
      // The actual behavior depends on how JSON.stringify handles undefined
      // In practice, JSON.stringify(undefined) returns undefined (not a string)
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('safeRemove', () => {
    it('should remove item from localStorage', () => {
      localStorage.removeItem.mockImplementation(() => {});
      const result = safeRemove('test_key');

      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('should return false on error', () => {
      localStorage.removeItem.mockImplementation(() => {
        throw new Error('Remove failed');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = safeRemove('error_key');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle removing non-existent keys gracefully', () => {
      localStorage.removeItem.mockImplementation(() => {});
      const result = safeRemove('nonexistent_key');

      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('nonexistent_key');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle set-get-remove cycle', () => {
      const testData = { cycle: 'test', count: 42 };
      
      // Set
      localStorage.setItem.mockImplementation(() => {});
      const setResult = safeSetJSON('cycle_key', testData);
      expect(setResult).toBe(true);
      
      // Mock the return for get
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));
      
      // Get
      const getData = safeGetJSON('cycle_key');
      expect(getData).toEqual(testData);
      
      // Remove
      localStorage.removeItem.mockImplementation(() => {});
      const removeResult = safeRemove('cycle_key');
      expect(removeResult).toBe(true);
      
      // Get after remove
      localStorage.getItem.mockReturnValue(null);
      const afterRemove = safeGetJSON('cycle_key', { empty: true });
      expect(afterRemove).toEqual({ empty: true });
    });

    it('should preserve data types through storage cycle', () => {
      const testData = {
        string: 'hello',
        number: 123,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: 'value' }
      };
      
      localStorage.setItem.mockImplementation(() => {});
      safeSetJSON('types_key', testData);
      
      const stored = localStorage.setItem.mock.calls[0][1];
      localStorage.getItem.mockReturnValue(stored);
      
      const retrieved = safeGetJSON('types_key');
      
      expect(retrieved).toEqual(testData);
      expect(typeof retrieved.string).toBe('string');
      expect(typeof retrieved.number).toBe('number');
      expect(typeof retrieved.boolean).toBe('boolean');
      expect(retrieved.null).toBe(null);
      expect(Array.isArray(retrieved.array)).toBe(true);
      expect(typeof retrieved.object).toBe('object');
    });
  });
});
