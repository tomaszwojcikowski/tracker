/**
 * Time Formatting Utilities
 */

import { MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY } from '../constants';

/**
 * Options for date formatting
 */
export interface DateFormatOptions extends Intl.DateTimeFormatOptions {
  weekday?: 'long' | 'short' | 'narrow';
  month?: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';
  day?: 'numeric' | '2-digit';
  year?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
}

/**
 * Format a timestamp as relative time (e.g., "5 mins ago", "2 hours ago")
 * @param isoTimestamp - ISO timestamp string
 * @returns Formatted relative time or null if invalid
 */
export function formatRelativeTime(isoTimestamp: string | null | undefined): string | null {
  if (!isoTimestamp) return null;
  
  const syncDate = new Date(isoTimestamp);
  
  // Validate date object
  if (isNaN(syncDate.getTime())) {
    console.warn('Invalid timestamp provided to formatRelativeTime:', isoTimestamp);
    return null;
  }
  
  const now = new Date();
  const diffMs = now.getTime() - syncDate.getTime();
  const diffMins = Math.floor(diffMs / MS_PER_MINUTE);
  const diffHours = Math.floor(diffMs / MS_PER_HOUR);
  const diffDays = Math.floor(diffMs / MS_PER_DAY);
  
  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
}

/**
 * Format seconds as MM:SS
 * @param seconds - Total seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Format a date for display
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, options: DateFormatOptions = {}): string {
  const defaultOptions: DateFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  };
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Get ISO date string for today
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current ISO timestamp
 * @returns ISO timestamp string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Parse an ISO date string to Date object
 * @param isoString - ISO date/timestamp string
 * @returns Date object or null if invalid
 */
export function parseISODate(isoString: string): Date | null {
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns true if the date is today
 */
export function isToday(date: string | Date): boolean {
  const checkDate = new Date(date);
  const today = new Date();
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Get the number of days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between dates
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / MS_PER_DAY);
}
