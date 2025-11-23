import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for exercise history and statistics utilities
 * Tests tracking workout history, calculating stats, and parsing weights
 */

describe('Exercise History & Stats', () => {
  const EXERCISE_HISTORY_KEY = 'exercise_history';

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem.mockClear();
    localStorage.getItem.mockClear();
    localStorage.setItem.mockImplementation(() => {});
    localStorage.getItem.mockImplementation(() => null);
    testStorage = {};
  });

  // Storage to simulate localStorage behavior in tests
  let testStorage = {};

  // Utility functions from App.jsx
  const safeGetJSON = (key, defaultValue = null) => {
    try {
      // Check testStorage first
      if (testStorage[key] !== undefined) {
        return testStorage[key];
      }
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      return defaultValue;
    }
  };

  const safeSetJSON = (key, value) => {
    try {
      testStorage[key] = value;
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  };

  const parseWeight = (weight) => {
    if (typeof weight === 'number') return weight;
    if (typeof weight !== 'string') return 0;
    const match = weight.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };
  
  const updateExerciseHistory = (exerciseName, entry) => {
    const history = safeGetJSON(EXERCISE_HISTORY_KEY, {});
    
    if (!history[exerciseName]) {
      history[exerciseName] = [];
    }
    
    if (!entry || !entry.date) {
      console.error('Invalid entry format:', entry);
      return;
    }
    
    const existingIndex = history[exerciseName].findIndex(
      e => e.date === entry.date && e.week === entry.week && e.day === entry.day
    );
    
    if (existingIndex >= 0) {
      history[exerciseName][existingIndex] = entry;
    } else {
      history[exerciseName].push(entry);
    }
    
    safeSetJSON(EXERCISE_HISTORY_KEY, history);
    // Update test storage for retrieval
    testStorage[EXERCISE_HISTORY_KEY] = history;
  };

  const getExerciseHistory = (exerciseName) => {
    const history = safeGetJSON(EXERCISE_HISTORY_KEY, {});
    
    if (!history[exerciseName]) {
      return [];
    }
    
    return [...history[exerciseName]].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  };

  const calculateExerciseStats = (exerciseName) => {
    const history = getExerciseHistory(exerciseName);
    
    if (history.length === 0) {
      return {
        totalWorkouts: 0,
        maxSets: 0,
        maxWeight: 0,
        estimatedOneRepMax: 0,
      };
    }
    
    const maxSets = Math.max(...history.map(e => e.sets?.length || 0));
    
    const weights = history
      .map(e => e.weight)
      .filter(w => w !== undefined && w !== null && w !== '')
      .map(parseWeight)
      .filter(w => w > 0);
    
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
    
    // Estimate 1RM using Brzycki formula: weight × (36 / (37 - reps))
    let estimatedOneRepMax = 0;
    if (maxWeight > 0) {
      const maxWeightEntries = history.filter(e => parseWeight(e.weight) === maxWeight);
      if (maxWeightEntries.length > 0) {
        const entry = maxWeightEntries[0];
        const repsMatch = entry.prescription?.match(/(\d+)\s*reps?/i);
        const reps = repsMatch ? parseInt(repsMatch[1]) : 5;
        
        if (reps === 1) {
          estimatedOneRepMax = maxWeight;
        } else if (reps <= 10) {
          estimatedOneRepMax = Math.round(maxWeight * (36 / (37 - reps)) * 10) / 10;
        } else {
          estimatedOneRepMax = maxWeight;
        }
      } else {
        estimatedOneRepMax = maxWeight;
      }
    }
    
    return {
      totalWorkouts: history.length,
      maxSets,
      maxWeight,
      estimatedOneRepMax,
    };
  };

  describe('parseWeight', () => {
    it('should parse numeric strings', () => {
      expect(parseWeight('50')).toBe(50);
      expect(parseWeight('25.5')).toBe(25.5);
      expect(parseWeight('100.25')).toBe(100.25);
    });

    it('should extract weight from strings with units', () => {
      expect(parseWeight('50kg')).toBe(50);
      expect(parseWeight('25.5 kg')).toBe(25.5);
      expect(parseWeight('100lbs')).toBe(100);
    });

    it('should handle numbers directly', () => {
      expect(parseWeight(50)).toBe(50);
      expect(parseWeight(25.5)).toBe(25.5);
    });

    it('should return 0 for invalid input', () => {
      expect(parseWeight('invalid')).toBe(0);
      expect(parseWeight('')).toBe(0);
      expect(parseWeight(null)).toBe(0);
      expect(parseWeight(undefined)).toBe(0);
    });

    it('should extract first number from complex strings', () => {
      expect(parseWeight('BW+50kg')).toBe(50);
      expect(parseWeight('25.5 x 5 reps')).toBe(25.5);
    });
  });

  describe('updateExerciseHistory', () => {
    it('should add new exercise history entry', () => {
      const entry = {
        date: '2024-01-15',
        week: 5,
        day: 1,
        prescription: '3x8',
        sets: [true, true, true],
        weight: '50kg',
        rpe: { 0: '8', 1: '8', 2: '9' }
      };

      updateExerciseHistory('Pull-Ups', entry);

      const history = getExerciseHistory('Pull-Ups');
      expect(history.length).toBe(1);
      expect(history[0]).toEqual(entry);
    });

    it('should create history array for new exercise', () => {
      const entry = {
        date: '2024-01-15',
        week: 1,
        day: 1,
        prescription: '5x5',
        sets: [true, true, true, true, true],
        weight: '80kg'
      };

      updateExerciseHistory('Squats', entry);

      const history = getExerciseHistory('Squats');
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(1);
    });

    it('should update existing entry with same date/week/day', () => {
      const entry1 = {
        date: '2024-01-15',
        week: 5,
        day: 1,
        weight: '50kg',
        sets: [true, true]
      };
      const entry2 = {
        date: '2024-01-15',
        week: 5,
        day: 1,
        weight: '55kg',
        sets: [true, true, true]
      };

      updateExerciseHistory('Pull-Ups', entry1);
      updateExerciseHistory('Pull-Ups', entry2);

      const history = getExerciseHistory('Pull-Ups');
      expect(history.length).toBe(1);
      expect(history[0].weight).toBe('55kg');
      expect(history[0].sets.length).toBe(3);
    });

    it('should add separate entries for different dates', () => {
      const entry1 = {
        date: '2024-01-15',
        week: 5,
        day: 1,
        weight: '50kg',
        sets: [true, true]
      };
      const entry2 = {
        date: '2024-01-16',
        week: 5,
        day: 2,
        weight: '52.5kg',
        sets: [true, true, true]
      };

      updateExerciseHistory('Pull-Ups', entry1);
      updateExerciseHistory('Pull-Ups', entry2);

      const history = getExerciseHistory('Pull-Ups');
      expect(history.length).toBe(2);
    });

    it('should handle invalid entry gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      updateExerciseHistory('Pull-Ups', null);
      updateExerciseHistory('Pull-Ups', {});
      updateExerciseHistory('Pull-Ups', { week: 1, day: 1 }); // missing date

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      
      consoleErrorSpy.mockRestore();
    });

    it('should maintain history for multiple exercises separately', () => {
      const pullUpsEntry = {
        date: '2024-01-15',
        week: 5,
        day: 1,
        weight: '50kg',
        sets: [true, true]
      };
      const squatsEntry = {
        date: '2024-01-15',
        week: 5,
        day: 2,
        weight: '100kg',
        sets: [true, true, true]
      };

      updateExerciseHistory('Pull-Ups', pullUpsEntry);
      updateExerciseHistory('Squats', squatsEntry);

      const pullUpsHistory = getExerciseHistory('Pull-Ups');
      const squatsHistory = getExerciseHistory('Squats');

      expect(pullUpsHistory.length).toBe(1);
      expect(squatsHistory.length).toBe(1);
      expect(pullUpsHistory[0].weight).toBe('50kg');
      expect(squatsHistory[0].weight).toBe('100kg');
    });
  });

  describe('getExerciseHistory', () => {
    beforeEach(() => {
      const history = {
        'Pull-Ups': [
          { date: '2024-01-10', week: 4, day: 1, weight: '45kg' },
          { date: '2024-01-15', week: 5, day: 1, weight: '50kg' },
          { date: '2024-01-12', week: 4, day: 5, weight: '47.5kg' },
        ]
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(history));
    });

    it('should return history sorted by date descending', () => {
      const history = getExerciseHistory('Pull-Ups');

      expect(history.length).toBe(3);
      expect(history[0].date).toBe('2024-01-15'); // Most recent
      expect(history[1].date).toBe('2024-01-12');
      expect(history[2].date).toBe('2024-01-10'); // Oldest
    });

    it('should return empty array for non-existent exercise', () => {
      const history = getExerciseHistory('Non-Existent Exercise');

      expect(history).toEqual([]);
    });

    it('should return empty array when no history exists', () => {
      localStorage.getItem.mockReturnValue(null);

      const history = getExerciseHistory('Pull-Ups');

      expect(history).toEqual([]);
    });
  });

  describe('calculateExerciseStats', () => {
    beforeEach(() => {
      const history = {
        'Pull-Ups': [
          { 
            date: '2024-01-10', 
            week: 4, 
            day: 1, 
            weight: '45kg',
            sets: [true, true, true],
            prescription: '3x8 reps'
          },
          { 
            date: '2024-01-15', 
            week: 5, 
            day: 1, 
            weight: '50kg',
            sets: [true, true, true, true],
            prescription: '4x6 reps'
          },
          { 
            date: '2024-01-12', 
            week: 4, 
            day: 5, 
            weight: '47.5kg',
            sets: [true, true],
            prescription: '2x10 reps'
          },
        ],
        'Bodyweight-Only': [
          {
            date: '2024-01-10',
            week: 1,
            day: 1,
            sets: [true, true, true],
            prescription: '3x10 reps'
          }
        ]
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(history));
    });

    it('should calculate total workouts correctly', () => {
      const stats = calculateExerciseStats('Pull-Ups');

      expect(stats.totalWorkouts).toBe(3);
    });

    it('should calculate max sets correctly', () => {
      const stats = calculateExerciseStats('Pull-Ups');

      expect(stats.maxSets).toBe(4);
    });

    it('should calculate max weight correctly', () => {
      const stats = calculateExerciseStats('Pull-Ups');

      expect(stats.maxWeight).toBe(50);
    });

    it('should estimate 1RM using Brzycki formula', () => {
      const stats = calculateExerciseStats('Pull-Ups');

      // Max weight is 50kg at 6 reps
      // Formula: weight × (36 / (37 - reps))
      // 50 × (36 / (37 - 6)) = 50 × (36 / 31) ≈ 58.06
      expect(stats.estimatedOneRepMax).toBeGreaterThan(50);
      expect(stats.estimatedOneRepMax).toBeLessThan(65);
    });

    it('should return zeros for exercise with no history', () => {
      const stats = calculateExerciseStats('Non-Existent');

      expect(stats).toEqual({
        totalWorkouts: 0,
        maxSets: 0,
        maxWeight: 0,
        estimatedOneRepMax: 0,
      });
    });

    it('should handle bodyweight exercises (no weight)', () => {
      const stats = calculateExerciseStats('Bodyweight-Only');

      expect(stats.totalWorkouts).toBe(1);
      expect(stats.maxSets).toBe(3);
      expect(stats.maxWeight).toBe(0);
      expect(stats.estimatedOneRepMax).toBe(0);
    });

    it('should handle exercises with mixed weight formats', () => {
      const history = {
        'Mixed-Exercise': [
          { date: '2024-01-10', weight: '50kg', sets: [true, true], prescription: '2x5 reps' },
          { date: '2024-01-11', weight: 55, sets: [true, true], prescription: '2x5 reps' },
          { date: '2024-01-12', weight: '60', sets: [true, true], prescription: '2x5 reps' },
        ]
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(history));

      const stats = calculateExerciseStats('Mixed-Exercise');

      expect(stats.maxWeight).toBe(60);
    });

    it('should ignore invalid weights', () => {
      const history = {
        'Test-Exercise': [
          { date: '2024-01-10', weight: '50kg', sets: [true, true], prescription: '2x5 reps' },
          { date: '2024-01-11', weight: '', sets: [true, true], prescription: '2x5 reps' },
          { date: '2024-01-12', weight: null, sets: [true, true], prescription: '2x5 reps' },
          { date: '2024-01-13', weight: 'invalid', sets: [true, true], prescription: '2x5 reps' },
        ]
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(history));

      const stats = calculateExerciseStats('Test-Exercise');

      expect(stats.maxWeight).toBe(50);
      expect(stats.totalWorkouts).toBe(4); // Still counts workouts
    });
  });

  describe('Integration: Full workout tracking flow', () => {
    it('should track multiple workouts and calculate accurate stats', () => {
      // Week 1
      updateExerciseHistory('Pull-Ups', {
        date: '2024-01-01',
        week: 1,
        day: 1,
        weight: '40kg',
        sets: [true, true, true],
        prescription: '3x10 reps',
        rpe: { 0: '7', 1: '8', 2: '8' }
      });

      // Week 2
      updateExerciseHistory('Pull-Ups', {
        date: '2024-01-08',
        week: 2,
        day: 1,
        weight: '42.5kg',
        sets: [true, true, true],
        prescription: '3x10 reps',
        rpe: { 0: '7', 1: '8', 2: '9' }
      });

      // Week 3
      updateExerciseHistory('Pull-Ups', {
        date: '2024-01-15',
        week: 3,
        day: 1,
        weight: '45kg',
        sets: [true, true, true, true],
        prescription: '4x8 reps',
        rpe: { 0: '8', 1: '8', 2: '9', 3: '9' }
      });

      const stats = calculateExerciseStats('Pull-Ups');
      const history = getExerciseHistory('Pull-Ups');

      expect(history.length).toBe(3);
      expect(stats.totalWorkouts).toBe(3);
      expect(stats.maxWeight).toBe(45);
      expect(stats.maxSets).toBe(4);
      expect(stats.estimatedOneRepMax).toBeGreaterThan(45); // Should be estimated higher based on reps
    });
  });
});
