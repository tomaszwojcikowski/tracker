import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

/**
 * useRestTimer Hook Tests
 *
 * Tests the rest timer hook for countdown functionality,
 * haptic feedback, and toast notifications.
 */

// Mock the haptic interface with all required methods
const createMockHaptic = () => ({
    tick: vi.fn(),
    bump: vi.fn(),
    success: vi.fn(),
    timer: vi.fn(),
    complete: vi.fn(),
    milestone: vi.fn(),
    countdown: vi.fn(),
    error: vi.fn(),
    swipe: vi.fn(),
    timer30: vi.fn(),
    timer10: vi.fn(),
    timerComplete: vi.fn(),
    emomWarning: vi.fn(),
});

import { useRestTimer } from '../hooks/useRestTimer';

describe('useRestTimer', () => {
    let mockHaptic;

    beforeEach(() => {
        vi.useFakeTimers();
        mockHaptic = createMockHaptic();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('Initial State', () => {
        it('should start with timer inactive', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            expect(result.current.active).toBe(false);
            expect(result.current.seconds).toBe(0);
            expect(result.current.showToast).toBe(false);
        });
    });

    describe('Starting Timer', () => {
        it('should start timer with specified seconds', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(90);
            });

            expect(result.current.active).toBe(true);
            expect(result.current.seconds).toBe(90);
        });

        it('should countdown every second', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(5);
            });

            expect(result.current.seconds).toBe(5);

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(result.current.seconds).toBe(4);

            act(() => {
                vi.advanceTimersByTime(2000);
            });

            expect(result.current.seconds).toBe(2);
        });
    });

    describe('Timer Completion', () => {
        it('should deactivate when reaching 0', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(2);
            });

            act(() => {
                vi.advanceTimersByTime(2000);
            });

            expect(result.current.seconds).toBe(0);
            expect(result.current.active).toBe(false);
        });

        it('should trigger haptic feedback on completion', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1);
            });

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(mockHaptic.timerComplete).toHaveBeenCalled();
        });

        it('should show toast on completion', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1);
            });

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(result.current.showToast).toBe(true);
        });
    });

    describe('Stopping Timer', () => {
        it('should stop timer when stop is called', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(60);
            });

            expect(result.current.active).toBe(true);

            act(() => {
                result.current.stop();
            });

            expect(result.current.active).toBe(false);
        });

        it('should reset seconds to 0 when stopped', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(60);
            });

            act(() => {
                vi.advanceTimersByTime(5000);
            });

            act(() => {
                result.current.stop();
            });

            expect(result.current.seconds).toBe(0);
            expect(result.current.active).toBe(false);
        });
    });

    describe('Toast Dismissal', () => {
        it('should dismiss toast when dismissToast is called', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1);
            });

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(result.current.showToast).toBe(true);

            act(() => {
                result.current.dismissToast();
            });

            expect(result.current.showToast).toBe(false);
        });
    });

    describe('Manual State Control', () => {
        it('should allow direct seconds setting', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.setSeconds(45);
            });

            expect(result.current.seconds).toBe(45);
        });

        it('should allow direct active state setting with seconds', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            // Set seconds first, then active - otherwise completion triggers immediately
            act(() => {
                result.current.setSeconds(30);
                result.current.setActive(true);
            });

            expect(result.current.active).toBe(true);
            expect(result.current.seconds).toBe(30);
        });
    });

    describe('Multiple Starts', () => {
        it('should reset timer when started again', () => {
            const { result } = renderHook(() => useRestTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(60);
            });

            act(() => {
                vi.advanceTimersByTime(10000);
            });

            expect(result.current.seconds).toBe(50);

            act(() => {
                result.current.start(30);
            });

            expect(result.current.seconds).toBe(30);
            expect(result.current.active).toBe(true);
        });
    });
});
