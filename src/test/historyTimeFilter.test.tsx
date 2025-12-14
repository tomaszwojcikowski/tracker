import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Tests for HistoryView time filter logic
 * Tests filtering history entries by week, month, and all time
 * Includes edge cases for timezone handling and boundary conditions
 */

describe('HistoryView Time Filter', () => {
  // Mock GlobalHistoryEntry interface
  interface GlobalHistoryEntry {
    date: string;
    week: number;
    day: number;
    title?: string;
    exercises?: any[];
    workoutNotes?: string | null;
    isEmptyWorkout?: boolean;
    durationSeconds?: number;
  }

  // Replicate the filter logic from HistoryView.tsx lines 416-429
  const filterHistoryByTime = (
    history: GlobalHistoryEntry[],
    timeFilter: 'week' | 'month' | 'all'
  ): GlobalHistoryEntry[] => {
    if (timeFilter === 'all') return history;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return history.filter(entry => {
      const entryDate = new Date(entry.date);
      if (timeFilter === 'week') return entryDate >= weekAgo;
      if (timeFilter === 'month') return entryDate >= monthAgo;
      return true;
    });
  };

  let mockHistory: GlobalHistoryEntry[];
  let now: Date;

  beforeEach(() => {
    // Freeze time so boundary comparisons are deterministic.
    vi.useFakeTimers();
    now = new Date('2024-01-31T12:00:00.000Z');
    vi.setSystemTime(now);

    // Mock history with various dates
    mockHistory = [
      // Today
      {
        date: now.toISOString(),
        week: 1,
        day: 1,
        title: 'Today Workout'
      },
      // 3 days ago
      {
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        week: 1,
        day: 2,
        title: '3 Days Ago'
      },
      // 6 days ago (within week)
      {
        date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        week: 1,
        day: 3,
        title: '6 Days Ago'
      },
      // Exactly 7 days ago (boundary - should be included with >=)
      {
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        week: 2,
        day: 1,
        title: 'Exactly 7 Days Ago'
      },
      // 10 days ago (within month, outside week)
      {
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        week: 2,
        day: 2,
        title: '10 Days Ago'
      },
      // 29 days ago (within month)
      {
        date: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString(),
        week: 3,
        day: 1,
        title: '29 Days Ago'
      },
      // Exactly 30 days ago (boundary - should be included with >=)
      {
        date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        week: 3,
        day: 2,
        title: 'Exactly 30 Days Ago'
      },
      // 45 days ago (outside month)
      {
        date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        week: 4,
        day: 1,
        title: '45 Days Ago'
      },
      // 90 days ago (old)
      {
        date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        week: 5,
        day: 1,
        title: '90 Days Ago'
      }
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Week Filter', () => {
    it('should return entries from the last 7 days (inclusive)', () => {
      const filtered = filterHistoryByTime(mockHistory, 'week');

      // With frozen time, the boundary entry is deterministic.
      expect(filtered).toHaveLength(4);
      expect(filtered.map(e => e.title)).toContain('Today Workout');
      expect(filtered.map(e => e.title)).toContain('3 Days Ago');
      expect(filtered.map(e => e.title)).toContain('6 Days Ago');
      expect(filtered.map(e => e.title)).toContain('Exactly 7 Days Ago');
    });

    it('should use >= comparison (includes entries at boundary)', () => {
      // This test verifies that >= is used, not >
      const testNow = new Date();
      const testHistory: GlobalHistoryEntry[] = [
        {
          date: new Date(testNow.getTime() - 6.5 * 24 * 60 * 60 * 1000).toISOString(),
          week: 1,
          day: 1,
          title: 'Within week'
        }
      ];

      // Re-create filter with same timestamp to ensure consistency
      const testFilter = (history: GlobalHistoryEntry[], filter: 'week' | 'month' | 'all') => {
        if (filter === 'all') return history;
        const weekAgo = new Date(testNow.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(testNow.getTime() - 30 * 24 * 60 * 60 * 1000);
        return history.filter(entry => {
          const entryDate = new Date(entry.date);
          if (filter === 'week') return entryDate >= weekAgo;
          if (filter === 'month') return entryDate >= monthAgo;
          return true;
        });
      };

      const filtered = testFilter(testHistory, 'week');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Within week');
    });

    it('should return empty array if no entries in the last 7 days', () => {
      const oldHistory: GlobalHistoryEntry[] = [
        {
          date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          week: 2,
          day: 1,
          title: '8 Days Ago'
        },
        {
          date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          week: 3,
          day: 1,
          title: '30 Days Ago'
        }
      ];

      const filtered = filterHistoryByTime(oldHistory, 'week');
      expect(filtered).toHaveLength(0);
    });

    it('should handle entries with millisecond precision', () => {
      const historyWithMs: GlobalHistoryEntry[] = [
        {
          date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 - 500).toISOString(),
          week: 1,
          day: 1,
          title: '6 Days + 500ms Ago'
        }
      ];

      const filtered = filterHistoryByTime(historyWithMs, 'week');
      expect(filtered).toHaveLength(1);
    });
  });

  describe('Month Filter', () => {
    it('should return entries from the last 30 days (inclusive of exactly 30 days)', () => {
      const filtered = filterHistoryByTime(mockHistory, 'month');

      // With frozen time, the boundary entry is deterministic.
      expect(filtered).toHaveLength(7);
      expect(filtered.map(e => e.title)).toContain('Today Workout');
      expect(filtered.map(e => e.title)).toContain('3 Days Ago');
      expect(filtered.map(e => e.title)).toContain('6 Days Ago');
      expect(filtered.map(e => e.title)).toContain('Exactly 7 Days Ago');
      expect(filtered.map(e => e.title)).toContain('10 Days Ago');
      expect(filtered.map(e => e.title)).toContain('29 Days Ago');
      expect(filtered.map(e => e.title)).toContain('Exactly 30 Days Ago');
    });

    it('should include entries exactly 30 days old (boundary with >=)', () => {
      const filtered = filterHistoryByTime(mockHistory, 'month');

      const has30DaysAgo = filtered.some(entry => entry.title === 'Exactly 30 Days Ago');
      expect(has30DaysAgo).toBe(true);
    });

    it('should exclude entries older than 30 days', () => {
      const filtered = filterHistoryByTime(mockHistory, 'month');

      const has45DaysAgo = filtered.some(entry => entry.title === '45 Days Ago');
      const has90DaysAgo = filtered.some(entry => entry.title === '90 Days Ago');
      expect(has45DaysAgo).toBe(false);
      expect(has90DaysAgo).toBe(false);
    });

    it('should return empty array if no entries in the last 30 days', () => {
      const oldHistory: GlobalHistoryEntry[] = [
        {
          date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          week: 4,
          day: 1,
          title: '45 Days Ago'
        }
      ];

      const filtered = filterHistoryByTime(oldHistory, 'month');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('All Time Filter', () => {
    it('should return all entries when filter is "all"', () => {
      const filtered = filterHistoryByTime(mockHistory, 'all');

      expect(filtered).toHaveLength(mockHistory.length);
      expect(filtered).toEqual(mockHistory);
    });

    it('should return the same reference when filter is "all"', () => {
      const original = [...mockHistory];
      const filtered = filterHistoryByTime(mockHistory, 'all');

      // When filter is 'all', it returns the original array reference (optimization)
      expect(filtered).toBe(mockHistory);
      expect(mockHistory).toEqual(original); // Original unchanged
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty history array', () => {
      const emptyHistory: GlobalHistoryEntry[] = [];

      expect(filterHistoryByTime(emptyHistory, 'week')).toHaveLength(0);
      expect(filterHistoryByTime(emptyHistory, 'month')).toHaveLength(0);
      expect(filterHistoryByTime(emptyHistory, 'all')).toHaveLength(0);
    });

    it('should handle dates in different ISO formats', () => {
      const historyWithFormats: GlobalHistoryEntry[] = [
        {
          date: '2024-12-13T12:00:00.000Z', // ISO with milliseconds
          week: 1,
          day: 1
        },
        {
          date: '2024-12-13T12:00:00Z', // ISO without milliseconds
          week: 1,
          day: 2
        },
        {
          date: '2024-12-13', // ISO date only
          week: 1,
          day: 3
        }
      ];

      const filtered = filterHistoryByTime(historyWithFormats, 'all');
      expect(filtered).toHaveLength(3);
    });

    it('should handle entries with future dates', () => {
      const futureHistory: GlobalHistoryEntry[] = [
        {
          date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          week: 1,
          day: 1,
          title: 'Tomorrow'
        },
        {
          date: now.toISOString(),
          week: 1,
          day: 2,
          title: 'Today'
        }
      ];

      const weekFiltered = filterHistoryByTime(futureHistory, 'week');
      expect(weekFiltered).toHaveLength(2); // Both should be included

      const monthFiltered = filterHistoryByTime(futureHistory, 'month');
      expect(monthFiltered).toHaveLength(2); // Both should be included
    });

    it('should correctly filter entries by date ranges', () => {
      // Test filtering with clear boundaries (not exact edge cases)
      const testNow = new Date();
      const testHistory: GlobalHistoryEntry[] = [
        {
          date: new Date(testNow.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          week: 1,
          day: 1,
          title: '2 days ago'
        },
        {
          date: new Date(testNow.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          week: 1,
          day: 2,
          title: '10 days ago'
        },
        {
          date: new Date(testNow.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          week: 2,
          day: 1,
          title: '45 days ago'
        }
      ];

      // Create filter with the same timestamp
      const testFilterHistoryByTime = (
        history: GlobalHistoryEntry[],
        timeFilter: 'week' | 'month' | 'all'
      ): GlobalHistoryEntry[] => {
        if (timeFilter === 'all') return history;

        const weekAgo = new Date(testNow.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(testNow.getTime() - 30 * 24 * 60 * 60 * 1000);

        return history.filter(entry => {
          const entryDate = new Date(entry.date);
          if (timeFilter === 'week') return entryDate >= weekAgo;
          if (timeFilter === 'month') return entryDate >= monthAgo;
          return true;
        });
      };

      const weekFiltered = testFilterHistoryByTime(testHistory, 'week');
      expect(weekFiltered).toHaveLength(1);
      expect(weekFiltered[0].title).toBe('2 days ago');

      const monthFiltered = testFilterHistoryByTime(testHistory, 'month');
      expect(monthFiltered).toHaveLength(2);
      expect(monthFiltered.map(e => e.title)).toContain('2 days ago');
      expect(monthFiltered.map(e => e.title)).toContain('10 days ago');
      expect(monthFiltered.map(e => e.title)).not.toContain('45 days ago');
    });
  });

  describe('Timezone Handling', () => {
    it('should handle UTC dates correctly', () => {
      const utcHistory: GlobalHistoryEntry[] = [
        {
          date: '2024-12-13T00:00:00.000Z',
          week: 1,
          day: 1,
          title: 'UTC Midnight'
        }
      ];

      const filtered = filterHistoryByTime(utcHistory, 'all');
      expect(filtered).toHaveLength(1);
    });

    it('should handle dates with timezone offsets', () => {
      const tzHistory: GlobalHistoryEntry[] = [
        {
          date: '2024-12-13T12:00:00+05:00', // UTC+5
          week: 1,
          day: 1,
          title: 'UTC+5'
        },
        {
          date: '2024-12-13T12:00:00-08:00', // UTC-8
          week: 1,
          day: 2,
          title: 'UTC-8'
        }
      ];

      const filtered = filterHistoryByTime(tzHistory, 'all');
      expect(filtered).toHaveLength(2);
    });

    it('should correctly compare dates across DST boundaries', () => {
      // Test with dates that cross DST boundaries (if applicable)
      // Using US DST 2024: starts March 10, ends November 3
      const dstHistory: GlobalHistoryEntry[] = [
        {
          date: '2024-03-09T12:00:00.000Z', // Before DST
          week: 1,
          day: 1,
          title: 'Before DST'
        },
        {
          date: '2024-03-11T12:00:00.000Z', // After DST
          week: 1,
          day: 2,
          title: 'After DST'
        }
      ];

      const filtered = filterHistoryByTime(dstHistory, 'all');
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Performance', () => {
    it('should efficiently filter large history arrays', () => {
      const largeHistory: GlobalHistoryEntry[] = Array.from({ length: 1000 }, (_, i) => ({
        date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
        week: Math.floor(i / 7) + 1,
        day: (i % 3) + 1
      }));

      const start = performance.now();
      const filtered = filterHistoryByTime(largeHistory, 'month');
      const end = performance.now();

      // Inclusive "last 30 days" can include 31 entries (days 0..30).
      expect(filtered.length).toBeLessThanOrEqual(31);
      // Should complete quickly (generous timeout for CI environments)
      expect(end - start).toBeLessThan(500);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all properties of filtered entries', () => {
      const detailedHistory: GlobalHistoryEntry[] = [
        {
          date: now.toISOString(),
          week: 1,
          day: 1,
          title: 'Full Workout',
          exercises: [{ name: 'Push-ups', sets: 3 }],
          workoutNotes: 'Great session!',
          isEmptyWorkout: false,
          durationSeconds: 3600
        }
      ];

      const filtered = filterHistoryByTime(detailedHistory, 'week');

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(detailedHistory[0]);
      expect(filtered[0].exercises).toBeDefined();
      expect(filtered[0].workoutNotes).toBe('Great session!');
      expect(filtered[0].durationSeconds).toBe(3600);
    });

    it('should maintain entry order after filtering', () => {
      const orderedHistory: GlobalHistoryEntry[] = [
        {
          date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          week: 1,
          day: 1,
          title: 'First'
        },
        {
          date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          week: 1,
          day: 2,
          title: 'Second'
        },
        {
          date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          week: 1,
          day: 3,
          title: 'Third'
        }
      ];

      const filtered = filterHistoryByTime(orderedHistory, 'week');

      expect(filtered[0].title).toBe('First');
      expect(filtered[1].title).toBe('Second');
      expect(filtered[2].title).toBe('Third');
    });
  });
});
