/**
 * String Utility Functions
 *
 * This module provides common string manipulation utilities used throughout the app.
 */

/**
 * Normalize string for comparison by trimming whitespace and converting to lowercase
 * @param str - String to normalize
 * @returns Normalized string
 */
export function normalizeString(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * Parse integer with explicit base 10 (safer than parseInt default)
 * @param value - String to parse
 * @returns Parsed integer
 */
export function parseIntSafe(value: string): number {
  return parseInt(value, 10);
}

/**
 * Parse float from string
 * @param value - String to parse
 * @returns Parsed float
 */
export function parseFloatSafe(value: string): number {
  return parseFloat(value);
}
