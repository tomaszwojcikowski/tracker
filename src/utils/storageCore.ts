/**
 * Core localStorage Utilities
 *
 * This module provides foundational localStorage utilities with no dependencies.
 * It's designed to be imported by other modules without creating circular dependencies.
 *
 * These utilities are used by:
 * - src/utils/storage.ts (main storage utilities)
 * - src/services/programRegistry.ts (program management)
 */

/**
 * Safely get and parse JSON from localStorage
 * @param key - Storage key
 * @param defaultValue - Value to return if key doesn't exist or parsing fails
 * @returns Parsed value or default
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
 * @param key - Storage key
 * @param value - Value to store
 * @returns True if successful, false otherwise
 */
export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save JSON for key "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove item from localStorage
 * @param key - Storage key
 * @returns True if successful, false otherwise
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
