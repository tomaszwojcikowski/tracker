import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

/**
 * useExerciseCollapse Hook Tests
 *
 * Tests the exercise collapse state management hook.
 */

import { useExerciseCollapse } from '../hooks/useExerciseCollapse';

describe('useExerciseCollapse', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Initial State', () => {
        it('should start with empty manual overrides', () => {
            const { result } = renderHook(() =>
                useExerciseCollapse({ firstIncompleteExerciseId: 'exercise_1' })
            );

            expect(result.current.manualOverrides).toEqual({});
        });
    });

    describe('Auto Collapse Behavior', () => {
        it('should expand first incomplete exercise by default', () => {
            const { result } = renderHook(() =>
                useExerciseCollapse({ firstIncompleteExerciseId: 'exercise_1' })
            );

            expect(result.current.isCollapsed('exercise_1')).toBe(false);
        });

        it('should collapse other exercises by default', () => {
            const { result } = renderHook(() =>
                useExerciseCollapse({ firstIncompleteExerciseId: 'exercise_1' })
            );

            expect(result.current.isCollapsed('exercise_2')).toBe(true);
            expect(result.current.isCollapsed('exercise_3')).toBe(true);
        });

        it('should collapse all when no first incomplete exercise', () => {
            const { result } = renderHook(() =>
                useExerciseCollapse({ firstIncompleteExerciseId: null })
            );

            expect(result.current.isCollapsed('exercise_1')).toBe(true);
            expect(result.current.isCollapsed('exercise_2')).toBe(true);
        });

        it('should update expansion when first incomplete changes', () => {
            const { result, rerender } = renderHook(
                ({ firstIncompleteExerciseId }) =>
                    useExerciseCollapse({ firstIncompleteExerciseId }),
                { initialProps: { firstIncompleteExerciseId: 'exercise_1' } }
            );

            expect(result.current.isCollapsed('exercise_1')).toBe(false);
            expect(result.current.isCollapsed('exercise_2')).toBe(true);

            rerender({ firstIncompleteExerciseId: 'exercise_2' });

            expect(result.current.isCollapsed('exercise_1')).toBe(true);
            expect(result.current.isCollapsed('exercise_2')).toBe(false);
        });
    });

    describe('Manual Toggle', () => {
        it('should expand collapsed exercise when toggled', () => {
            const { result } = renderHook(() =>
                useExerciseCollapse({ firstIncompleteExerciseId: 'exercise_1' })
            );

            // exercise_2 is collapsed by default
            expect(result.current.isCollapsed('exercise_2')).toBe(true);

            act(() => {
                result.current.toggle('exercise_2');
            });

            expect(result.current.isCollapsed('exercise_2')).toBe(false);
        });

        it('should collapse expanded exercise when toggled', () => {
            const { result } = renderHook(() =>
                useExerciseCollapse({ firstIncompleteExerciseId: 'exercise_1' })
            );

            // exercise_1 is expanded by default
            expect(result.current.isCollapsed('exercise_1')).toBe(false);

            act(() => {
                result.current.toggle('exercise_1');
            });

            expect(result.current.isCollapsed('exercise_1')).toBe(false); // First toggle sets override to true (expanded)

            act(() => {
                result.current.toggle('exercise_1');
            });

            expect(result.current.isCollapsed('exercise_1')).toBe(true); // Second toggle sets override to false (collapsed)
        });

        it('should track manual overrides', () => {
            const { result } = renderHook(() =>
                useExerciseCollapse({ firstIncompleteExerciseId: 'exercise_1' })
            );

            act(() => {
                result.current.toggle('exercise_2');
            });

            expect(result.current.manualOverrides).toHaveProperty('exercise_2');
        });

        it('should preserve override when first incomplete changes', () => {
            const { result, rerender } = renderHook(
                ({ firstIncompleteExerciseId }) =>
                    useExerciseCollapse({ firstIncompleteExerciseId }),
                { initialProps: { firstIncompleteExerciseId: 'exercise_1' } }
            );

            // Manually expand exercise_3
            act(() => {
                result.current.toggle('exercise_3');
            });

            expect(result.current.isCollapsed('exercise_3')).toBe(false);

            // Change first incomplete
            rerender({ firstIncompleteExerciseId: 'exercise_2' });

            // exercise_3 should still be expanded due to manual override
            expect(result.current.isCollapsed('exercise_3')).toBe(false);
        });
    });

    describe('Multiple Exercises', () => {
        it('should handle multiple manual overrides independently', () => {
            const { result } = renderHook(() =>
                useExerciseCollapse({ firstIncompleteExerciseId: 'exercise_1' })
            );

            act(() => {
                result.current.toggle('exercise_2'); // Expand exercise_2
                result.current.toggle('exercise_3'); // Expand exercise_3
            });

            expect(result.current.isCollapsed('exercise_1')).toBe(false); // Auto expanded
            expect(result.current.isCollapsed('exercise_2')).toBe(false); // Manually expanded
            expect(result.current.isCollapsed('exercise_3')).toBe(false); // Manually expanded
            expect(result.current.isCollapsed('exercise_4')).toBe(true);  // Default collapsed
        });

        it('should toggle exercises independently', () => {
            const { result } = renderHook(() =>
                useExerciseCollapse({ firstIncompleteExerciseId: 'exercise_1' })
            );

            // Expand exercise_2
            act(() => {
                result.current.toggle('exercise_2');
            });

            expect(result.current.isCollapsed('exercise_2')).toBe(false);

            // Toggle exercise_2 again to collapse
            act(() => {
                result.current.toggle('exercise_2');
            });

            expect(result.current.isCollapsed('exercise_2')).toBe(true);

            // Other exercises should be unaffected
            expect(result.current.isCollapsed('exercise_1')).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty exercise ID', () => {
            const { result } = renderHook(() =>
                useExerciseCollapse({ firstIncompleteExerciseId: '' })
            );

            expect(result.current.isCollapsed('')).toBe(false); // Empty matches empty
            expect(result.current.isCollapsed('exercise_1')).toBe(true);
        });

        it('should handle rapid toggles', () => {
            const { result } = renderHook(() =>
                useExerciseCollapse({ firstIncompleteExerciseId: 'exercise_1' })
            );

            // Rapid toggles should settle correctly
            act(() => {
                result.current.toggle('exercise_2');
                result.current.toggle('exercise_2');
                result.current.toggle('exercise_2');
            });

            // After 3 toggles: undefined -> true -> false -> true
            // isCollapsed returns !override, so true -> false -> true -> false
            expect(result.current.manualOverrides['exercise_2']).toBe(true);
            expect(result.current.isCollapsed('exercise_2')).toBe(false);
        });
    });
});
