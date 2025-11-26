import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for resume workout functionality
 * Tests detecting in-progress workouts, progress tracking, and session data parsing
 */

describe('Resume Workout Feature', () => {
  // Storage simulation
  let testStorage = {};

  // Utility functions from storage.ts
  const safeGetJSON = (key, defaultValue = null) => {
    try {
      const item = testStorage[key];
      if (item === undefined) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      return defaultValue;
    }
  };

  const safeSetJSON = (key, value) => {
    try {
      testStorage[key] = JSON.stringify(value);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Count completed sets from session data (mirrors implementation)
  const countSetsFromSession = (session) => {
    let completedSets = 0;
    let totalSets = 0;

    for (const [key, value] of Object.entries(session)) {
      // Skip metadata fields
      if (['completed', 'completedAt', 'lastModified', 'week', 'day', 'workoutNotes', 'addedExercises'].includes(key)) {
        continue;
      }

      // Check if it's an exercise log entry with sets
      if (value && typeof value === 'object' && !Array.isArray(value) && 'sets' in value) {
        const sets = value.sets;
        if (Array.isArray(sets)) {
          totalSets += sets.length;
          completedSets += sets.filter(Boolean).length;
        }
      }
    }

    return { completed: completedSets, total: totalSets };
  };

  // Get in-progress workout (mirrors implementation)
  const getInProgressWorkout = () => {
    const sessionPattern = /^session_w(\d+)d(\d+)$/;
    let mostRecent = null;
    let mostRecentTime = 0;

    for (const key of Object.keys(testStorage)) {
      const match = key.match(sessionPattern);
      if (!match) continue;

      const session = safeGetJSON(key, null);
      if (!session || session.completed) continue;

      const { completed: completedSets, total: totalSets } = countSetsFromSession(session);

      // Only consider if there's actual progress
      if (completedSets === 0) continue;

      const lastModified = session.lastModified ? new Date(session.lastModified).getTime() : 0;

      if (lastModified > mostRecentTime) {
        mostRecentTime = lastModified;
        mostRecent = {
          week: parseInt(match[1], 10),
          day: parseInt(match[2], 10),
          completedSets,
          totalSets,
          lastModified: new Date(lastModified),
          progress: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
        };
      }
    }

    return mostRecent;
  };

  // Check if workout is in progress
  const isWorkoutInProgress = (week, day) => {
    const key = `session_w${week}d${day}`;
    const session = safeGetJSON(key, null);

    if (!session || session.completed) return false;

    const { completed: completedSets } = countSetsFromSession(session);
    return completedSets > 0;
  };

  // Get workout progress
  const getWorkoutProgress = (week, day) => {
    const key = `session_w${week}d${day}`;
    const session = safeGetJSON(key, null);

    if (!session) return null;

    const { completed: completedSets, total: totalSets } = countSetsFromSession(session);

    if (completedSets === 0) return null;

    return {
      completedSets,
      totalSets,
      progress: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
    };
  };

  beforeEach(() => {
    testStorage = {};
    localStorage.clear();
    localStorage.setItem.mockClear();
    localStorage.getItem.mockClear();
  });

  describe('countSetsFromSession', () => {
    it('should count completed sets correctly', () => {
      const session = {
        completed: false,
        lastModified: new Date().toISOString(),
        pull_ups: { sets: [true, true, false] },
        push_ups: { sets: [true, true, true, true] },
      };

      const result = countSetsFromSession(session);

      expect(result.completed).toBe(6); // 2 + 4
      expect(result.total).toBe(7); // 3 + 4
    });

    it('should return zero for empty session', () => {
      const session = {
        completed: false,
        lastModified: new Date().toISOString(),
      };

      const result = countSetsFromSession(session);

      expect(result.completed).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should ignore metadata fields', () => {
      const session = {
        completed: false,
        completedAt: null,
        lastModified: new Date().toISOString(),
        week: 1,
        day: 1,
        workoutNotes: 'Test notes',
        addedExercises: [],
        pull_ups: { sets: [true, false] },
      };

      const result = countSetsFromSession(session);

      expect(result.completed).toBe(1);
      expect(result.total).toBe(2);
    });

    it('should handle exercises without sets array', () => {
      const session = {
        completed: false,
        pull_ups: { weight: '10kg' }, // No sets array
        push_ups: { sets: [true, true] },
      };

      const result = countSetsFromSession(session);

      expect(result.completed).toBe(2);
      expect(result.total).toBe(2);
    });
  });

  describe('getInProgressWorkout', () => {
    it('should return null when no sessions exist', () => {
      const result = getInProgressWorkout();
      expect(result).toBe(null);
    });

    it('should return null when all sessions are completed', () => {
      safeSetJSON('session_w1d1', {
        completed: true,
        completedAt: new Date().toISOString(),
        pull_ups: { sets: [true, true, true] },
      });

      const result = getInProgressWorkout();
      expect(result).toBe(null);
    });

    it('should return null when session has no progress', () => {
      safeSetJSON('session_w1d1', {
        completed: false,
        lastModified: new Date().toISOString(),
        // No exercise data
      });

      const result = getInProgressWorkout();
      expect(result).toBe(null);
    });

    it('should find in-progress workout with progress', () => {
      const lastModified = new Date().toISOString();
      safeSetJSON('session_w3d2', {
        completed: false,
        lastModified,
        pull_ups: { sets: [true, true, false] },
        push_ups: { sets: [true, false, false] },
      });

      const result = getInProgressWorkout();

      expect(result).not.toBe(null);
      expect(result.week).toBe(3);
      expect(result.day).toBe(2);
      expect(result.completedSets).toBe(3);
      expect(result.totalSets).toBe(6);
      expect(result.progress).toBe(50);
    });

    it('should return most recent in-progress workout', () => {
      const olderTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const newerTime = new Date();

      safeSetJSON('session_w1d1', {
        completed: false,
        lastModified: olderTime.toISOString(),
        pull_ups: { sets: [true] },
      });

      safeSetJSON('session_w2d3', {
        completed: false,
        lastModified: newerTime.toISOString(),
        squats: { sets: [true, true] },
      });

      const result = getInProgressWorkout();

      expect(result.week).toBe(2);
      expect(result.day).toBe(3);
    });

    it('should ignore completed workouts when finding most recent', () => {
      const olderTime = new Date(Date.now() - 1000 * 60 * 60);
      const newerTime = new Date();

      safeSetJSON('session_w1d1', {
        completed: false,
        lastModified: olderTime.toISOString(),
        pull_ups: { sets: [true] },
      });

      safeSetJSON('session_w2d3', {
        completed: true,
        completedAt: newerTime.toISOString(),
        lastModified: newerTime.toISOString(),
        squats: { sets: [true, true, true] },
      });

      const result = getInProgressWorkout();

      expect(result.week).toBe(1);
      expect(result.day).toBe(1);
    });
  });

  describe('isWorkoutInProgress', () => {
    it('should return false when session does not exist', () => {
      const result = isWorkoutInProgress(1, 1);
      expect(result).toBe(false);
    });

    it('should return false when session is completed', () => {
      safeSetJSON('session_w1d1', {
        completed: true,
        pull_ups: { sets: [true, true, true] },
      });

      const result = isWorkoutInProgress(1, 1);
      expect(result).toBe(false);
    });

    it('should return false when session has no progress', () => {
      safeSetJSON('session_w1d1', {
        completed: false,
        lastModified: new Date().toISOString(),
      });

      const result = isWorkoutInProgress(1, 1);
      expect(result).toBe(false);
    });

    it('should return true when session has progress', () => {
      safeSetJSON('session_w1d1', {
        completed: false,
        lastModified: new Date().toISOString(),
        pull_ups: { sets: [true, false, false] },
      });

      const result = isWorkoutInProgress(1, 1);
      expect(result).toBe(true);
    });
  });

  describe('getWorkoutProgress', () => {
    it('should return null when session does not exist', () => {
      const result = getWorkoutProgress(1, 1);
      expect(result).toBe(null);
    });

    it('should return null when session has no progress', () => {
      safeSetJSON('session_w1d1', {
        completed: false,
        lastModified: new Date().toISOString(),
      });

      const result = getWorkoutProgress(1, 1);
      expect(result).toBe(null);
    });

    it('should return progress info for in-progress workout', () => {
      safeSetJSON('session_w5d3', {
        completed: false,
        lastModified: new Date().toISOString(),
        pull_ups: { sets: [true, true, true] },
        squats: { sets: [true, false, false, false] },
      });

      const result = getWorkoutProgress(5, 3);

      expect(result).not.toBe(null);
      expect(result.completedSets).toBe(4);
      expect(result.totalSets).toBe(7);
      expect(result.progress).toBe(57); // Math.round(4/7 * 100)
    });

    it('should return progress info for completed workout', () => {
      safeSetJSON('session_w1d1', {
        completed: true,
        completedAt: new Date().toISOString(),
        pull_ups: { sets: [true, true, true] },
      });

      const result = getWorkoutProgress(1, 1);

      expect(result).not.toBe(null);
      expect(result.completedSets).toBe(3);
      expect(result.progress).toBe(100);
    });
  });

  describe('Progress calculation edge cases', () => {
    it('should handle single set workout', () => {
      safeSetJSON('session_w1d1', {
        completed: false,
        lastModified: new Date().toISOString(),
        exercise: { sets: [true] },
      });

      const result = getWorkoutProgress(1, 1);
      expect(result.progress).toBe(100);
    });

    it('should handle many exercises', () => {
      const session = {
        completed: false,
        lastModified: new Date().toISOString(),
      };

      // Add 10 exercises with varying completion
      for (let i = 0; i < 10; i++) {
        session[`exercise_${i}`] = {
          sets: [true, i % 2 === 0, false], // 20 completed out of 30
        };
      }

      safeSetJSON('session_w1d1', session);

      const result = getWorkoutProgress(1, 1);
      expect(result.totalSets).toBe(30);
      expect(result.completedSets).toBe(15); // 10 first sets + 5 second sets
      expect(result.progress).toBe(50);
    });

    it('should handle exercises with different set counts', () => {
      safeSetJSON('session_w1d1', {
        completed: false,
        lastModified: new Date().toISOString(),
        exercise_1: { sets: [true, true] }, // 2 sets
        exercise_2: { sets: [true, true, true, true, true] }, // 5 sets
        exercise_3: { sets: [false] }, // 1 set
      });

      const result = getWorkoutProgress(1, 1);
      expect(result.totalSets).toBe(8);
      expect(result.completedSets).toBe(7);
      expect(result.progress).toBe(88); // Math.round(7/8 * 100)
    });
  });

  describe('Session key format', () => {
    it('should correctly parse week and day from session key', () => {
      safeSetJSON('session_w15d5', {
        completed: false,
        lastModified: new Date().toISOString(),
        exercise: { sets: [true] },
      });

      const result = getInProgressWorkout();
      expect(result.week).toBe(15);
      expect(result.day).toBe(5);
    });

    it('should ignore non-session keys', () => {
      testStorage['tracker_app_state'] = JSON.stringify({ viewMode: 'tab' });
      testStorage['exercise_history'] = JSON.stringify([]);
      testStorage['session_w1d1'] = JSON.stringify({
        completed: false,
        lastModified: new Date().toISOString(),
        exercise: { sets: [true] },
      });

      const result = getInProgressWorkout();
      expect(result).not.toBe(null);
      expect(result.week).toBe(1);
    });
  });
});
