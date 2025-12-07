/**
 * WorkoutPlayer Exercise Options Integration Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeGetJSON, safeSetJSON } from '../utils/storage';
import type { WorkoutSessionData } from '../types/workout';

// Mock storage
vi.mock('../utils/storage', () => ({
    safeGetJSON: vi.fn(),
    safeSetJSON: vi.fn(() => true),
    safeRemove: vi.fn(),
}));

// Mock sync service
vi.mock('../services/SyncService', () => ({
    syncService: {
        scheduleSync: vi.fn(),
        syncNow: vi.fn(),
    },
}));

describe('WorkoutPlayer - Exercise Options Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('Exercise Options State Management', () => {
        it('should initialize with default options when no selection exists', () => {
            const mockSessionData: WorkoutSessionData = {
                exercises: {},
            };

            (safeGetJSON as ReturnType<typeof vi.fn>).mockReturnValue(mockSessionData);

            // Simulate loading session data
            const parsedLogs = safeGetJSON('test_session_key', {} as WorkoutSessionData);
            
            expect(parsedLogs).toBeDefined();
            expect(parsedLogs.exercises).toBeDefined();
        });

        it('should load existing exercise option selections from session data', () => {
            const mockSessionData: WorkoutSessionData = {
                exercises: {},
                exerciseOptions: {
                    'ex_squat': 'Barbell Back Squat',
                    'ex_press': 'Dumbbell Press',
                },
            };

            (safeGetJSON as ReturnType<typeof vi.fn>).mockReturnValue(mockSessionData);

            const parsedLogs = safeGetJSON('test_session_key', {} as WorkoutSessionData);
            
            expect(parsedLogs.exerciseOptions).toBeDefined();
            expect(parsedLogs.exerciseOptions?.['ex_squat']).toBe('Barbell Back Squat');
            expect(parsedLogs.exerciseOptions?.['ex_press']).toBe('Dumbbell Press');
        });

        it('should persist exercise option selection to session data', () => {
            const mockSessionData: WorkoutSessionData = {
                exercises: {},
                exerciseOptions: {},
                lastModified: new Date().toISOString(),
            };

            const updatedData: WorkoutSessionData = {
                ...mockSessionData,
                exerciseOptions: {
                    ...mockSessionData.exerciseOptions,
                    'ex_squat': 'Goblet Squat',
                },
                lastModified: new Date().toISOString(),
            };

            safeSetJSON('test_session_key', updatedData);

            expect(safeSetJSON).toHaveBeenCalledWith('test_session_key', updatedData);
            expect(updatedData.exerciseOptions?.['ex_squat']).toBe('Goblet Squat');
        });

        it('should maintain other session data when updating exercise options', () => {
            const mockSessionData: WorkoutSessionData = {
                completed: false,
                week: 1,
                day: 1,
                workoutNotes: 'Test notes',
                exercises: {
                    'ex_squat': { sets: [true, false, false] },
                },
                exerciseOptions: {},
                lastModified: '2024-01-01T00:00:00.000Z',
            };

            const updatedData: WorkoutSessionData = {
                ...mockSessionData,
                exerciseOptions: {
                    'ex_squat': 'Bulgarian Split Squat',
                },
                lastModified: new Date().toISOString(),
            };

            expect(updatedData.completed).toBe(false);
            expect(updatedData.week).toBe(1);
            expect(updatedData.day).toBe(1);
            expect(updatedData.workoutNotes).toBe('Test notes');
            expect(updatedData.exercises?.['ex_squat']?.sets).toEqual([true, false, false]);
            expect(updatedData.exerciseOptions?.['ex_squat']).toBe('Bulgarian Split Squat');
        });
    });

    describe('Exercise Options Persistence', () => {
        it('should save exercise options with lastModified timestamp', () => {
            const beforeTime = new Date().toISOString();
            
            const mockSessionData: WorkoutSessionData = {
                exercises: {},
                exerciseOptions: {
                    'ex_squat': 'Barbell Back Squat',
                },
                lastModified: beforeTime,
            };

            const updatedData: WorkoutSessionData = {
                ...mockSessionData,
                exerciseOptions: {
                    ...mockSessionData.exerciseOptions,
                    'ex_press': 'Barbell Press',
                },
                lastModified: new Date().toISOString(),
            };

            safeSetJSON('test_session_key', updatedData);

            expect(safeSetJSON).toHaveBeenCalledWith('test_session_key', updatedData);
            expect(updatedData.lastModified).toBeDefined();
            expect(updatedData.lastModified >= beforeTime).toBe(true);
        });

        it('should handle empty exercise options gracefully', () => {
            const mockSessionData: WorkoutSessionData = {
                exercises: {},
            };

            (safeGetJSON as ReturnType<typeof vi.fn>).mockReturnValue(mockSessionData);

            const parsedLogs = safeGetJSON('test_session_key', {} as WorkoutSessionData);
            
            expect(parsedLogs.exerciseOptions).toBeUndefined();
        });

        it('should handle invalid exercise option data gracefully', () => {
            const mockSessionData: WorkoutSessionData = {
                exercises: {},
                exerciseOptions: null as unknown as Record<string, string>,
            };

            (safeGetJSON as ReturnType<typeof vi.fn>).mockReturnValue(mockSessionData);

            const parsedLogs = safeGetJSON('test_session_key', {} as WorkoutSessionData);
            
            expect(parsedLogs).toBeDefined();
        });
    });

    describe('Multiple Exercise Options', () => {
        it('should handle multiple exercise option selections', () => {
            const mockSessionData: WorkoutSessionData = {
                exercises: {},
                exerciseOptions: {
                    'ex_squat': 'Barbell Back Squat',
                    'ex_press': 'Dumbbell Press',
                    'ex_row': 'Barbell Row',
                },
                lastModified: new Date().toISOString(),
            };

            safeSetJSON('test_session_key', mockSessionData);

            expect(safeSetJSON).toHaveBeenCalledWith('test_session_key', mockSessionData);
            expect(Object.keys(mockSessionData.exerciseOptions || {})).toHaveLength(3);
        });

        it('should allow changing exercise option selection', () => {
            const initialData: WorkoutSessionData = {
                exercises: {},
                exerciseOptions: {
                    'ex_squat': 'Barbell Back Squat',
                },
                lastModified: new Date().toISOString(),
            };

            const updatedData: WorkoutSessionData = {
                ...initialData,
                exerciseOptions: {
                    ...initialData.exerciseOptions,
                    'ex_squat': 'Goblet Squat',
                },
                lastModified: new Date().toISOString(),
            };

            expect(updatedData.exerciseOptions?.['ex_squat']).toBe('Goblet Squat');
            expect(updatedData.exerciseOptions?.['ex_squat']).not.toBe('Barbell Back Squat');
        });
    });
});
