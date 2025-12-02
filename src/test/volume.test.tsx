import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    calculateExerciseVolume,
    calculateWorkoutVolume,
    calculateVolumeStats,
    formatVolume
} from '../utils/volume';

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: vi.fn((key) => localStorageMock.store[key] || null),
    setItem: vi.fn((key, value) => { localStorageMock.store[key] = value; }),
    removeItem: vi.fn((key) => { delete localStorageMock.store[key]; }),
    clear: vi.fn(() => { localStorageMock.store = {}; })
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Volume Tracking', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('calculateExerciseVolume', () => {
        it('calculates volume correctly for standard prescription', () => {
            const exercise = {
                completedSets: 3,
                prescription: '3 x 10 reps',
                weight: 50
            };
            expect(calculateExerciseVolume(exercise)).toBe(1500); // 3 * 10 * 50
        });

        it('handles string weight values', () => {
            const exercise = {
                completedSets: 4,
                prescription: '4 x 8 reps',
                weight: '60'
            };
            expect(calculateExerciseVolume(exercise)).toBe(1920); // 4 * 8 * 60
        });

        it('returns 0 for bodyweight exercises without weight', () => {
            const exercise = {
                completedSets: 3,
                prescription: '3 x 10 reps',
                weight: 0
            };
            expect(calculateExerciseVolume(exercise)).toBe(0);
        });

        it('handles missing prescription', () => {
            const exercise = {
                completedSets: 3,
                weight: 50
            };
            expect(calculateExerciseVolume(exercise)).toBe(0);
        });

        it('handles partial sets completed', () => {
            const exercise = {
                completedSets: 2,
                prescription: '3 x 10 reps',
                weight: 50
            };
            expect(calculateExerciseVolume(exercise)).toBe(1000); // 2 * 10 * 50
        });
    });

    describe('calculateWorkoutVolume', () => {
        it('calculates total volume for multiple exercises', () => {
            const exercises = [
                { name: 'Bench Press', completedSets: 3, prescription: '3 x 10 reps', weight: 80 },
                { name: 'Rows', completedSets: 3, prescription: '3 x 10 reps', weight: 60 },
                { name: 'Pull-Ups', completedSets: 3, prescription: '3 x 10 reps', weight: 0 } // Bodyweight
            ];
            
            const result = calculateWorkoutVolume(exercises);
            
            expect(result.totalVolume).toBe(4200); // (3*10*80) + (3*10*60) + 0
            expect(result.exerciseCount).toBe(2); // Only weighted exercises counted
            expect(result.breakdown.length).toBe(2);
        });

        it('sorts breakdown by volume descending', () => {
            const exercises = [
                { name: 'Light', completedSets: 3, prescription: '3 x 10 reps', weight: 20 },
                { name: 'Heavy', completedSets: 3, prescription: '3 x 10 reps', weight: 100 }
            ];
            
            const result = calculateWorkoutVolume(exercises);
            
            expect(result.breakdown[0].name).toBe('Heavy');
            expect(result.breakdown[1].name).toBe('Light');
        });

        it('handles empty exercise array', () => {
            const result = calculateWorkoutVolume([]);
            
            expect(result.totalVolume).toBe(0);
            expect(result.exerciseCount).toBe(0);
            expect(result.breakdown).toEqual([]);
        });

        it('handles non-array input', () => {
            const result = calculateWorkoutVolume(null);
            
            expect(result.totalVolume).toBe(0);
            expect(result.exerciseCount).toBe(0);
        });

        it('calculates average per exercise', () => {
            const exercises = [
                { name: 'Ex1', completedSets: 3, prescription: '3 x 10 reps', weight: 50 },
                { name: 'Ex2', completedSets: 3, prescription: '3 x 10 reps', weight: 50 }
            ];
            
            const result = calculateWorkoutVolume(exercises);
            
            expect(result.averagePerExercise).toBe(1500); // 3000 / 2
        });
    });

    describe('formatVolume', () => {
        it('formats small volumes with comma separator', () => {
            expect(formatVolume(1500)).toBe('1,500 kg');
        });

        it('formats large volumes in thousands', () => {
            expect(formatVolume(15000)).toBe('15.0k kg');
            expect(formatVolume(12345)).toBe('12.3k kg');
        });

        it('handles zero', () => {
            expect(formatVolume(0)).toBe('0 kg');
        });
    });

    describe('calculateVolumeStats', () => {
        it('returns empty stats for no history', () => {
            const stats = calculateVolumeStats(4);
            
            expect(stats.totalVolume).toBe(0);
            expect(stats.workoutCount).toBe(0);
            expect(stats.trend).toBe('neutral');
        });
    });
});
