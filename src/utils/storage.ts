/**
 * LocalStorage Utilities
 * 
 * Safe wrappers for localStorage operations with error handling.
 * These functions prevent crashes from quota exceeded, JSON parse errors,
 * or localStorage being unavailable.
 */

import type { StorageResult } from '../types';

/**
 * Safely get and parse JSON from localStorage
 * @param key - localStorage key
 * @param defaultValue - value to return if key doesn't exist or parsing fails
 * @returns parsed value or defaultValue
 */
export function safeGetJSON<T>(key: string, defaultValue: T): T;
export function safeGetJSON<T>(key: string): T | null;
export function safeGetJSON<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue ?? null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to parse JSON for key "${key}":`, error);
    return defaultValue ?? null;
  }
}

/**
 * Safely stringify and save JSON to localStorage
 * @param key - localStorage key
 * @param value - value to stringify and save
 * @returns true if successful, false otherwise
 */
export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save JSON for key "${key}":`, error);
    // Storage might be full
    return false;
  }
}

/**
 * Safely remove item from localStorage
 * @param key - localStorage key
 * @returns true if successful, false otherwise
 */
export function safeRemove(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove key "${key}":`, error);
    return false;
  }
}

/**
 * Get all localStorage keys matching a pattern
 * @param pattern - RegExp pattern to match keys
 * @returns array of matching keys
 */
export function getMatchingKeys(pattern: RegExp): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && pattern.test(key)) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.error('Failed to enumerate localStorage keys:', error);
  }
  return keys;
}

/**
 * Clear all localStorage items matching a prefix
 * @param prefix - key prefix to match
 * @returns number of items removed
 */
export function clearByPrefix(prefix: string): number {
  let count = 0;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      count++;
    });
  } catch (error) {
    console.error(`Failed to clear items with prefix "${prefix}":`, error);
  }
  return count;
}

/**
 * Get storage usage information
 * @returns object with used and available storage info
 */
export function getStorageInfo(): { used: number; available: boolean } {
  let used = 0;
  let available = true;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) ?? '';
        used += key.length + value.length;
      }
    }
    // Convert to bytes (rough estimate, each char is ~2 bytes in UTF-16)
    used *= 2;
  } catch (error) {
    available = false;
  }
  
  return { used, available };
}

/**
 * Type-safe storage result wrapper
 * @param key - localStorage key
 * @param operation - operation description for error messages
 * @param fn - function to execute
 * @returns StorageResult with data or error
 */
export function withStorageResult<T>(
  key: string,
  operation: string,
  fn: () => T
): StorageResult<T> {
  try {
    const data = fn();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `${operation} for "${key}" failed: ${message}` };
  }
}
