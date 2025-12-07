/**
 * Exercise Options Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
    applyExerciseOption,
    getExerciseDisplayName,
    validateExerciseOption,
    getExerciseOptionSummary,
    exerciseNeedsOptionSelection,
    getDefaultExerciseOption,
} from '../utils/exerciseOptions';
import type { ExerciseOption } from '../workout-plan-utils';

describe('Exercise Options Utilities', () => {
    describe('applyExerciseOption', () => {
        it('should merge option properties with base exercise', () => {
            const baseExercise = {
                name: 'Lower Body Compound',
                sets: 4,
                reps: '8-12',
                restSeconds: 180,
            };

            const option: ExerciseOption = {
                optionName: 'Barbell Back Squat',
                exerciseName: 'Barbell Back Squat',
                sets: 5,
                loadUnit: 'kg',
                loadMin: 60,
                loadMax: 100,
            };

            const result = applyExerciseOption(baseExercise, option);

            expect(result.name).toBe('Barbell Back Squat');
            expect(result.sets).toBe(5);
            expect(result.restSeconds).toBe(180); // Preserved from base
            expect(result.loadUnit).toBe('kg');
            expect(result.loadMin).toBe(60);
            expect(result.loadMax).toBe(100);
        });

        it('should preserve base properties when option does not override', () => {
            const baseExercise = {
                name: 'Exercise',
                sets: 3,
                rpe: 8,
            };

            const option: ExerciseOption = {
                optionName: 'Variation 1',
                sets: 4,
            };

            const result = applyExerciseOption(baseExercise, option);

            expect(result.sets).toBe(4);
            expect(result.rpe).toBe(8); // Preserved
        });
    });

    describe('getExerciseDisplayName', () => {
        const options: ExerciseOption[] = [
            {
                optionName: 'Barbell',
                exerciseName: 'Barbell Back Squat',
            },
            {
                optionName: 'Dumbbell',
                exerciseName: 'Goblet Squat',
            },
            {
                optionName: 'Bodyweight',
                // No exerciseName override
            },
        ];

        it('should return option exercise name when specified', () => {
            const name = getExerciseDisplayName('Squat', options, 'Barbell');
            expect(name).toBe('Barbell Back Squat');
        });

        it('should return base name with suffix when option has no exercise name', () => {
            const name = getExerciseDisplayName('Squat', options, 'Bodyweight');
            expect(name).toBe('Squat (Bodyweight)');
        });

        it('should return base name when no option selected', () => {
            const name = getExerciseDisplayName('Squat', options, undefined);
            expect(name).toBe('Squat');
        });

        it('should return base name when options are undefined', () => {
            const name = getExerciseDisplayName('Squat', undefined, 'Barbell');
            expect(name).toBe('Squat');
        });

        it('should return base name when selected option not found', () => {
            const name = getExerciseDisplayName('Squat', options, 'NonExistent');
            expect(name).toBe('Squat');
        });
    });

    describe('validateExerciseOption', () => {
        const options: ExerciseOption[] = [
            { optionName: 'Option A' },
            { optionName: 'Option B' },
        ];

        it('should return true when no options are defined', () => {
            expect(validateExerciseOption(undefined, undefined)).toBe(true);
            expect(validateExerciseOption([], undefined)).toBe(true);
        });

        it('should return false when options exist but none selected', () => {
            expect(validateExerciseOption(options, undefined)).toBe(false);
        });

        it('should return true when valid option is selected', () => {
            expect(validateExerciseOption(options, 'Option A')).toBe(true);
            expect(validateExerciseOption(options, 'Option B')).toBe(true);
        });

        it('should return false when invalid option is selected', () => {
            expect(validateExerciseOption(options, 'Invalid')).toBe(false);
        });
    });

    describe('getExerciseOptionSummary', () => {
        it('should format basic rep and set info', () => {
            const option: ExerciseOption = {
                optionName: 'Test',
                sets: 4,
                repsMin: 8,
                repsMax: 12,
            };

            const summary = getExerciseOptionSummary(option);
            expect(summary).toBe('4 sets, 8-12 reps');
        });

        it('should format load range', () => {
            const option: ExerciseOption = {
                optionName: 'Test',
                loadMin: 60,
                loadMax: 100,
                loadUnit: 'kg',
            };

            const summary = getExerciseOptionSummary(option);
            expect(summary).toBe('60-100kg');
        });

        it('should format fixed load', () => {
            const option: ExerciseOption = {
                optionName: 'Test',
                loadMin: 50,
                loadMax: 50,
                loadUnit: 'kg',
            };

            const summary = getExerciseOptionSummary(option);
            expect(summary).toBe('50kg');
        });

        it('should format bodyweight', () => {
            const option: ExerciseOption = {
                optionName: 'Test',
                loadUnit: 'bodyweight',
            };

            const summary = getExerciseOptionSummary(option);
            expect(summary).toBe('Bodyweight');
        });

        it('should include per side indicator', () => {
            const option: ExerciseOption = {
                optionName: 'Test',
                sets: 3,
                repsMin: 10,
                repsMax: 12,
                repsPerSide: true,
            };

            const summary = getExerciseOptionSummary(option);
            expect(summary).toBe('3 sets, 10-12 reps, per side');
        });

        it('should format ladder reps', () => {
            const option: ExerciseOption = {
                optionName: 'Test',
                repsValue: [1, 2, 3],
            };

            const summary = getExerciseOptionSummary(option);
            expect(summary).toBe('1-2-3 ladder');
        });

        it('should format single rep value', () => {
            const option: ExerciseOption = {
                optionName: 'Test',
                repsValue: 10,
            };

            const summary = getExerciseOptionSummary(option);
            expect(summary).toBe('10 reps');
        });

        it('should combine multiple properties', () => {
            const option: ExerciseOption = {
                optionName: 'Test',
                sets: 5,
                repsMin: 8,
                repsMax: 12,
                loadMin: 60,
                loadMax: 100,
                loadUnit: 'kg',
            };

            const summary = getExerciseOptionSummary(option);
            expect(summary).toBe('5 sets, 8-12 reps, 60-100kg');
        });
    });

    describe('exerciseNeedsOptionSelection', () => {
        it('should return false when no options exist', () => {
            expect(exerciseNeedsOptionSelection(undefined, undefined)).toBe(false);
            expect(exerciseNeedsOptionSelection([], undefined)).toBe(false);
        });

        it('should return true when options exist but none selected', () => {
            const options: ExerciseOption[] = [{ optionName: 'A' }];
            expect(exerciseNeedsOptionSelection(options, undefined)).toBe(true);
        });

        it('should return false when option is selected', () => {
            const options: ExerciseOption[] = [{ optionName: 'A' }];
            expect(exerciseNeedsOptionSelection(options, 'A')).toBe(false);
        });
    });

    describe('getDefaultExerciseOption', () => {
        it('should return undefined when no options', () => {
            expect(getDefaultExerciseOption(undefined)).toBeUndefined();
            expect(getDefaultExerciseOption([])).toBeUndefined();
        });

        it('should return first option name', () => {
            const options: ExerciseOption[] = [
                { optionName: 'First' },
                { optionName: 'Second' },
            ];
            expect(getDefaultExerciseOption(options)).toBe('First');
        });
    });
});
