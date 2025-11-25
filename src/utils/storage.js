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
export const safeGetJSON = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        return JSON.parse(item);
    } catch (error) {
        console.warn(`Failed to parse JSON for key "${key}":`, error);
        return defaultValue;
    }
};

/**
 * Safely stringify and save JSON to localStorage
 * @param {string} key - localStorage key
 * @param {*} value - value to stringify and save
 * @returns {boolean} true if successful, false otherwise
 */
export const safeSetJSON = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Failed to save JSON for key "${key}":`, error);
        // Storage might be full
        return false;
    }
};

/**
 * Safely remove item from localStorage
 * @param {string} key - localStorage key
 * @returns {boolean} true if successful, false otherwise
 */
export const safeRemove = (key) => {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Failed to remove key "${key}":`, error);
        return false;
    }
};
