/**
 * Comprehensive tests for exercise history utilities
 * Tests the actual exerciseHistory.ts module exports
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  updateExerciseHistory,
  getExerciseHistory,
  calculateExerciseStats,
  getAllExercisesWithHistory,
  calculateWorkoutVolume,
  parseWeight,
  type ExerciseHistoryEntry,
  type ExerciseVolumeData,
} from '../utils/exerciseHistory';

// Mock storage namespace
vi.mock('../services/storageNamespace', () => ({
  getExerciseHistoryKey: () => 'test_exercise_history',
}));

describe('Exercise History Comprehensive Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateExerciseHistory', () => {
    it('should create new history entry for new exercise', () => {
      const entry: ExerciseHistoryEntry = {
        date: '2024-01-15',
        week: 1,
        day: 1,
        sets: 3,
        weight: 50,
      };

      updateExerciseHistory('Bench Press', entry);

      const history = getExerciseHistory('Bench Press');
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(entry);
    });

    it('should add to existing history', () => {
      const entry1: ExerciseHistoryEntry = {
        date: '2024-01-15',
        week: 1,
        day: 1,
        sets: 3,
        weight: 50,
      };
      const entry2: ExerciseHistoryEntry = {
        date: '2024-01-17',
        week: 1,
        day: 3,
        sets: 3,
        weight: 52.5,
      };

      updateExerciseHistory('Bench Press', entry1);
      updateExerciseHistory('Bench Press', entry2);

      const history = getExerciseHistory('Bench Press');
      expect(history).toHaveLength(2);
    });

    it('should update existing entry for same date/week/day', () => {
      const entry1: ExerciseHistoryEntry = {
        date: '2024-01-15',
        week: 1,
        day: 1,
        sets: 2,
        weight: 50,
      };
      const entry2: ExerciseHistoryEntry = {
        date: '2024-01-15',
        week: 1,
        day: 1,
        sets: 3, // Updated sets
        weight: 55, // Updated weight
      };

      updateExerciseHistory('Bench Press', entry1);
      updateExerciseHistory('Bench Press', entry2);

      const history = getExerciseHistory('Bench Press');
      expect(history).toHaveLength(1);
      expect(history[0].sets).toBe(3);
      expect(history[0].weight).toBe(55);
    });

    it('should handle entries with prescription', () => {
      const entry: ExerciseHistoryEntry = {
        date: '2024-01-15',
        week: 1,
        day: 1,
        prescription: '3x8 reps',
        sets: 3,
        weight: 60,
      };

      updateExerciseHistory('Squat', entry);

      const history = getExerciseHistory('Squat');
      expect(history[0].prescription).toBe('3x8 reps');
    });

    it('should handle entries with RPE data', () => {
      const entry: ExerciseHistoryEntry = {
        date: '2024-01-15',
        week: 1,
        day: 1,
        sets: 3,
        weight: 70,
        rpe: { 0: '7', 1: '8', 2: '9' },
      };

      updateExerciseHistory('Deadlift', entry);

      const history = getExerciseHistory('Deadlift');
      expect(history[0].rpe).toEqual({ 0: '7', 1: '8', 2: '9' });
    });

    it('should handle bodyweight exercises', () => {
      const entry: ExerciseHistoryEntry = {
        date: '2024-01-15',
        week: 1,
        day: 1,
        sets: 3,
        isBodyweight: true,
      };

      updateExerciseHistory('Push-Ups', entry);

      const history = getExerciseHistory('Push-Ups');
      expect(history[0].isBodyweight).toBe(true);
    });

    it('should handle notes', () => {
      const entry: ExerciseHistoryEntry = {
        date: '2024-01-15',
        week: 1,
        day: 1,
        sets: 3,
        notes: 'Felt strong today',
      };

      updateExerciseHistory('Pull-Ups', entry);

      const history = getExerciseHistory('Pull-Ups');
      expect(history[0].notes).toBe('Felt strong today');
    });

    it('should handle selectedOption for flow exercises', () => {
      const entry: ExerciseHistoryEntry = {
        date: '2024-01-15',
        week: 1,
        day: 1,
        sets: 1,
        selectedOption: 'Cat-Cow Flow',
      };

      updateExerciseHistory('Mobility Flow', entry);

      const history = getExerciseHistory('Mobility Flow');
      expect(history[0].selectedOption).toBe('Cat-Cow Flow');
    });

    it('should reject invalid exercise name', () => {
      const entry: ExerciseHistoryEntry = {
        date: '2024-01-15',
        week: 1,
        day: 1,
        sets: 3,
      };

      updateExerciseHistory('', entry);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getExerciseHistory', () => {
    it('should return empty array for unknown exercise', () => {
      const history = getExerciseHistory('Unknown Exercise');

      expect(history).toEqual([]);
    });

    it('should return sorted history (oldest first)', () => {
      const entries: ExerciseHistoryEntry[] = [
        { date: '2024-01-20', week: 2, day: 1, sets: 3 },
        { date: '2024-01-15', week: 1, day: 1, sets: 3 },
        { date: '2024-01-17', week: 1, day: 3, sets: 3 },
      ];

      entries.forEach(e => updateExerciseHistory('Test', e));

      const history = getExerciseHistory('Test');
      expect(history[0].date).toBe('2024-01-15');
      expect(history[1].date).toBe('2024-01-17');
      expect(history[2].date).toBe('2024-01-20');
    });

    it('should handle multiple exercises independently', () => {
      updateExerciseHistory('Exercise A', { date: '2024-01-15', week: 1, day: 1, sets: 3 });
      updateExerciseHistory('Exercise B', { date: '2024-01-15', week: 1, day: 1, sets: 5 });

      expect(getExerciseHistory('Exercise A')).toHaveLength(1);
      expect(getExerciseHistory('Exercise B')).toHaveLength(1);
      expect(getExerciseHistory('Exercise A')[0].sets).toBe(3);
      expect(getExerciseHistory('Exercise B')[0].sets).toBe(5);
    });
  });

  describe('calculateExerciseStats', () => {
    it('should return empty stats for unknown exercise', () => {
      const stats = calculateExerciseStats('Unknown');

      expect(stats.totalWorkouts).toBe(0);
      expect(stats.maxSets).toBeNull();
      expect(stats.maxWeight).toBeNull();
      expect(stats.estimated1RM).toBeNull();
      expect(stats.recentProgress).toEqual([]);
    });

    it('should calculate total workouts', () => {
      updateExerciseHistory('Test', { date: '2024-01-15', week: 1, day: 1, sets: 3, weight: 50 });
      updateExerciseHistory('Test', { date: '2024-01-17', week: 1, day: 3, sets: 3, weight: 50 });
      updateExerciseHistory('Test', { date: '2024-01-20', week: 2, day: 1, sets: 3, weight: 50 });

      const stats = calculateExerciseStats('Test');

      expect(stats.totalWorkouts).toBe(3);
    });

    it('should find max sets', () => {
      updateExerciseHistory('Test', { date: '2024-01-15', week: 1, day: 1, sets: 3 });
      updateExerciseHistory('Test', { date: '2024-01-17', week: 1, day: 3, sets: 5 });
      updateExerciseHistory('Test', { date: '2024-01-20', week: 2, day: 1, sets: 4 });

      const stats = calculateExerciseStats('Test');

      expect(stats.maxSets).toBe(5);
    });

    it('should find max weight', () => {
      updateExerciseHistory('Test', { date: '2024-01-15', week: 1, day: 1, sets: 3, weight: 50 });
      updateExerciseHistory('Test', { date: '2024-01-17', week: 1, day: 3, sets: 3, weight: 60 });
      updateExerciseHistory('Test', { date: '2024-01-20', week: 2, day: 1, sets: 3, weight: 55 });

      const stats = calculateExerciseStats('Test');

      expect(stats.maxWeight).toBe(60);
    });

    it('should track max weight by sets', () => {
      updateExerciseHistory('Test', { date: '2024-01-15', week: 1, day: 1, sets: 3, weight: 50 });
      updateExerciseHistory('Test', { date: '2024-01-17', week: 1, day: 3, sets: 5, weight: 45 });
      updateExerciseHistory('Test', { date: '2024-01-20', week: 2, day: 1, sets: 3, weight: 55 });

      const stats = calculateExerciseStats('Test');

      expect(stats.maxWeightBySets[3]).toBe(55);
      expect(stats.maxWeightBySets[5]).toBe(45);
    });

    it('should calculate estimated 1RM using Epley formula', () => {
      updateExerciseHistory('Test', {
        date: '2024-01-15',
        week: 1,
        day: 1,
        sets: 3,
        weight: 80,
        prescription: '3x8 reps',
      });

      const stats = calculateExerciseStats('Test');

      // Epley: 1RM = weight × (1 + reps/30) = 80 × (1 + 8/30) ≈ 101.3
      expect(stats.estimated1RM).toBeCloseTo(101.3, 0);
    });

    it('should return recent progress (last 10)', () => {
      for (let i = 0; i < 15; i++) {
        updateExerciseHistory('Test', {
          date: `2024-01-${(i + 1).toString().padStart(2, '0')}`,
          week: 1,
          day: 1,
          sets: 3,
          weight: 50 + i,
        });
      }

      const stats = calculateExerciseStats('Test');

      expect(stats.recentProgress).toHaveLength(10);
      // Should have the last 10 entries
      expect(stats.recentProgress[0].weight).toBe(55);
      expect(stats.recentProgress[9].weight).toBe(64);
    });
  });

  describe('getAllExercisesWithHistory', () => {
    it('should return empty array when no history', () => {
      expect(getAllExercisesWithHistory()).toEqual([]);
    });

    it('should return sorted list of exercises', () => {
      updateExerciseHistory('Squat', { date: '2024-01-15', week: 1, day: 1, sets: 3 });
      updateExerciseHistory('Bench Press', { date: '2024-01-15', week: 1, day: 1, sets: 3 });
      updateExerciseHistory('Deadlift', { date: '2024-01-15', week: 1, day: 1, sets: 3 });

      const exercises = getAllExercisesWithHistory();

      // Returns normalized exercise IDs (lowercase with underscores)
      expect(exercises).toEqual(['bench_press', 'deadlift', 'squat']);
    });
  });

  describe('calculateWorkoutVolume', () => {
    it('should calculate total volume', () => {
      const exercises: ExerciseVolumeData[] = [
        { name: 'Bench Press', prescription: '3x10', weight: 60, completedSets: 3 },
        { name: 'Squat', prescription: '4x8', weight: 80, completedSets: 4 },
      ];

      const result = calculateWorkoutVolume(exercises);

      // Bench: 3 × 10 × 60 = 1800
      // Squat: 4 × 8 × 80 = 2560
      // Total: 4360
      expect(result.totalVolume).toBe(4360);
    });

    it('should return breakdown sorted by volume', () => {
      const exercises: ExerciseVolumeData[] = [
        { name: 'Light Exercise', prescription: '2x10', weight: 20, completedSets: 2 },
        { name: 'Heavy Exercise', prescription: '5x5', weight: 100, completedSets: 5 },
      ];

      const result = calculateWorkoutVolume(exercises);

      expect(result.breakdown[0].name).toBe('Heavy Exercise');
      expect(result.breakdown[1].name).toBe('Light Exercise');
    });

    it('should handle string weight values', () => {
      const exercises: ExerciseVolumeData[] = [
        { name: 'Test', prescription: '3x10', weight: '50', completedSets: 3 },
      ];

      const result = calculateWorkoutVolume(exercises);

      expect(result.totalVolume).toBe(1500); // 3 × 10 × 50
    });

    it('should skip exercises with zero volume', () => {
      const exercises: ExerciseVolumeData[] = [
        { name: 'Has Volume', prescription: '3x10', weight: 50, completedSets: 3 },
        { name: 'No Weight', prescription: '3x10', completedSets: 3 },
        { name: 'No Sets', prescription: '3x10', weight: 50, completedSets: 0 },
      ];

      const result = calculateWorkoutVolume(exercises);

      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].name).toBe('Has Volume');
    });

    it('should handle empty exercises array', () => {
      const result = calculateWorkoutVolume([]);

      expect(result.totalVolume).toBe(0);
      expect(result.breakdown).toEqual([]);
    });

    it('should handle missing prescription', () => {
      const exercises: ExerciseVolumeData[] = [
        { name: 'No Prescription', weight: 50, completedSets: 3 },
      ];

      const result = calculateWorkoutVolume(exercises);

      expect(result.totalVolume).toBe(0);
    });
  });

  describe('parseWeight', () => {
    it('should parse numeric weight', () => {
      expect(parseWeight(50)).toBe(50);
      expect(parseWeight(0)).toBe(0);
      expect(parseWeight(-10)).toBe(-10);
    });

    it('should parse string weight', () => {
      expect(parseWeight('50')).toBe(50);
      expect(parseWeight('50.5')).toBe(50.5);
    });

    it('should return null for null/undefined', () => {
      expect(parseWeight(null)).toBeNull();
      expect(parseWeight(undefined)).toBeNull();
    });

    it('should return null for invalid strings', () => {
      expect(parseWeight('abc')).toBeNull();
      expect(parseWeight('')).toBeNull();
    });

    it('should handle strings with units', () => {
      // parseFloat handles this automatically
      expect(parseWeight('50kg')).toBe(50);
    });
  });
});
