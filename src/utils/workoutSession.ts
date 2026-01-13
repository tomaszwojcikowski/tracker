/**
 * Workout Session Utilities
 *
 * Helper functions for parsing and managing workout session data.
 * These utilities are shared between WorkoutPlayer, CompactExerciseRow,
 * and SupersetGroup components.
 */

import type { ExerciseLogEntry, WorkoutSessionData } from '../types/workout';
import type { AddedExercise } from '../types';

// ============================================================================
// WEIGHT PARSING
// ============================================================================

/**
 * Parse a weight value from various formats to a number
 * @param weight - Weight value (string, number, or unknown)
 * @returns Parsed weight as number, or null if invalid
 */
export const parseWeight = (weight: unknown): number | null => {
    if (weight === null || weight === undefined) return null;
    if (typeof weight === 'number') return weight;
    if (typeof weight !== 'string') return null;

    const cleaned = weight.replace(/[^0-9.\-]/g, '').trim();
    if (!cleaned) return null;

    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is an ExerciseLogEntry
 *
 * ExerciseLogEntry has optional sets (boolean[]), weight, and rpe.
 * AddedExercise has required id, name, and sets (number).
 *
 * The check excludes objects that have all three AddedExercise-specific fields
 * (id, name, sets) to distinguish between the two types.
 *
 * @param value - Value to check
 * @returns True if value is an ExerciseLogEntry
 */
export const isExerciseLogEntry = (value: unknown): value is ExerciseLogEntry => {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        // Exclude AddedExercise objects which have id, name, and sets (number) as required fields
        !('id' in value && 'name' in value && 'sets' in value)
    );
};

/**
 * Get an exercise log entry from session data
 * @param logs - Workout session data
 * @param exerciseId - Exercise ID to look up
 * @returns ExerciseLogEntry for the exercise, or empty object if not found
 */
export const getExerciseLogEntry = (
    logs: WorkoutSessionData,
    exerciseId: string
): ExerciseLogEntry => {
    const exercises = logs.exercises ?? {};
    const entry = exercises[exerciseId];
    if (isExerciseLogEntry(entry)) {
        return entry;
    }
    return {};
};

// ============================================================================
// DATA NORMALIZATION
// ============================================================================

/**
 * Normalize added exercises array from unknown value
 * @param value - Value to normalize
 * @returns Array of valid AddedExercise items
 */
export const normalizeAddedExercises = (value: unknown): AddedExercise[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is AddedExercise => {
        return (
            !!item &&
            typeof item === 'object' &&
            'id' in item &&
            'name' in item &&
            'sets' in item
        );
    });
};

// ============================================================================
// EXERCISE ID UTILITIES
// ============================================================================

/**
 * Generate a normalized exercise ID from exercise name
 * @param name - Exercise name
 * @returns Normalized exercise ID (lowercase with underscores)
 */
export const getExerciseId = (name: string): string => {
    if (!name) return '';
    // Convert to lowercase and replace spaces with underscores
    // Also replace characters that are invalid in Firebase paths: . # $ [ ] /
    return name
        .toLowerCase()
        .replace(/\s+/g, '_')  // Replace one or more spaces with single underscore
        .replace(/[.#$\[\]/]/g, '_');  // Replace Firebase-invalid characters
};

/**
 * Generate an exercise ID for added exercises
 * @param exerciseId - Original exercise ID
 * @returns Prefixed exercise ID for added exercises
 */
export const getAddedExerciseId = (exerciseId: string): string => {
    return `added_${exerciseId}`;
};
