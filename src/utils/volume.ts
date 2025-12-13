/**
 * Volume Tracking Utilities
 *
 * Functions for calculating and tracking training volume.
 * Volume = Sets × Reps × Weight
 *
 * Volume tracking helps athletes:
 * - Monitor progressive overload
 * - Identify training trends
 * - Prevent overtraining
 * - Optimize recovery
 */

import { safeGetJSON, safeSetJSON } from './storage';

// Storage key for volume history
const VOLUME_HISTORY_KEY = 'volume_history';

/**
 * Exercise data for volume calculation
 */
export interface ExerciseVolumeInput {
  completedSets?: number;
  prescription?: string;
  weight?: number | string;
  name?: string;
}

/**
 * Per-exercise volume breakdown
 */
export interface VolumeBreakdownItem {
  name: string;
  volume: number;
  sets: number;
  weight: number;
}

/**
 * Workout volume result
 */
export interface WorkoutVolumeResult {
  totalVolume: number;
  exerciseCount: number;
  breakdown: VolumeBreakdownItem[];
  averagePerExercise: number;
}

/**
 * Volume history entry
 */
export interface VolumeEntry {
  week: number;
  day: number;
  date: string;
  totalVolume: number;
  breakdown: VolumeBreakdownItem[];
  savedAt?: string;
}

/**
 * Weekly volume breakdown
 */
export interface WeeklyBreakdown {
  week: string;
  volume: number;
}

/**
 * Volume trend direction
 */
export type VolumeTrend = 'increasing' | 'decreasing' | 'neutral';

/**
 * Volume statistics result
 */
export interface VolumeStats {
  totalVolume: number;
  averagePerWorkout: number;
  averagePerWeek: number;
  workoutCount: number;
  trend: VolumeTrend;
  weeklyBreakdown: WeeklyBreakdown[];
}

/**
 * Options for getting volume history
 */
export interface VolumeHistoryOptions {
  limit?: number;
  weeks?: number;
}

/**
 * Calculate volume for a single exercise
 * @param exercise - Exercise data
 * @returns Volume in kg
 */
export const calculateExerciseVolume = (
  exercise: ExerciseVolumeInput
): number => {
  const { completedSets = 0, prescription = '', weight = 0 } = exercise;

  // Extract reps from prescription (e.g., "3 x 10 reps" -> 10)
  const repsMatch =
    prescription.match(/x\s*(\d+)\s*reps?/i) ||
    prescription.match(/^(\d+)\s*reps?/i);
  const reps = repsMatch ? parseInt(repsMatch[1], 10) : 0;

  const parsedWeight =
    typeof weight === 'string' ? parseFloat(weight) || 0 : weight || 0;

  return completedSets * reps * parsedWeight;
};

/**
 * Calculate total volume for a workout
 * @param exercises - Array of exercise data
 * @returns Volume breakdown
 */
export const calculateWorkoutVolume = (
  exercises: ExerciseVolumeInput[]
): WorkoutVolumeResult => {
  if (!Array.isArray(exercises)) {
    return {
      totalVolume: 0,
      exerciseCount: 0,
      breakdown: [],
      averagePerExercise: 0,
    };
  }

  let totalVolume = 0;
  const breakdown: VolumeBreakdownItem[] = [];

  exercises.forEach((ex) => {
    const volume = calculateExerciseVolume(ex);
    totalVolume += volume;

    if (volume > 0) {
      const parsedWeight =
        typeof ex.weight === 'string'
          ? parseFloat(ex.weight) || 0
          : ex.weight || 0;

      breakdown.push({
        name: ex.name || 'Unknown',
        volume,
        sets: ex.completedSets || 0,
        weight: parsedWeight,
      });
    }
  });

  return {
    totalVolume: Math.round(totalVolume),
    exerciseCount: breakdown.length,
    breakdown: breakdown.sort((a, b) => b.volume - a.volume),
    averagePerExercise:
      breakdown.length > 0 ? Math.round(totalVolume / breakdown.length) : 0,
  };
};

