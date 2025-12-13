import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

/**
 * useDensityTimer Hook Tests
 *
 * Tests the density timer hook for countdown functionality,
 * haptic feedback, audio cues, and localStorage persistence.
 * Density timers are used for exercises where you complete a target
 * number of reps within a time limit (e.g., 30 reps in 10 minutes).
 */

// Mock audio functions
vi.mock('../utils/audio', () => ({
    playTickSound: vi.fn(),
    playBeepSound: vi.fn(),
}));

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

import { useDensityTimer } from '../hooks/useDensityTimer';
import { playTickSound, playBeepSound } from '../utils/audio';

describe('useDensityTimer', () => {
    let mockHaptic;
    let localStorageMock: Record<string, string>;

    beforeEach(() => {
        vi.useFakeTimers();
        mockHaptic = createMockHaptic();
        localStorageMock = {};

        // Mock localStorage
        global.localStorage = {
            getItem: vi.fn((key) => localStorageMock[key] || null),
            setItem: vi.fn((key, value) => {
                localStorageMock[key] = value;
            }),
            removeItem: vi.fn((key) => {
                delete localStorageMock[key];
            }),
            clear: vi.fn(() => {
                localStorageMock = {};
            }),
            length: 0,
            key: vi.fn(),
        } as Storage;

        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('Initial State', () => {
        it('should start with timer inactive', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            expect(result.current.active).toBe(false);
            expect(result.current.seconds).toBe(0);
        });

        it('should initialize with default time of 10 minutes', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            expect(result.current.timeMinutes).toBe(10);
        });

        it('should load saved time preference from localStorage', () => {
            localStorageMock['density_timer_minutes'] = JSON.stringify(15);

            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            expect(result.current.timeMinutes).toBe(15);
        });
    });

    describe('Starting Timer', () => {
        it('should start timer with specified minutes', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(8);
            });

            expect(result.current.active).toBe(true);
            expect(result.current.seconds).toBe(480); // 8 * 60
            expect(result.current.timeMinutes).toBe(8);
        });

        it('should countdown every second', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1);
            });

            expect(result.current.seconds).toBe(60);

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(result.current.seconds).toBe(59);

            act(() => {
                vi.advanceTimersByTime(5000);
            });

            expect(result.current.seconds).toBe(54);
        });
    });

    describe('Timer Completion', () => {
        it('should deactivate when reaching 0', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1);
            });

            act(() => {
                vi.advanceTimersByTime(60000); // 60 seconds
            });

            expect(result.current.seconds).toBe(0);
            expect(result.current.active).toBe(false);
        });

        it('should trigger haptic feedback on completion', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1);
            });

            act(() => {
                vi.advanceTimersByTime(60000);
            });

            expect(mockHaptic.timerComplete).toHaveBeenCalled();
        });

        it('should play beep sound on completion', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1);
            });

            act(() => {
                vi.advanceTimersByTime(60000);
            });

            expect(playBeepSound).toHaveBeenCalled();
        });
    });

    describe('Stopping Timer', () => {
        it('should stop timer when stop is called', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(10);
            });

            expect(result.current.active).toBe(true);

            act(() => {
                result.current.stop();
            });

            expect(result.current.active).toBe(false);
        });

        it('should preserve seconds when stopped', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(10);
            });

            act(() => {
                vi.advanceTimersByTime(30000); // 30 seconds
            });

            const secondsBeforeStop = result.current.seconds;

            act(() => {
                result.current.stop();
            });

            expect(result.current.seconds).toBe(secondsBeforeStop);
            expect(result.current.active).toBe(false);
        });
    });

    describe('Toggle Functionality', () => {
        it('should start timer when toggled from inactive', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.toggle(10);
            });

            expect(result.current.active).toBe(true);
            expect(result.current.seconds).toBe(600); // 10 * 60
        });

        it('should stop timer when toggled from active', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.toggle(10);
            });

            expect(result.current.active).toBe(true);

            act(() => {
                result.current.toggle(10);
            });

            expect(result.current.active).toBe(false);
        });

        it('should reset timer when toggled off and on', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.toggle(10);
            });

            act(() => {
                vi.advanceTimersByTime(30000); // 30 seconds
            });

            expect(result.current.seconds).toBe(570);

            act(() => {
                result.current.toggle(10); // Stop
            });

            act(() => {
                result.current.toggle(10); // Start again
            });

            expect(result.current.seconds).toBe(600); // Reset to full time
            expect(result.current.active).toBe(true);
        });
    });

    describe('Manual State Control', () => {
        it('should allow direct seconds setting', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.setSeconds(300);
            });

            expect(result.current.seconds).toBe(300);
        });

        it('should allow direct active state setting', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.setSeconds(600);
                result.current.setActive(true);
            });

            expect(result.current.active).toBe(true);
            expect(result.current.seconds).toBe(600);
        });

        it('should allow time minutes setting', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.setTimeMinutes(15);
            });

            expect(result.current.timeMinutes).toBe(15);
        });
    });

    describe('Haptic Feedback at Key Intervals', () => {
        it('should trigger warning haptic at 60 seconds remaining', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(2); // 2 minutes
            });

            act(() => {
                vi.advanceTimersByTime(60000); // Advance to 60 seconds remaining
            });

            expect(mockHaptic.emomWarning).toHaveBeenCalled();
        });

        it('should trigger warning haptic at 30 seconds remaining', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1); // 1 minute
            });

            act(() => {
                vi.advanceTimersByTime(30000); // Advance to 30 seconds remaining
            });

            expect(mockHaptic.emomWarning).toHaveBeenCalled();
        });

        it('should trigger countdown haptic for last 10 seconds', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1);
            });

            // Advance to 10 seconds remaining
            act(() => {
                vi.advanceTimersByTime(50000);
            });

            vi.clearAllMocks();

            // Now at 10 seconds, advance through countdown
            act(() => {
                vi.advanceTimersByTime(1000); // 9 seconds
            });

            expect(mockHaptic.countdown).toHaveBeenCalled();

            vi.clearAllMocks();

            act(() => {
                vi.advanceTimersByTime(1000); // 8 seconds
            });

            expect(mockHaptic.countdown).toHaveBeenCalled();
        });
    });

    describe('Audio Cues', () => {
        it('should play tick sound for last 10 seconds', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1);
            });

            // Advance to 10 seconds
            act(() => {
                vi.advanceTimersByTime(50000);
            });

            vi.clearAllMocks();

            // Advance 1 second (to 9 seconds)
            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(playTickSound).toHaveBeenCalled();
        });

        it('should play tick sound at 1 second remaining', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1);
            });

            // Advance to 2 seconds remaining
            act(() => {
                vi.advanceTimersByTime(58000);
            });

            vi.clearAllMocks();

            // Advance to 1 second remaining
            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(playTickSound).toHaveBeenCalled();
        });

        it('should play beep sound when timer completes', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(1);
            });

            // Advance to 1 second remaining
            act(() => {
                vi.advanceTimersByTime(59000);
            });

            vi.clearAllMocks();

            // Advance final second to completion (0 seconds)
            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(playBeepSound).toHaveBeenCalled();
        });

        it('should not play tick sound before last 10 seconds', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(5);
            });

            vi.clearAllMocks();

            // Advance 30 seconds (still at 4:30)
            act(() => {
                vi.advanceTimersByTime(30000);
            });

            expect(playTickSound).not.toHaveBeenCalled();
        });
    });

    describe('LocalStorage Persistence', () => {
        it('should save time preference to localStorage', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.setTimeMinutes(12);
            });

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'density_timer_minutes',
                JSON.stringify(12)
            );
        });

        it('should persist time preference across starts', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(15);
            });

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'density_timer_minutes',
                JSON.stringify(15)
            );

            // Verify it's saved in the mock storage
            expect(localStorageMock['density_timer_minutes']).toBe(JSON.stringify(15));
        });
    });

    describe('Multiple Starts', () => {
        it('should reset timer when started again with different time', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(10);
            });

            act(() => {
                vi.advanceTimersByTime(60000); // 1 minute elapsed
            });

            expect(result.current.seconds).toBe(540); // 9 minutes left

            act(() => {
                result.current.start(5);
            });

            expect(result.current.seconds).toBe(300); // 5 minutes
            expect(result.current.timeMinutes).toBe(5);
            expect(result.current.active).toBe(true);
        });

        it('should update timeMinutes when started with new time', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(8);
            });

            expect(result.current.timeMinutes).toBe(8);

            act(() => {
                result.current.start(12);
            });

            expect(result.current.timeMinutes).toBe(12);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero time gracefully', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(0);
            });

            expect(result.current.seconds).toBe(0);
            // Timer automatically completes when seconds is 0
            expect(result.current.active).toBe(false);
            expect(mockHaptic.timerComplete).toHaveBeenCalled();
            expect(playBeepSound).toHaveBeenCalled();
        });

        it('should not countdown when not active', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.setSeconds(60);
            });

            expect(result.current.active).toBe(false);
            expect(result.current.seconds).toBe(60);

            act(() => {
                vi.advanceTimersByTime(5000);
            });

            // Should not countdown
            expect(result.current.seconds).toBe(60);
        });

        it('should handle rapid toggle calls', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.toggle(10);
                result.current.toggle(10);
                result.current.toggle(10);
            });

            expect(result.current.active).toBe(true);
            expect(result.current.seconds).toBe(600);
        });
    });

    describe('Timer Integration', () => {
        it('should maintain consistent state during countdown', () => {
            const { result } = renderHook(() => useDensityTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start(3); // 3 minutes
            });

            expect(result.current.active).toBe(true);
            expect(result.current.seconds).toBe(180);
            expect(result.current.timeMinutes).toBe(3);

            // Advance 90 seconds
            act(() => {
                vi.advanceTimersByTime(90000);
            });

            expect(result.current.active).toBe(true);
            expect(result.current.seconds).toBe(90);
            expect(result.current.timeMinutes).toBe(3);

            // Complete timer
            act(() => {
                vi.advanceTimersByTime(90000);
            });

            expect(result.current.active).toBe(false);
            expect(result.current.seconds).toBe(0);
            expect(result.current.timeMinutes).toBe(3);
        });
    });
});
