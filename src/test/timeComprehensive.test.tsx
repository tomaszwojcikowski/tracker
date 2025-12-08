/**
 * Comprehensive tests for time utilities
 * Tests the actual time.ts module exports
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatRelativeTime,
  formatTime,
  formatDate,
  getTodayISO,
  getCurrentTimestamp,
  parseISODate,
  isToday,
  daysBetween,
} from '../utils/time';

describe('Time Utilities Comprehensive Tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('formatRelativeTime', () => {
    it('should return null for null input', () => {
      expect(formatRelativeTime(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(formatRelativeTime(undefined)).toBeNull();
    });

    it('should return null for invalid timestamp', () => {
      expect(formatRelativeTime('invalid-date')).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should return "just now" for very recent timestamps', () => {
      const now = new Date().toISOString();

      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('should return minutes ago for recent timestamps', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 mins ago');
    });

    it('should return "1 min ago" for singular minute', () => {
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();

      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 min ago');
    });

    it('should return hours ago for timestamps within 24 hours', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

      expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
    });

    it('should return "1 hour ago" for singular hour', () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
    });

    it('should return days ago for older timestamps', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

      expect(formatRelativeTime(twoDaysAgo)).toBe('2 days ago');
    });

    it('should return "1 day ago" for singular day', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

      expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');
    });

    it('should handle edge case at 59 minutes', () => {
      const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60 * 1000).toISOString();

      expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59 mins ago');
    });

    it('should handle edge case at 23 hours', () => {
      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();

      expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23 hours ago');
    });
  });

  describe('formatTime', () => {
    it('should format 0 seconds', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    it('should format seconds only', () => {
      expect(formatTime(45)).toBe('0:45');
    });

    it('should format minutes and seconds', () => {
      expect(formatTime(90)).toBe('1:30');
    });

    it('should pad seconds with zero', () => {
      expect(formatTime(65)).toBe('1:05');
    });

    it('should handle large values', () => {
      expect(formatTime(3600)).toBe('60:00');
      expect(formatTime(3661)).toBe('61:01');
    });
  });

  describe('formatDate', () => {
    it('should format date with default options', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);

      // Should contain short weekday, month, and day
      expect(formatted).toMatch(/\w+/);
      expect(formatted).toContain('15');
    });

    it('should format date string input', () => {
      const formatted = formatDate('2024-06-20');

      expect(formatted).toContain('20');
    });

    it('should accept custom options', () => {
      const formatted = formatDate('2024-01-15', {
        weekday: 'long',
        month: 'long',
        year: 'numeric',
      });

      expect(formatted).toContain('2024');
    });
  });

  describe('getTodayISO', () => {
    it('should return ISO date string', () => {
      const result = getTodayISO();

      // Should match YYYY-MM-DD format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return today\'s date', () => {
      const result = getTodayISO();
      const expected = new Date().toISOString().split('T')[0];

      expect(result).toBe(expected);
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return ISO timestamp', () => {
      const result = getCurrentTimestamp();

      // Should be parseable as date
      expect(new Date(result).getTime()).not.toBeNaN();
    });

    it('should include time component', () => {
      const result = getCurrentTimestamp();

      expect(result).toContain('T');
    });
  });

  describe('parseISODate', () => {
    it('should parse valid ISO date string', () => {
      const result = parseISODate('2024-01-15');

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(15);
    });

    it('should parse valid ISO timestamp', () => {
      const result = parseISODate('2024-01-15T10:30:00Z');

      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for invalid string', () => {
      expect(parseISODate('invalid')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseISODate('')).toBeNull();
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();

      expect(isToday(today)).toBe(true);
    });

    it('should return true for today ISO string', () => {
      const todayISO = new Date().toISOString().split('T')[0];

      expect(isToday(todayISO)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      expect(isToday(tomorrow)).toBe(false);
    });

    it('should return false for last year same day', () => {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);

      expect(isToday(lastYear)).toBe(false);
    });
  });

  describe('daysBetween', () => {
    it('should return 0 for same day', () => {
      const date = '2024-01-15';

      expect(daysBetween(date, date)).toBe(0);
    });

    it('should return 1 for consecutive days', () => {
      expect(daysBetween('2024-01-15', '2024-01-16')).toBe(1);
    });

    it('should return positive number regardless of order', () => {
      expect(daysBetween('2024-01-15', '2024-01-20')).toBe(5);
      expect(daysBetween('2024-01-20', '2024-01-15')).toBe(5);
    });

    it('should handle month boundaries', () => {
      expect(daysBetween('2024-01-30', '2024-02-02')).toBe(3);
    });

    it('should handle year boundaries', () => {
      expect(daysBetween('2023-12-31', '2024-01-02')).toBe(2);
    });

    it('should handle Date objects', () => {
      const date1 = new Date('2024-01-10');
      const date2 = new Date('2024-01-15');

      expect(daysBetween(date1, date2)).toBe(5);
    });
  });
});