/**
 * Save volume entry to history
 * @param entry - Volume entry
 */
export const saveVolumeEntry = (entry: VolumeEntry): void => {
  const history = safeGetJSON<VolumeEntry[]>(VOLUME_HISTORY_KEY, []);

  // Remove existing entry for same week/day if exists
  const filtered = history.filter(
    (h) => !(h.week === entry.week && h.day === entry.day)
  );

  filtered.push({
    ...entry,
    savedAt: new Date().toISOString(),
  });

  // Sort by date descending
  filtered.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  safeSetJSON(VOLUME_HISTORY_KEY, filtered);
};

/**
 * Get volume history
 * @param options - Filter options
 * @returns Volume history entries
 */
export const getVolumeHistory = (
  options: VolumeHistoryOptions = {}
): VolumeEntry[] => {
  const { limit, weeks } = options;
  let history = safeGetJSON<VolumeEntry[]>(VOLUME_HISTORY_KEY, []);

  if (weeks) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    history = history.filter((h) => new Date(h.date) >= cutoff);
  }

  if (limit) {
    history = history.slice(0, limit);
  }

  return history;
};

/**
 * Calculate volume statistics over time
 * @param weeks - Number of weeks to analyze
 * @returns Volume statistics
 */
export const calculateVolumeStats = (weeks: number = 4): VolumeStats => {
  const history = getVolumeHistory({ weeks });

  if (history.length === 0) {
    return {
      totalVolume: 0,
      averagePerWorkout: 0,
      averagePerWeek: 0,
      workoutCount: 0,
      trend: 'neutral',
      weeklyBreakdown: [],
    };
  }

  const totalVolume = history.reduce(
    (sum, h) => sum + (h.totalVolume || 0),
    0
  );
  const averagePerWorkout = Math.round(totalVolume / history.length);

  // Group by week
  const weeklyTotals: Record<string, number> = {};
  history.forEach((h) => {
    const weekKey = `W${h.week}`;
    if (!weeklyTotals[weekKey]) {
      weeklyTotals[weekKey] = 0;
    }
    weeklyTotals[weekKey] += h.totalVolume || 0;
  });

  const weeklyBreakdown: WeeklyBreakdown[] = Object.entries(weeklyTotals)
    .map(([week, volume]) => ({ week, volume: Math.round(volume) }))
    .sort((a, b) => {
      const weekA = parseInt(a.week.replace('W', ''));
      const weekB = parseInt(b.week.replace('W', ''));
      return weekA - weekB;
    });

  // Calculate trend (comparing recent vs older workouts)
  let trend: VolumeTrend = 'neutral';
  if (history.length >= 4) {
    const recentHalf = history.slice(0, Math.floor(history.length / 2));
    const olderHalf = history.slice(Math.floor(history.length / 2));

    const recentAvg =
      recentHalf.reduce((s, h) => s + h.totalVolume, 0) / recentHalf.length;
    const olderAvg =
      olderHalf.reduce((s, h) => s + h.totalVolume, 0) / olderHalf.length;

    if (recentAvg > olderAvg * 1.1) {
      trend = 'increasing';
    } else if (recentAvg < olderAvg * 0.9) {
      trend = 'decreasing';
    }
  }

  return {
    totalVolume: Math.round(totalVolume),
    averagePerWorkout,
    averagePerWeek: Math.round(totalVolume / weeks),
    workoutCount: history.length,
    trend,
    weeklyBreakdown,
  };
};

/**
 * Format volume for display
 * @param volume - Volume in kg
 * @returns Formatted string (e.g., "12,450 kg" or "12.4k kg")
 */
export const formatVolume = (volume: number): string => {
  if (volume >= 10000) {
    return `${(volume / 1000).toFixed(1)}k kg`;
  }
  return `${volume.toLocaleString('en-US')} kg`;
};
