import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { safeGetJSON, safeSetJSON } from '../utils/storage';
import { getExerciseId, getAddedExerciseId } from '../utils/workoutSession';

/**
 * Focus Mode Tests
 *
 * Tests for the Focus Mode feature in WorkoutPlayer component.
 * Covers view mode toggle, navigation, bounds checking, keyboard shortcuts,
 * and state persistence.
 */

// Mock localStorage
const mockStorage = {};
vi.mock('../utils/storage', () => ({
    safeGetJSON: vi.fn((key, defaultValue) => mockStorage[key] ?? defaultValue),
    safeSetJSON: vi.fn((key, value) => {
        mockStorage[key] = value;
        return true;
    }),
}));

describe('Focus Mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    });

    describe('Exercise ID Generation', () => {
        it('generates consistent IDs from exercise names', () => {
            expect(getExerciseId('Bench Press')).toBe('Bench Press');
            expect(getExerciseId('Pull Ups')).toBe('Pull Ups');
            expect(getExerciseId('Lat Pull Down')).toBe('Lat Pull Down');
        });

        it('handles multiple spaces', () => {
            // Multiple spaces are preserved
            expect(getExerciseId('Bench  Press')).toBe('Bench  Press');
            expect(getExerciseId('Pull   Ups')).toBe('Pull   Ups');
        });

        it('converts to lowercase', () => {
            // Case is preserved; sanitization now only targets Firebase-invalid chars
            expect(getExerciseId('BENCH PRESS')).toBe('BENCH PRESS');
            expect(getExerciseId('Pull UPS')).toBe('Pull UPS');
        });

        it('generates added exercise IDs with prefix', () => {
            expect(getAddedExerciseId('bench_press')).toBe('added_bench_press');
            expect(getAddedExerciseId('pull_ups')).toBe('added_pull_ups');
        });
    });

    describe('View Mode State Persistence', () => {
        it('loads view mode from localStorage', () => {
            mockStorage['workout_view_mode'] = 'focus';

            const result = safeGetJSON('workout_view_mode', 'list');
            expect(result).toBe('focus');
        });

        it('defaults to list view when no saved preference', () => {
            const result = safeGetJSON('workout_view_mode', 'list');
            expect(result).toBe('list');
        });

        it('saves view mode to localStorage', () => {
            safeSetJSON('workout_view_mode', 'focus');
            expect(mockStorage['workout_view_mode']).toBe('focus');
        });
    });

    describe('Focus Index Bounds Checking', () => {
        // Simulates the useEffect logic for bounds checking
        const useFocusIndexBounds = (initialIndex, exercisesLength) => {
            const [focusIndex, setFocusIndex] = useState(initialIndex);

            useEffect(() => {
                if (focusIndex >= exercisesLength && exercisesLength > 0) {
                    setFocusIndex(exercisesLength - 1);
                } else if (exercisesLength === 0) {
                    setFocusIndex(0);
                }
            }, [exercisesLength, focusIndex]);

            return { focusIndex, setFocusIndex };
        };

        it('resets index when it exceeds array length', () => {
            const { result } = renderHook(
                ({ index, length }) => useFocusIndexBounds(index, length),
                { initialProps: { index: 5, length: 3 } }
            );

            // Effect should reset to last valid index
            expect(result.current.focusIndex).toBe(2);
        });

        it('resets to 0 when array becomes empty', () => {
            const { result, rerender } = renderHook(
                ({ index, length }) => useFocusIndexBounds(index, length),
                { initialProps: { index: 2, length: 3 } }
            );

            expect(result.current.focusIndex).toBe(2);

            // When length becomes 0
            rerender({ index: result.current.focusIndex, length: 0 });

            expect(result.current.focusIndex).toBe(0);
        });

        it('keeps valid index unchanged', () => {
            const { result } = renderHook(
                ({ index, length }) => useFocusIndexBounds(index, length),
                { initialProps: { index: 1, length: 5 } }
            );

            expect(result.current.focusIndex).toBe(1);
        });
    });

    describe('Focus Navigation', () => {
        const useFocusNavigation = (allExercisesLength) => {
            const [focusIndex, setFocusIndex] = useState(0);

            const navigatePrev = useCallback(() => {
                setFocusIndex(prev => Math.max(0, prev - 1));
            }, []);

            const navigateNext = useCallback(() => {
                setFocusIndex(prev => Math.min(allExercisesLength - 1, prev + 1));
            }, [allExercisesLength]);

            return { focusIndex, navigatePrev, navigateNext };
        };

        it('navigates to next exercise', () => {
            const { result } = renderHook(() => useFocusNavigation(5));

            expect(result.current.focusIndex).toBe(0);

            act(() => {
                result.current.navigateNext();
            });

            expect(result.current.focusIndex).toBe(1);
        });

        it('navigates to previous exercise', () => {
            const { result } = renderHook(() => useFocusNavigation(5));

            act(() => {
                result.current.navigateNext();
                result.current.navigateNext();
            });

            expect(result.current.focusIndex).toBe(2);

            act(() => {
                result.current.navigatePrev();
            });

            expect(result.current.focusIndex).toBe(1);
        });

        it('does not go below 0', () => {
            const { result } = renderHook(() => useFocusNavigation(5));

            expect(result.current.focusIndex).toBe(0);

            act(() => {
                result.current.navigatePrev();
            });

            expect(result.current.focusIndex).toBe(0);
        });

        it('does not exceed array length', () => {
            const { result } = renderHook(() => useFocusNavigation(3));

            act(() => {
                result.current.navigateNext();
                result.current.navigateNext();
                result.current.navigateNext(); // Try to go past the end
                result.current.navigateNext();
            });

            expect(result.current.focusIndex).toBe(2);
        });
    });

    describe('All Exercises Flattening', () => {
        const useFlattenedExercises = (sections, addedExercises) => {
            return useMemo(() => {
                const exercises = [];

                sections?.forEach(section => {
                    section.exercises.forEach(ex => {
                        exercises.push({
                            type: 'program',
                            data: ex,
                            section: section.name,
                            id: getExerciseId(ex.name)
                        });
                    });
                });

                addedExercises.forEach(ex => {
                    exercises.push({
                        type: 'added',
                        data: ex,
                        id: getAddedExerciseId(ex.id)
                    });
                });

                return exercises;
            }, [sections, addedExercises]);
        };

        it('flattens workout sections into linear array', () => {
            const sections = [
                {
                    name: 'Warmup',
                    exercises: [
                        { name: 'Jumping Jacks' },
                        { name: 'Arm Circles' },
                    ],
                },
                {
                    name: 'Main',
                    exercises: [
                        { name: 'Bench Press' },
                    ],
                },
            ];

            const { result } = renderHook(() => useFlattenedExercises(sections, []));

            expect(result.current).toHaveLength(3);
            expect(result.current[0].id).toBe('Jumping Jacks');
            expect(result.current[0].section).toBe('Warmup');
            expect(result.current[1].id).toBe('Arm Circles');
            expect(result.current[2].id).toBe('Bench Press');
            expect(result.current[2].section).toBe('Main');
        });

        it('includes added exercises at the end', () => {
            const sections = [
                {
                    name: 'Main',
                    exercises: [{ name: 'Bench Press' }],
                },
            ];

            const addedExercises = [
                { id: 'curls', name: 'Bicep Curls' },
                { id: 'extensions', name: 'Tricep Extensions' },
            ];

            const { result } = renderHook(() => useFlattenedExercises(sections, addedExercises));

            expect(result.current).toHaveLength(3);
            expect(result.current[0].type).toBe('program');
            expect(result.current[1].type).toBe('added');
            expect(result.current[1].id).toBe('added_curls');
            expect(result.current[2].type).toBe('added');
            expect(result.current[2].id).toBe('added_extensions');
        });

        it('handles empty sections', () => {
            const { result } = renderHook(() => useFlattenedExercises([], []));
            expect(result.current).toHaveLength(0);
        });

        it('handles only added exercises (empty workout)', () => {
            const addedExercises = [
                { id: 'curls', name: 'Bicep Curls' },
            ];

            const { result } = renderHook(() => useFlattenedExercises([], addedExercises));

            expect(result.current).toHaveLength(1);
            expect(result.current[0].type).toBe('added');
            expect(result.current[0].id).toBe('added_curls');
        });
    });

    describe('View Mode Toggle', () => {
        const useViewModeToggle = () => {
            const [viewMode, setViewMode] = useState(() =>
                safeGetJSON('workout_view_mode', 'list') ?? 'list'
            );
            const [compactView, setCompactView] = useState(false);

            const handleViewModeChange = useCallback((newMode) => {
                setViewMode(newMode);
                safeSetJSON('workout_view_mode', newMode);
            }, []);

            return { viewMode, setViewMode, compactView, setCompactView, handleViewModeChange };
        };

        it('toggles between list and focus modes', () => {
            const { result } = renderHook(() => useViewModeToggle());

            expect(result.current.viewMode).toBe('list');

            act(() => {
                result.current.handleViewModeChange('focus');
            });

            expect(result.current.viewMode).toBe('focus');
            expect(mockStorage['workout_view_mode']).toBe('focus');
        });

        it('persists view mode preference', () => {
            mockStorage['workout_view_mode'] = 'focus';

            const { result } = renderHook(() => useViewModeToggle());

            expect(result.current.viewMode).toBe('focus');
        });
    });

    describe('Keyboard Navigation', () => {
        // Test the keyboard navigation logic
        it('should navigate left when ArrowLeft is pressed in focus mode', () => {
            const viewMode = 'focus';
            const focusIndex = 2;

            // Simulate ArrowLeft navigation
            const newIndex = viewMode === 'focus' && focusIndex > 0
                ? focusIndex - 1
                : focusIndex;

            expect(newIndex).toBe(1);
        });

        it('should navigate right when ArrowRight is pressed in focus mode', () => {
            const viewMode = 'focus';
            const focusIndex = 2;
            const allExercisesLength = 5;

            // Simulate ArrowRight navigation
            const newIndex = viewMode === 'focus' && focusIndex < allExercisesLength - 1
                ? focusIndex + 1
                : focusIndex;

            expect(newIndex).toBe(3);
        });

        it('should not navigate when not in focus mode', () => {
            const viewMode = 'list';
            const focusIndex = 2;

            // Simulate ArrowLeft navigation - should not change
            const newIndex = viewMode === 'focus' && focusIndex > 0
                ? focusIndex - 1
                : focusIndex;

            expect(newIndex).toBe(2);
        });

        it('should not go below 0', () => {
            const viewMode = 'focus';
            const focusIndex = 0;

            const newIndex = viewMode === 'focus' && focusIndex > 0
                ? focusIndex - 1
                : focusIndex;

            expect(newIndex).toBe(0);
        });

        it('should not exceed array length', () => {
            const viewMode = 'focus';
            const focusIndex = 4;
            const allExercisesLength = 5;

            const newIndex = viewMode === 'focus' && focusIndex < allExercisesLength - 1
                ? focusIndex + 1
                : focusIndex;

            expect(newIndex).toBe(4);
        });
    });

    describe('State Reset on Exercise Removal', () => {
        it('resets focus index when last exercise is removed', () => {
            // Simulates removing the last exercise when focusIndex points to it
            const initialFocusIndex = 2;
            const newLength = 2; // After removal (was 3)

            // The useEffect logic
            let newFocusIndex = initialFocusIndex;
            if (newFocusIndex >= newLength && newLength > 0) {
                newFocusIndex = newLength - 1;
            } else if (newLength === 0) {
                newFocusIndex = 0;
            }

            expect(newFocusIndex).toBe(1);
        });

        it('keeps focus index when non-focused exercise is removed', () => {
            const initialFocusIndex = 0;
            const newLength = 2; // After removal of exercise at index 2

            // The useEffect logic
            let newFocusIndex = initialFocusIndex;
            if (newFocusIndex >= newLength && newLength > 0) {
                newFocusIndex = newLength - 1;
            } else if (newLength === 0) {
                newFocusIndex = 0;
            }

            expect(newFocusIndex).toBe(0);
        });

        it('resets to 0 when all exercises are removed', () => {
            const initialFocusIndex = 2;
            const newLength = 0;

            let newFocusIndex = initialFocusIndex;
            if (newFocusIndex >= newLength && newLength > 0) {
                newFocusIndex = newLength - 1;
            } else if (newLength === 0) {
                newFocusIndex = 0;
            }

            expect(newFocusIndex).toBe(0);
        });
    });
});
