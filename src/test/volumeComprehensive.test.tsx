/**
 * Comprehensive tests for volume tracking utilities
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateExerciseVolume,
  calculateWorkoutVolume,
  saveVolumeEntry,
  getVolumeHistory,
  calculateVolumeStats,
  formatVolume,
  type ExerciseVolumeInput,
  type VolumeEntry,
} from '../utils/volume';

describe('Volume Utilities Comprehensive Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateExerciseVolume', () => {
    it('should calculate volume correctly', () => {
      const exercise: ExerciseVolumeInput = {
        completedSets: 3,
        prescription: '3x10 reps',
        weight: 50,
      };

      // 3 sets × 10 reps × 50 kg = 1500 kg
      expect(calculateExerciseVolume(exercise)).toBe(1500);
    });

    it('should handle "x N reps" format', () => {
      const exercise: ExerciseVolumeInput = {
        completedSets: 4,
        prescription: '4 x 8 reps',
        weight: 60,
      };

      // 4 × 8 × 60 = 1920
      expect(calculateExerciseVolume(exercise)).toBe(1920);
    });

    it('should handle "N reps" format', () => {
      const exercise: ExerciseVolumeInput = {
        completedSets: 3,
        prescription: '10 reps',
        weight: 40,
      };

      // 3 × 10 × 40 = 1200
      expect(calculateExerciseVolume(exercise)).toBe(1200);
    });

    it('should handle string weight', () => {
      const exercise: ExerciseVolumeInput = {
        completedSets: 3,
        prescription: '3x10 reps',
        weight: '45.5',
      };

      expect(calculateExerciseVolume(exercise)).toBe(1365); // 3 × 10 × 45.5
    });

    it('should return 0 for missing sets', () => {
      const exercise: ExerciseVolumeInput = {
        prescription: '3x10 reps',
        weight: 50,
      };

      expect(calculateExerciseVolume(exercise)).toBe(0);
    });

    it('should return 0 for missing prescription', () => {
      const exercise: ExerciseVolumeInput = {
        completedSets: 3,
        weight: 50,
      };

      expect(calculateExerciseVolume(exercise)).toBe(0);
    });

    it('should return 0 for missing weight', () => {
      const exercise: ExerciseVolumeInput = {
        completedSets: 3,
        prescription: '3x10 reps',
      };

      expect(calculateExerciseVolume(exercise)).toBe(0);
    });

    it('should handle empty object', () => {
      expect(calculateExerciseVolume({})).toBe(0);
    });
  });

  describe('calculateWorkoutVolume', () => {
    it('should calculate total workout volume', () => {
      const exercises: ExerciseVolumeInput[] = [
        { name: 'Bench', completedSets: 3, prescription: '3x10 reps', weight: 60 },
        { name: 'Squat', completedSets: 4, prescription: '4x8 reps', weight: 80 },
      ];

      const result = calculateWorkoutVolume(exercises);

      // Bench: 3 × 10 × 60 = 1800
      // Squat: 4 × 8 × 80 = 2560
      // Total: 4360
      expect(result.totalVolume).toBe(4360);
    });

    it('should return exercise count', () => {
      const exercises: ExerciseVolumeInput[] = [
        { name: 'Ex1', completedSets: 3, prescription: '3x10 reps', weight: 50 },
        { name: 'Ex2', completedSets: 3, prescription: '3x10 reps', weight: 50 },
        { name: 'Ex3', completedSets: 3, prescription: '3x10 reps', weight: 50 },
      ];

      const result = calculateWorkoutVolume(exercises);

      expect(result.exerciseCount).toBe(3);
    });

    it('should sort breakdown by volume (descending)', () => {
      const exercises: ExerciseVolumeInput[] = [
        { name: 'Light', completedSets: 2, prescription: '2x5 reps', weight: 20 },
        { name: 'Heavy', completedSets: 5, prescription: '5x5 reps', weight: 100 },
      ];

      const result = calculateWorkoutVolume(exercises);

      expect(result.breakdown[0].name).toBe('Heavy');
      expect(result.breakdown[1].name).toBe('Light');
    });

    it('should calculate average per exercise', () => {
      const exercises: ExerciseVolumeInput[] = [
        { name: 'Ex1', completedSets: 3, prescription: '3x10 reps', weight: 50 },
        { name: 'Ex2', completedSets: 3, prescription: '3x10 reps', weight: 50 },
      ];

      const result = calculateWorkoutVolume(exercises);

      // Total: 3000, Count: 2, Average: 1500
      expect(result.averagePerExercise).toBe(1500);
    });

    it('should handle empty array', () => {
      const result = calculateWorkoutVolume([]);

      expect(result.totalVolume).toBe(0);
      expect(result.exerciseCount).toBe(0);
      expect(result.breakdown).toEqual([]);
      expect(result.averagePerExercise).toBe(0);
    });

    it('should skip exercises with zero volume', () => {
      const exercises: ExerciseVolumeInput[] = [
        { name: 'HasVolume', completedSets: 3, prescription: '3x10 reps', weight: 50 },
        { name: 'NoWeight', completedSets: 3, prescription: '3x10 reps' },
      ];

      const result = calculateWorkoutVolume(exercises);

      expect(result.exerciseCount).toBe(1);
      expect(result.breakdown).toHaveLength(1);
    });

    it('should handle invalid input', () => {
      const result = calculateWorkoutVolume(null as unknown as ExerciseVolumeInput[]);

      expect(result.totalVolume).toBe(0);
      expect(result.exerciseCount).toBe(0);
    });
  });

  describe('Volume History', () => {
    describe('saveVolumeEntry', () => {
      it('should save new entry', () => {
        const entry: VolumeEntry = {
          week: 1,
          day: 1,
          date: '2024-01-15',
          totalVolume: 5000,
          breakdown: [],
        };

        saveVolumeEntry(entry);

        const history = getVolumeHistory();
        expect(history).toHaveLength(1);
        expect(history[0].totalVolume).toBe(5000);
      });

      it('should update existing entry for same week/day', () => {
        const entry1: VolumeEntry = {
          week: 1,
          day: 1,
          date: '2024-01-15',
          totalVolume: 5000,
          breakdown: [],
        };
        const entry2: VolumeEntry = {
          week: 1,
          day: 1,
          date: '2024-01-15',
          totalVolume: 6000, // Updated volume
          breakdown: [],
        };

        saveVolumeEntry(entry1);
        saveVolumeEntry(entry2);

        const history = getVolumeHistory();
        expect(history).toHaveLength(1);
        expect(history[0].totalVolume).toBe(6000);
      });

      it('should sort entries by date descending', () => {
        saveVolumeEntry({ week: 1, day: 1, date: '2024-01-15', totalVolume: 1000, breakdown: [] });
        saveVolumeEntry({ week: 2, day: 1, date: '2024-01-22', totalVolume: 2000, breakdown: [] });
        saveVolumeEntry({ week: 1, day: 3, date: '2024-01-17', totalVolume: 1500, breakdown: [] });

        const history = getVolumeHistory();

        expect(history[0].date).toBe('2024-01-22');
        expect(history[1].date).toBe('2024-01-17');
        expect(history[2].date).toBe('2024-01-15');
      });

      it('should add savedAt timestamp', () => {
        const entry: VolumeEntry = {
          week: 1,
          day: 1,
          date: '2024-01-15',
          totalVolume: 5000,
          breakdown: [],
        };

        saveVolumeEntry(entry);

        const history = getVolumeHistory();
        expect(history[0].savedAt).toBeDefined();
      });
    });

    describe('getVolumeHistory', () => {
      it('should return empty array when no history', () => {
        expect(getVolumeHistory()).toEqual([]);
      });

      it('should return all entries by default', () => {
        saveVolumeEntry({ week: 1, day: 1, date: '2024-01-15', totalVolume: 1000, breakdown: [] });
        saveVolumeEntry({ week: 1, day: 2, date: '2024-01-16', totalVolume: 2000, breakdown: [] });

        const history = getVolumeHistory();
        expect(history).toHaveLength(2);
      });

      it('should limit results when limit option provided', () => {
        for (let i = 0; i < 10; i++) {
          saveVolumeEntry({
            week: 1,
            day: i + 1,
            date: `2024-01-${(15 + i).toString().padStart(2, '0')}`,
            totalVolume: 1000,
            breakdown: [],
          });
        }

        const history = getVolumeHistory({ limit: 5 });
        expect(history).toHaveLength(5);
      });

      it('should filter by weeks when weeks option provided', () => {
        const now = new Date();
        const oldDate = new Date(now);
        oldDate.setDate(oldDate.getDate() - 30);

        saveVolumeEntry({
          week: 1,
          day: 1,
          date: now.toISOString().split('T')[0],
          totalVolume: 1000,
          breakdown: [],
        });
        saveVolumeEntry({
          week: 2,
          day: 1,
          date: oldDate.toISOString().split('T')[0],
          totalVolume: 2000,
          breakdown: [],
        });

        const history = getVolumeHistory({ weeks: 2 });
        expect(history).toHaveLength(1);
      });
    });
  });

  describe('calculateVolumeStats', () => {
    it('should return empty stats when no history', () => {
      const stats = calculateVolumeStats();

      expect(stats.totalVolume).toBe(0);
      expect(stats.averagePerWorkout).toBe(0);
      expect(stats.workoutCount).toBe(0);
      expect(stats.trend).toBe('neutral');
    });

    it('should calculate total volume', () => {
      const now = new Date();
      const date1 = new Date(now);
      date1.setDate(date1.getDate() - 1);
      const date2 = new Date(now);
      date2.setDate(date2.getDate() - 2);

      saveVolumeEntry({ week: 1, day: 1, date: date1.toISOString().split('T')[0], totalVolume: 1000, breakdown: [] });
      saveVolumeEntry({ week: 1, day: 2, date: date2.toISOString().split('T')[0], totalVolume: 2000, breakdown: [] });

      const stats = calculateVolumeStats(4);

      expect(stats.totalVolume).toBe(3000);
    });

    it('should calculate average per workout', () => {
      const now = new Date();
      const date1 = new Date(now);
      date1.setDate(date1.getDate() - 1);
      const date2 = new Date(now);
      date2.setDate(date2.getDate() - 2);

      saveVolumeEntry({ week: 1, day: 1, date: date1.toISOString().split('T')[0], totalVolume: 1000, breakdown: [] });
      saveVolumeEntry({ week: 1, day: 2, date: date2.toISOString().split('T')[0], totalVolume: 2000, breakdown: [] });

      const stats = calculateVolumeStats(4);

      expect(stats.averagePerWorkout).toBe(1500);
    });

    it('should calculate weekly breakdown', () => {
      const now = new Date();
      const date1 = new Date(now);
      date1.setDate(date1.getDate() - 1);
      const date2 = new Date(now);
      date2.setDate(date2.getDate() - 2);
      const date3 = new Date(now);
      date3.setDate(date3.getDate() - 3);

      saveVolumeEntry({ week: 1, day: 1, date: date1.toISOString().split('T')[0], totalVolume: 1000, breakdown: [] });
      saveVolumeEntry({ week: 1, day: 2, date: date2.toISOString().split('T')[0], totalVolume: 1500, breakdown: [] });
      saveVolumeEntry({ week: 2, day: 1, date: date3.toISOString().split('T')[0], totalVolume: 2000, breakdown: [] });

      const stats = calculateVolumeStats(4);

      expect(stats.weeklyBreakdown).toHaveLength(2);
      // Sorted by week number
      expect(stats.weeklyBreakdown[0].week).toBe('W1');
      expect(stats.weeklyBreakdown[0].volume).toBe(2500);
      expect(stats.weeklyBreakdown[1].week).toBe('W2');
      expect(stats.weeklyBreakdown[1].volume).toBe(2000);
    });

    it('should detect increasing trend', () => {
      const now = new Date();
      // Older workouts (lower volume) - further back in time
      const date1 = new Date(now); date1.setDate(date1.getDate() - 4);
      const date2 = new Date(now); date2.setDate(date2.getDate() - 3);
      // Recent workouts (higher volume) - more recent
      const date3 = new Date(now); date3.setDate(date3.getDate() - 2);
      const date4 = new Date(now); date4.setDate(date4.getDate() - 1);

      saveVolumeEntry({ week: 1, day: 1, date: date1.toISOString().split('T')[0], totalVolume: 1000, breakdown: [] });
      saveVolumeEntry({ week: 1, day: 2, date: date2.toISOString().split('T')[0], totalVolume: 1000, breakdown: [] });
      saveVolumeEntry({ week: 2, day: 1, date: date3.toISOString().split('T')[0], totalVolume: 2000, breakdown: [] });
      saveVolumeEntry({ week: 2, day: 2, date: date4.toISOString().split('T')[0], totalVolume: 2000, breakdown: [] });

      const stats = calculateVolumeStats(4);

      expect(stats.trend).toBe('increasing');
    });

    it('should detect decreasing trend', () => {
      const now = new Date();
      // Older workouts (higher volume) - further back in time
      const date1 = new Date(now); date1.setDate(date1.getDate() - 4);
      const date2 = new Date(now); date2.setDate(date2.getDate() - 3);
      // Recent workouts (lower volume) - more recent
      const date3 = new Date(now); date3.setDate(date3.getDate() - 2);
      const date4 = new Date(now); date4.setDate(date4.getDate() - 1);

      saveVolumeEntry({ week: 1, day: 1, date: date1.toISOString().split('T')[0], totalVolume: 2000, breakdown: [] });
      saveVolumeEntry({ week: 1, day: 2, date: date2.toISOString().split('T')[0], totalVolume: 2000, breakdown: [] });
      saveVolumeEntry({ week: 2, day: 1, date: date3.toISOString().split('T')[0], totalVolume: 1000, breakdown: [] });
      saveVolumeEntry({ week: 2, day: 2, date: date4.toISOString().split('T')[0], totalVolume: 1000, breakdown: [] });

      const stats = calculateVolumeStats(4);

      expect(stats.trend).toBe('decreasing');
    });
  });

  describe('formatVolume', () => {
    it('should format small volumes with locale string', () => {
      expect(formatVolume(1500)).toBe('1,500 kg');
      expect(formatVolume(9999)).toBe('9,999 kg');
    });

    it('should format large volumes with "k" suffix', () => {
      expect(formatVolume(10000)).toBe('10.0k kg');
      expect(formatVolume(15500)).toBe('15.5k kg');
      expect(formatVolume(100000)).toBe('100.0k kg');
    });

    it('should handle zero', () => {
      expect(formatVolume(0)).toBe('0 kg');
    });
  });
});
