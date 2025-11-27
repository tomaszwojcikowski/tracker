import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for resume workout functionality
 * Tests detecting in-progress workouts, progress tracking, and session data parsing
 */

describe('Resume Workout Feature', () => {
  // Storage simulation
  let testStorage = {};

  // Mock schedule for testing - maps 'week_day' to exercise count
  // This simulates getCompleteSchedule() returning exercises for each day
  const mockSchedule = {
    '1_1': 10, // Week 1, Day 1 has 10 exercises
    '1_2': 8,  // Week 1, Day 2 has 8 exercises
    '2_3': 12, // Week 2, Day 3 has 12 exercises
    '3_2': 15, // Week 3, Day 2 has 15 exercises
    '5_3': 9,  // Week 5, Day 3 has 9 exercises
    '15_5': 11, // Week 15, Day 5 has 11 exercises
  };

  // Get schedule exercise count (mirrors implementation)
  const getScheduleExerciseCount = (week, day) => {
    return mockSchedule[`${week}_${day}`] || 5; // Default to 5 exercises if not specified
  };

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

  // Count completed exercises from session data (mirrors implementation)
  // An exercise is considered "completed" if all its sets are done
  // Note: This now only returns the completed count; total comes from schedule
  const countCompletedExercisesFromSession = (session) => {
    let completedExercises = 0;

    for (const [key, value] of Object.entries(session)) {
      // Skip metadata fields
      if (['completed', 'completedAt', 'lastModified', 'week', 'day', 'workoutNotes', 'addedExercises'].includes(key)) {
        continue;
      }

      // Check if it's an exercise log entry with sets
      if (value && typeof value === 'object' && !Array.isArray(value) && 'sets' in value) {
        const sets = value.sets;
        if (Array.isArray(sets) && sets.length > 0) {
          // An exercise is completed when all its sets are done
          if (sets.every(Boolean)) {
            completedExercises += 1;
          }
        }
      }
    }

    return completedExercises;
  };

  // Legacy function that returns both completed and total (total from session, not schedule)
  // Used for testing the counting logic in isolation
  const countExercisesFromSession = (session) => {
    let completedExercises = 0;
    let totalExercises = 0;

    for (const [key, value] of Object.entries(session)) {
      // Skip metadata fields
      if (['completed', 'completedAt', 'lastModified', 'week', 'day', 'workoutNotes', 'addedExercises'].includes(key)) {
        continue;
      }

      // Check if it's an exercise log entry with sets
      if (value && typeof value === 'object' && !Array.isArray(value) && 'sets' in value) {
        const sets = value.sets;
        if (Array.isArray(sets) && sets.length > 0) {
          totalExercises += 1;
          if (sets.every(Boolean)) {
            completedExercises += 1;
          }
        }
      }
    }

    return { completed: completedExercises, total: totalExercises };
  };

  // Get in-progress workout (mirrors implementation)
  // Now uses schedule-based total exercise count
  const getInProgressWorkout = () => {
    const sessionPattern = /^session_w(\d+)d(\d+)$/;
    let mostRecent = null;
    let mostRecentTime = 0;

    for (const key of Object.keys(testStorage)) {
      const match = key.match(sessionPattern);
      if (!match) continue;

      const session = safeGetJSON(key, null);
      if (!session || session.completed) continue;

      const { completed: completedSets } = countSetsFromSession(session);

      // Only consider if there's actual progress
      if (completedSets === 0) continue;

      const week = parseInt(match[1], 10);
      const day = parseInt(match[2], 10);

      // Count completed exercises from session and get total from schedule
      const completedExercises = countCompletedExercisesFromSession(session);
      const totalExercises = getScheduleExerciseCount(week, day);

      const lastModified = session.lastModified ? new Date(session.lastModified).getTime() : 0;

      if (lastModified > mostRecentTime) {
        mostRecentTime = lastModified;
        mostRecent = {
          week,
          day,
          completedExercises,
          totalExercises,
          lastModified: new Date(lastModified),
          progress: totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0,
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

  // Get workout progress (mirrors implementation)
  // Now uses schedule-based total exercise count
  const getWorkoutProgress = (week, day) => {
    const key = `session_w${week}d${day}`;
    const session = safeGetJSON(key, null);

    if (!session) return null;

    const { completed: completedSets } = countSetsFromSession(session);

    if (completedSets === 0) return null;

    // Count completed exercises from session and get total from schedule
    const completedExercises = countCompletedExercisesFromSession(session);
    const totalExercises = getScheduleExerciseCount(week, day);

    return {
      completedExercises,
      totalExercises,
      progress: totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0,
    };
  };

  beforeEach(() => {
    testStorage = {};
    localStorage.clear();
    localStorage.setItem.mockClear();
    localStorage.getItem.mockClear();
  });

  describe('countExercisesFromSession', () => {
    it('should count completed exercises correctly', () => {
      const session = {
        completed: false,
        lastModified: new Date().toISOString(),
        pull_ups: { sets: [true, true, true] }, // completed
        push_ups: { sets: [true, true, true, true] }, // completed
      };

      const result = countExercisesFromSession(session);

      expect(result.completed).toBe(2); // both exercises completed
      expect(result.total).toBe(2);
    });

    it('should not count partially completed exercises as completed', () => {
      const session = {
        completed: false,
        lastModified: new Date().toISOString(),
        pull_ups: { sets: [true, true, false] }, // not completed
        push_ups: { sets: [true, true, true, true] }, // completed
      };

      const result = countExercisesFromSession(session);

      expect(result.completed).toBe(1); // only push_ups completed
      expect(result.total).toBe(2);
    });

    it('should return zero for empty session', () => {
      const session = {
        completed: false,
        lastModified: new Date().toISOString(),
      };

      const result = countExercisesFromSession(session);

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
        pull_ups: { sets: [true, true] }, // completed
      };

      const result = countExercisesFromSession(session);

      expect(result.completed).toBe(1);
      expect(result.total).toBe(1);
    });

    it('should handle exercises without sets array', () => {
      const session = {
        completed: false,
        pull_ups: { weight: '10kg' }, // No sets array
        push_ups: { sets: [true, true] }, // completed
      };

      const result = countExercisesFromSession(session);

      expect(result.completed).toBe(1);
      expect(result.total).toBe(1);
    });
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
        pull_ups: { sets: [true, true, false] }, // not completed
        push_ups: { sets: [true, false, false] }, // not completed
      });

      const result = getInProgressWorkout();

      expect(result).not.toBe(null);
      expect(result.week).toBe(3);
      expect(result.day).toBe(2);
      expect(result.completedExercises).toBe(0);
      // Total exercises comes from schedule (mockSchedule['3_2'] = 15)
      expect(result.totalExercises).toBe(15);
      expect(result.progress).toBe(0);
    });

    it('should calculate progress based on completed exercises', () => {
      const lastModified = new Date().toISOString();
      safeSetJSON('session_w3d2', {
        completed: false,
        lastModified,
        pull_ups: { sets: [true, true, true] }, // completed
        push_ups: { sets: [true, false, false] }, // not completed
      });

      const result = getInProgressWorkout();

      expect(result).not.toBe(null);
      expect(result.week).toBe(3);
      expect(result.day).toBe(2);
      expect(result.completedExercises).toBe(1);
      // Total exercises comes from schedule (mockSchedule['3_2'] = 15)
      expect(result.totalExercises).toBe(15);
      // Progress: 1/15 = 6.67% -> rounds to 7%
      expect(result.progress).toBe(7);
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
        pull_ups: { sets: [true, true, true] }, // completed
        squats: { sets: [true, false, false, false] }, // not completed
      });

      const result = getWorkoutProgress(5, 3);

      expect(result).not.toBe(null);
      expect(result.completedExercises).toBe(1);
      // Total exercises comes from schedule (mockSchedule['5_3'] = 9)
      expect(result.totalExercises).toBe(9);
      // Progress: 1/9 = 11.11% -> rounds to 11%
      expect(result.progress).toBe(11);
    });

    it('should return progress info for completed workout', () => {
      safeSetJSON('session_w1d1', {
        completed: true,
        completedAt: new Date().toISOString(),
        pull_ups: { sets: [true, true, true] },
      });

      const result = getWorkoutProgress(1, 1);

      expect(result).not.toBe(null);
      expect(result.completedExercises).toBe(1);
      // Total exercises comes from schedule (mockSchedule['1_1'] = 10)
      expect(result.totalExercises).toBe(10);
      // Progress: 1/10 = 10%
      expect(result.progress).toBe(10);
    });
  });

  describe('Progress calculation edge cases', () => {
    it('should handle single exercise workout with one set completed', () => {
      safeSetJSON('session_w1d1', {
        completed: false,
        lastModified: new Date().toISOString(),
        exercise: { sets: [true] },
      });

      const result = getWorkoutProgress(1, 1);
      expect(result.completedExercises).toBe(1);
      // Total exercises comes from schedule (mockSchedule['1_1'] = 10)
      expect(result.totalExercises).toBe(10);
      // Progress: 1/10 = 10%
      expect(result.progress).toBe(10);
    });

    it('should handle many exercises with varying completion', () => {
      const session = {
        completed: false,
        lastModified: new Date().toISOString(),
      };

      // Add 10 exercises - none fully completed (each has at least one false)
      for (let i = 0; i < 10; i++) {
        session[`exercise_${i}`] = {
          sets: [true, i % 2 === 0, false], // None fully completed
        };
      }

      safeSetJSON('session_w1d1', session);

      const result = getWorkoutProgress(1, 1);
      // Total exercises comes from schedule (mockSchedule['1_1'] = 10)
      expect(result.totalExercises).toBe(10);
      expect(result.completedExercises).toBe(0); // None completed (all have at least one false)
      expect(result.progress).toBe(0);
    });

    it('should handle exercises with different set counts - all completed', () => {
      safeSetJSON('session_w1d1', {
        completed: false,
        lastModified: new Date().toISOString(),
        exercise_1: { sets: [true, true] }, // 2 sets - completed
        exercise_2: { sets: [true, true, true, true, true] }, // 5 sets - completed
        exercise_3: { sets: [true] }, // 1 set - completed
      });

      const result = getWorkoutProgress(1, 1);
      // Total exercises comes from schedule (mockSchedule['1_1'] = 10)
      expect(result.totalExercises).toBe(10);
      expect(result.completedExercises).toBe(3);
      // Progress: 3/10 = 30%
      expect(result.progress).toBe(30);
    });

    it('should handle mixed completion status', () => {
      safeSetJSON('session_w1d1', {
        completed: false,
        lastModified: new Date().toISOString(),
        exercise_1: { sets: [true, true] }, // completed
        exercise_2: { sets: [true, true, true, true, true] }, // completed
        exercise_3: { sets: [false] }, // not completed
      });

      const result = getWorkoutProgress(1, 1);
      // Total exercises comes from schedule (mockSchedule['1_1'] = 10)
      expect(result.totalExercises).toBe(10);
      expect(result.completedExercises).toBe(2);
      // Progress: 2/10 = 20%
      expect(result.progress).toBe(20);
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
      // Total exercises comes from schedule (mockSchedule['15_5'] = 11)
      expect(result.totalExercises).toBe(11);
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
      // Total exercises comes from schedule (mockSchedule['1_1'] = 10)
      expect(result.totalExercises).toBe(10);
    });
  });
});
