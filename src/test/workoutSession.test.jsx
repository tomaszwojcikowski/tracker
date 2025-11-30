import { describe, it, expect } from 'vitest';

/**
 * Workout Session Utilities Tests
 *
 * Tests the utility functions used across workout components.
 */

import {
    parseWeight,
    getExerciseLogEntry,
    normalizeAddedExercises,
    getExerciseId,
} from '../utils/workoutSession';

describe('Workout Session Utilities', () => {
    describe('parseWeight', () => {
        it('should parse numeric string', () => {
            expect(parseWeight('50')).toBe(50);
        });

        it('should parse string with kg suffix', () => {
            expect(parseWeight('50kg')).toBe(50);
        });

        it('should parse string with spaces', () => {
            expect(parseWeight('  50  ')).toBe(50);
        });

        it('should parse decimal values', () => {
            expect(parseWeight('52.5')).toBe(52.5);
        });

        it('should parse number directly', () => {
            expect(parseWeight(60)).toBe(60);
        });

        it('should return null for null input', () => {
            expect(parseWeight(null)).toBeNull();
        });

        it('should return null for undefined input', () => {
            expect(parseWeight(undefined)).toBeNull();
        });

        it('should return null for empty string', () => {
            expect(parseWeight('')).toBeNull();
        });

        it('should return null for non-numeric string', () => {
            expect(parseWeight('abc')).toBeNull();
        });

        it('should return null for object input', () => {
            expect(parseWeight({})).toBeNull();
        });

        it('should return null for array input', () => {
            expect(parseWeight([50])).toBeNull();
        });

        it('should handle negative values', () => {
            expect(parseWeight('-5')).toBe(-5);
        });

        it('should handle string with multiple numbers', () => {
            expect(parseWeight('50-60')).toBe(50); // Takes first number
        });
    });

    describe('getExerciseLogEntry', () => {
        it('should return existing log entry', () => {
            const logs = {
                bench_press: { sets: [true, false], weight: '50', rpe: { 0: '8' } },
            };

            const result = getExerciseLogEntry(logs, 'bench_press');

            expect(result).toEqual({ sets: [true, false], weight: '50', rpe: { 0: '8' } });
        });

        it('should return empty object for missing entry', () => {
            const logs = {};

            const result = getExerciseLogEntry(logs, 'squats');

            expect(result).toEqual({});
        });

        it('should return empty object for non-log entry', () => {
            const logs = {
                some_id: { id: 'test', name: 'Test', sets: 3 }, // This is AddedExercise format
            };

            // This should be handled by the type guard
            const result = getExerciseLogEntry(logs, 'some_id');

            expect(result).toEqual({});
        });

        it('should handle null in logs', () => {
            const logs = {
                bench_press: null,
            };

            const result = getExerciseLogEntry(logs, 'bench_press');

            expect(result).toEqual({});
        });
    });

    describe('normalizeAddedExercises', () => {
        it('should return array of valid exercises', () => {
            const input = [
                { id: 'ex1', name: 'Exercise 1', sets: 3 },
                { id: 'ex2', name: 'Exercise 2', sets: 4, weight: '20', rest: 60 },
            ];

            const result = normalizeAddedExercises(input);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 'ex1', name: 'Exercise 1', sets: 3 });
        });

        it('should filter out invalid exercises', () => {
            const input = [
                { id: 'ex1', name: 'Exercise 1', sets: 3 },
                { name: 'Missing ID' }, // Invalid - no id
                { id: 'ex2' }, // Invalid - no name
                null,
                undefined,
            ];

            const result = normalizeAddedExercises(input);

            expect(result).toHaveLength(1);
        });

        it('should return empty array for non-array input', () => {
            expect(normalizeAddedExercises(null)).toEqual([]);
            expect(normalizeAddedExercises(undefined)).toEqual([]);
            expect(normalizeAddedExercises({})).toEqual([]);
            expect(normalizeAddedExercises('string')).toEqual([]);
        });

        it('should return empty array for empty array', () => {
            expect(normalizeAddedExercises([])).toEqual([]);
        });
    });

    describe('getExerciseId', () => {
        it('should convert name to lowercase with underscores', () => {
            expect(getExerciseId('Bench Press')).toBe('bench_press');
        });

        it('should handle multiple spaces', () => {
            expect(getExerciseId('Incline  Dumbbell  Press')).toBe('incline_dumbbell_press');
        });

        it('should handle single word', () => {
            expect(getExerciseId('Squats')).toBe('squats');
        });

        it('should handle already lowercase', () => {
            expect(getExerciseId('pull ups')).toBe('pull_ups');
        });

        it('should handle special characters', () => {
            // Based on implementation, only spaces are replaced
            expect(getExerciseId("Farmer's Walk")).toBe("farmer's_walk");
        });

        it('should handle empty string', () => {
            expect(getExerciseId('')).toBe('');
        });

        it('should handle leading/trailing spaces', () => {
            expect(getExerciseId('  Bench Press  ')).toBe('_bench_press_');
        });
    });
});
