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
 * Calculate volume for a single exercise
 * @param {Object} exercise - Exercise data
 * @param {number} exercise.completedSets - Number of completed sets
 * @param {string} exercise.prescription - Prescription string (e.g., "3 x 10 reps")
 * @param {number|string} exercise.weight - Weight used (in kg)
 * @returns {number} Volume in kg
 */
export const calculateExerciseVolume = (exercise) => {
    const { completedSets = 0, prescription = '', weight = 0 } = exercise;
    
    // Extract reps from prescription (e.g., "3 x 10 reps" -> 10)
    const repsMatch = prescription.match(/x\s*(\d+)\s*reps?/i) ||
                      prescription.match(/^(\d+)\s*reps?/i);
    const reps = repsMatch ? parseInt(repsMatch[1], 10) : 0;
    
    const parsedWeight = parseFloat(weight) || 0;
    
    return completedSets * reps * parsedWeight;
};

/**
 * Calculate total volume for a workout
 * @param {Array} exercises - Array of exercise data
 * @returns {Object} Volume breakdown
 */
export const calculateWorkoutVolume = (exercises) => {
    if (!Array.isArray(exercises)) {
        return {
            totalVolume: 0,
            exerciseCount: 0,
            breakdown: [],
            averagePerExercise: 0
        };
    }
    
    let totalVolume = 0;
    const breakdown = [];
    
    exercises.forEach(ex => {
        const volume = calculateExerciseVolume(ex);
        totalVolume += volume;
        
        if (volume > 0) {
            breakdown.push({
                name: ex.name || 'Unknown',
                volume,
                sets: ex.completedSets || 0,
                weight: parseFloat(ex.weight) || 0
            });
        }
    });
    
    return {
        totalVolume: Math.round(totalVolume),
        exerciseCount: breakdown.length,
        breakdown: breakdown.sort((a, b) => b.volume - a.volume),
        averagePerExercise: breakdown.length > 0 
            ? Math.round(totalVolume / breakdown.length) 
            : 0
    };
};

/**
 * Save volume entry to history
 * @param {Object} entry - Volume entry
 * @param {number} entry.week - Week number
 * @param {number} entry.day - Day number
 * @param {string} entry.date - ISO date string
 * @param {number} entry.totalVolume - Total volume in kg
 * @param {Array} entry.breakdown - Per-exercise breakdown
 */
export const saveVolumeEntry = (entry) => {
    const history = safeGetJSON(VOLUME_HISTORY_KEY, []);
    
    // Remove existing entry for same week/day if exists
    const filtered = history.filter(
        h => !(h.week === entry.week && h.day === entry.day)
    );
    
    filtered.push({
        ...entry,
        savedAt: new Date().toISOString()
    });
    
    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    safeSetJSON(VOLUME_HISTORY_KEY, filtered);
};

/**
 * Get volume history
 * @param {Object} options - Filter options
 * @param {number} options.limit - Max entries to return
 * @param {number} options.weeks - Filter by last N weeks
 * @returns {Array} Volume history entries
 */
export const getVolumeHistory = (options = {}) => {
    const { limit, weeks } = options;
    let history = safeGetJSON(VOLUME_HISTORY_KEY, []);
    
    if (weeks) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (weeks * 7));
        history = history.filter(h => new Date(h.date) >= cutoff);
    }
    
    if (limit) {
        history = history.slice(0, limit);
    }
    
    return history;
};

/**
 * Calculate volume statistics over time
 * @param {number} weeks - Number of weeks to analyze
 * @returns {Object} Volume statistics
 */
export const calculateVolumeStats = (weeks = 4) => {
    const history = getVolumeHistory({ weeks });
    
    if (history.length === 0) {
        return {
            totalVolume: 0,
            averagePerWorkout: 0,
            averagePerWeek: 0,
            workoutCount: 0,
            trend: 'neutral',
            weeklyBreakdown: []
        };
    }
    
    const totalVolume = history.reduce((sum, h) => sum + (h.totalVolume || 0), 0);
    const averagePerWorkout = Math.round(totalVolume / history.length);
    
    // Group by week
    const weeklyTotals = {};
    history.forEach(h => {
        const weekKey = `W${h.week}`;
        if (!weeklyTotals[weekKey]) {
            weeklyTotals[weekKey] = 0;
        }
        weeklyTotals[weekKey] += h.totalVolume || 0;
    });
    
    const weeklyBreakdown = Object.entries(weeklyTotals)
        .map(([week, volume]) => ({ week, volume: Math.round(volume) }))
        .sort((a, b) => {
            const weekA = parseInt(a.week.replace('W', ''));
            const weekB = parseInt(b.week.replace('W', ''));
            return weekA - weekB;
        });
    
    // Calculate trend (comparing recent vs older workouts)
    let trend = 'neutral';
    if (history.length >= 4) {
        const recentHalf = history.slice(0, Math.floor(history.length / 2));
        const olderHalf = history.slice(Math.floor(history.length / 2));
        
        const recentAvg = recentHalf.reduce((s, h) => s + h.totalVolume, 0) / recentHalf.length;
        const olderAvg = olderHalf.reduce((s, h) => s + h.totalVolume, 0) / olderHalf.length;
        
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
        weeklyBreakdown
    };
};

/**
 * Format volume for display
 * @param {number} volume - Volume in kg
 * @returns {string} Formatted string (e.g., "12,450 kg" or "12.4k kg")
 */
export const formatVolume = (volume) => {
    if (volume >= 10000) {
        return `${(volume / 1000).toFixed(1)}k kg`;
    }
    return `${volume.toLocaleString()} kg`;
};
