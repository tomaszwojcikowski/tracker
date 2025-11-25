import { safeGetJSON, safeSetJSON } from './storage';

/**
 * LocalStorage Utilities
 * 
 * Safe wrappers for localStorage operations with error handling.
 * These functions prevent crashes from quota exceeded, JSON parse errors,
 * or localStorage being unavailable.
 */

/**
 * Safely get and parse JSON from localStorage
 * @param {string} key - localStorage key
 * @param {*} defaultValue - value to return if key doesn't exist or parsing fails
 * @returns {*} parsed value or defaultValue
 */
export { safeGetJSON } from './storage-core';

/**
 * Safely stringify and save JSON to localStorage
 * @param {string} key - localStorage key
 * @param {*} value - value to stringify and save
 * @returns {boolean} true if successful, false otherwise
 */
export { safeSetJSON } from './storage-core';

/**
 * Safely remove item from localStorage
 * @param {string} key - localStorage key
 * @returns {boolean} true if successful, false otherwise
 */
export { safeRemove } from './storage-core';
