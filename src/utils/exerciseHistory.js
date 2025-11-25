import { safeGetJSON, safeSetJSON } from './storage';
import { STORAGE_KEYS } from '../constants';

/**
 * Exercise History Utilities
 * 
 * Functions for tracking and analyzing exercise performance over time.
 */

/**
 * Update exercise history with a new entry
 * @param {string} exerciseName - Name of the exercise
 * @param {Object} entry - History entry with date, week, day, sets, weight, etc.
 */
export const updateExerciseHistory = (exerciseName, entry) => {
    const history = safeGetJSON(STORAGE_KEYS.EXERCISE_HISTORY, {});
    
    // Validate history structure
    if (typeof history !== 'object' || history === null) {
        console.warn('Invalid exercise history, resetting');
        safeSetJSON(STORAGE_KEYS.EXERCISE_HISTORY, {});
        return;
    }
    
    if (!history[exerciseName]) {
        history[exerciseName] = [];
    }
    
    // Validate exercise name and entry
    if (!exerciseName || typeof exerciseName !== 'string') {
        console.error('Invalid exercise name:', exerciseName);
        return;
    }
    
    if (!entry || typeof entry !== 'object') {
        console.error('Invalid history entry:', entry);
        return;
    }
    
    history[exerciseName].push(entry);
    safeSetJSON(STORAGE_KEYS.EXERCISE_HISTORY, history);
};

/**
 * Get history for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {Array} Array of history entries
 */
export const getExerciseHistory = (exerciseName) => {
    const history = safeGetJSON(STORAGE_KEYS.EXERCISE_HISTORY, {});
    
    if (typeof history !== 'object' || history === null) {
        console.warn('Invalid exercise history structure');
        return [];
    }
    
    const exerciseHistory = history[exerciseName] || [];
    
    if (!Array.isArray(exerciseHistory)) {
        console.warn(`Invalid history for ${exerciseName}, expected array`);
        return [];
    }
    
    return exerciseHistory;
};

/**
 * Calculate statistics for an exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {Object} Stats including totalWorkouts, maxSets, maxWeight, estimated1RM, etc.
 */
export const calculateExerciseStats = (exerciseName) => {
    const history = getExerciseHistory(exerciseName);
    
    if (history.length === 0) {
        return {
            totalWorkouts: 0,
            maxSets: null,
            maxWeight: null,
            maxWeightBySets: {},
            estimated1RM: null,
            recentProgress: []
        };
    }

    let maxSets = 0;
    let maxWeight = 0;
    const maxWeightBySets = {};
    let estimated1RM = 0;

    history.forEach(entry => {
        // Track max sets completed
        if (entry.sets > maxSets) {
            maxSets = entry.sets;
        }

        // Track max weight
        if (entry.weight && entry.weight > maxWeight) {
            maxWeight = entry.weight;
        }

        // Track max weight by set count
        if (entry.weight && entry.sets) {
            if (!maxWeightBySets[entry.sets] || entry.weight > maxWeightBySets[entry.sets]) {
                maxWeightBySets[entry.sets] = entry.weight;
            }

            // Calculate estimated 1RM using Epley formula: 1RM = weight × (1 + reps/30)
            if (entry.prescription && entry.weight) {
                const repsMatch = entry.prescription.match(/x\s*(\d+)\s*reps?\b/i);
                if (repsMatch) {
                    const reps = parseInt(repsMatch[1], 10);
                    const estimated = entry.weight * (1 + reps / 30);
                    if (estimated > estimated1RM) {
                        estimated1RM = estimated;
                    }
                }
            }
        }
    });

    // Get recent progress (last 10 entries)
    const recentProgress = history
        .slice(-10)
        .map(entry => ({
            date: entry.date,
            sets: entry.sets,
            weight: entry.weight,
            week: entry.week,
            day: entry.day
        }));

    return {
        totalWorkouts: history.length,
        maxSets,
        maxWeight: maxWeight || null,
        maxWeightBySets,
        estimated1RM: estimated1RM > 0 ? Math.round(estimated1RM * 10) / 10 : null,
        recentProgress
    };
};

/**
 * Get all exercises that have history
 * @returns {Array<string>} Sorted array of exercise names
 */
export const getAllExercisesWithHistory = () => {
    const history = safeGetJSON(STORAGE_KEYS.EXERCISE_HISTORY, {});
    return Object.keys(history).sort();
};

/**
 * Calculate total training volume for a workout
 * @param {Array} exercises - Array of exercise data with sets, reps, weight
 * @returns {Object} Volume stats including total volume, exercise breakdown
 */
export const calculateWorkoutVolume = (exercises) => {
    let totalVolume = 0;
    const breakdown = [];
    
    exercises.forEach(ex => {
        const weight = parseFloat(ex.weight) || 0;
        const sets = ex.completedSets || 0;
        
        // Extract reps from prescription
        const repsMatch = ex.prescription?.match(/x\s*(\d+)/i);
        const reps = repsMatch ? parseInt(repsMatch[1], 10) : 0;
        
        const volume = sets * reps * weight;
        totalVolume += volume;
        
        if (volume > 0) {
            breakdown.push({
                name: ex.name,
                volume,
                sets,
                reps,
                weight
            });
        }
    });
    
    return {
        totalVolume: Math.round(totalVolume),
        breakdown: breakdown.sort((a, b) => b.volume - a.volume)
    };
};

/**
 * Safely parse weight value
 * @param {string|number} weight - Weight value
 * @returns {number|null} Parsed weight or null
 */
export const parseWeight = (weight) => {
    return weight ? parseFloat(weight) : null;
};
