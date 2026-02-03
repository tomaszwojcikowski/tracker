/**
 * Exercise Options Display Test
 *
 * Tests to verify that selected exercise option names are displayed correctly in details modal
 */

import { describe, it, expect } from 'vitest';
import { getExerciseDisplayName } from '../utils/exerciseOptions';
import type { ExerciseOption } from '../workout-plan-utils';

describe('Exercise Options Display', () => {
    describe('getExerciseDisplayName', () => {
        it('should return base name when no options provided', () => {
            const baseName = 'Hip Flexor Stretch';
            const result = getExerciseDisplayName(baseName, undefined, undefined);
            expect(result).toBe(baseName);
        });

        it('should return base name when options exist but none selected', () => {
            const baseName = 'Hip Flexor Stretch';
            const options: ExerciseOption[] = [
                { optionName: 'Couch Stretch', description: 'Deep hip flexor stretch' },
                { optionName: 'Kneeling Hip Flexor Stretch', description: 'Classic stretch' },
            ];
            const result = getExerciseDisplayName(baseName, options, undefined);
            expect(result).toBe(baseName);
        });

        it('should return base name when selected option is not found', () => {
            const baseName = 'Hip Flexor Stretch';
            const options: ExerciseOption[] = [
                { optionName: 'Couch Stretch', description: 'Deep hip flexor stretch' },
            ];
            const result = getExerciseDisplayName(baseName, options, 'Non-existent Option');
            expect(result).toBe(baseName);
        });

        it('should return option exerciseName when specified', () => {
            const baseName = 'Hip Flexor Stretch';
            const options: ExerciseOption[] = [
                {
                    optionName: 'Couch Stretch',
                    exerciseName: 'Couch Stretch',
                    description: 'Deep hip flexor stretch'
                },
            ];
            const result = getExerciseDisplayName(baseName, options, 'Couch Stretch');
            expect(result).toBe('Couch Stretch');
        });

        it('should return combined name when option has no exerciseName', () => {
            const baseName = 'Hip Flexor Stretch';
            const options: ExerciseOption[] = [
                {
                    optionName: 'Couch Stretch',
                    description: 'Deep hip flexor stretch'
                },
            ];
            const result = getExerciseDisplayName(baseName, options, 'Couch Stretch');
            expect(result).toBe('Hip Flexor Stretch (Couch Stretch)');
        });

        it('should handle options with only optionName', () => {
            const baseName = 'Spinal Decompression';
            const options: ExerciseOption[] = [
                { optionName: 'Light Weighted Jefferson Curl' },
                { optionName: 'Standing Pike Stretch (PVC)' },
            ];
            const result = getExerciseDisplayName(baseName, options, 'Light Weighted Jefferson Curl');
            expect(result).toBe('Spinal Decompression (Light Weighted Jefferson Curl)');
        });

        it('should handle option with exerciseName override', () => {
            const baseName = 'Spinal Decompression';
            const options: ExerciseOption[] = [
                {
                    optionName: 'Jefferson Curl',
                    exerciseName: 'Light Weighted Jefferson Curl',
                    description: 'Spinal segmentation and hamstring stretch'
                },
            ];
            const result = getExerciseDisplayName(baseName, options, 'Jefferson Curl');
            expect(result).toBe('Light Weighted Jefferson Curl');
        });

        it('should handle exercise with multiple options and select correct one', () => {
            const baseName = 'Hip Mobility';
            const options: ExerciseOption[] = [
                { optionName: '90/90 Hip Rotations', exerciseName: '90/90 Hip Rotations' },
                { optionName: 'Pigeon Stretch', exerciseName: 'Pigeon Stretch' },
                { optionName: 'Seated Figure-4 Stretch', exerciseName: 'Seated Figure-4 Stretch' },
            ];

            const result1 = getExerciseDisplayName(baseName, options, 'Pigeon Stretch');
            expect(result1).toBe('Pigeon Stretch');

            const result2 = getExerciseDisplayName(baseName, options, '90/90 Hip Rotations');
            expect(result2).toBe('90/90 Hip Rotations');
        });
    });

    describe('Display name in context', () => {
        it('should use selected option name for history modal', () => {
            // Simulate what ExerciseCard does
            const effectiveName = 'Hip Flexor Stretch';
            const exerciseOptions: ExerciseOption[] = [
                {
                    optionName: 'Couch Stretch',
                    exerciseName: 'Couch Stretch',
                    description: 'Deep hip flexor and quad stretch',
                    notes: 'Critical for hip flexors after Squats'
                },
                {
                    optionName: 'Kneeling Hip Flexor Stretch',
                    exerciseName: 'Kneeling Hip Flexor Stretch',
                    description: 'Classic hip flexor stretch'
                },
            ];
            const selectedOption = 'Couch Stretch';

            // What would be passed to onShowHistory
            const displayName = getExerciseDisplayName(effectiveName, exerciseOptions, selectedOption);

            expect(displayName).toBe('Couch Stretch');
            expect(displayName).not.toBe(effectiveName);
        });

        it('should fall back to effectiveName when no option selected', () => {
            const effectiveName = 'Hip Flexor Stretch';
            const exerciseOptions: ExerciseOption[] = [
                { optionName: 'Couch Stretch', exerciseName: 'Couch Stretch' },
            ];
            const selectedOption = undefined;

            const displayName = getExerciseDisplayName(effectiveName, exerciseOptions, selectedOption);

            expect(displayName).toBe(effectiveName);
        });
    });
});
