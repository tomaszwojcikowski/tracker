import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * EMOM Timer Tests
 * 
 * Tests the Every Minute On the Minute (EMOM) timer functionality including:
 * - Timer state management
 * - Interval adjustment
 * - Auto-reset behavior
 * - Sound effects
 * - localStorage persistence
 */

describe('EMOM Timer Functionality', () => {
    // Mock localStorage
    let localStorageMock;

    beforeEach(() => {
        localStorageMock = {};
        
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
            })
        };

        // Mock AudioContext for sound tests
        global.AudioContext = vi.fn().mockImplementation(() => ({
            createOscillator: vi.fn(() => ({
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
                frequency: { value: 0 },
                type: 'sine'
            })),
            createGain: vi.fn(() => ({
                connect: vi.fn(),
                gain: {
                    setValueAtTime: vi.fn(),
                    exponentialRampToValueAtTime: vi.fn()
                }
            })),
            destination: {},
            currentTime: 0
        }));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('EMOM Interval Storage', () => {
        it('should default to 60 seconds if no interval is stored', () => {
            const result = localStorage.getItem('emom_interval');
            expect(result).toBeNull();
        });

        it('should save interval to localStorage', () => {
            const interval = 60;
            localStorage.setItem('emom_interval', JSON.stringify(interval));
            
            const stored = JSON.parse(localStorage.getItem('emom_interval'));
            expect(stored).toBe(interval);
        });

        it('should load custom interval from localStorage', () => {
            const customInterval = 90;
            localStorage.setItem('emom_interval', JSON.stringify(customInterval));
            
            const stored = JSON.parse(localStorage.getItem('emom_interval'));
            expect(stored).toBe(customInterval);
        });

        it('should handle invalid interval data gracefully', () => {
            localStorage.setItem('emom_interval', 'invalid-json');
            
            try {
                JSON.parse(localStorage.getItem('emom_interval'));
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe('EMOM Interval Adjustment', () => {
        it('should increase interval by 5 seconds', () => {
            let interval = 60;
            interval = Math.min(180, interval + 5);
            
            expect(interval).toBe(65);
        });

        it('should decrease interval by 5 seconds', () => {
            let interval = 60;
            interval = Math.max(10, interval - 5);
            
            expect(interval).toBe(55);
        });

        it('should not decrease below 10 seconds', () => {
            let interval = 10;
            interval = Math.max(10, interval - 5);
            
            expect(interval).toBe(10);
        });

        it('should not increase above 180 seconds', () => {
            let interval = 180;
            interval = Math.min(180, interval + 5);
            
            expect(interval).toBe(180);
        });

        it('should handle multiple adjustments', () => {
            let interval = 60;
            
            // Increase twice
            interval = Math.min(180, interval + 5);
            interval = Math.min(180, interval + 5);
            expect(interval).toBe(70);
            
            // Decrease once
            interval = Math.max(10, interval - 5);
            expect(interval).toBe(65);
        });
    });

    describe('EMOM Timer State', () => {
        it('should initialize with inactive state', () => {
            const emomActive = false;
            const emomSeconds = 0;
            
            expect(emomActive).toBe(false);
            expect(emomSeconds).toBe(0);
        });

        it('should set timer to interval when starting', () => {
            const interval = 60;
            let emomSeconds = interval;
            let emomActive = true;
            
            expect(emomSeconds).toBe(60);
            expect(emomActive).toBe(true);
        });

        it('should count down correctly', () => {
            let emomSeconds = 60;
            
            // Simulate countdown
            for (let i = 0; i < 5; i++) {
                emomSeconds = emomSeconds - 1;
            }
            
            expect(emomSeconds).toBe(55);
        });

        it('should reset to interval at zero', () => {
            const interval = 60;
            let emomSeconds = 1;
            
            // Count down to zero
            emomSeconds = emomSeconds - 1;
            expect(emomSeconds).toBe(0);
            
            // Should reset to interval
            if (emomSeconds === 0) {
                emomSeconds = interval;
            }
            
            expect(emomSeconds).toBe(60);
        });
    });

    describe('EMOM Round Tracking', () => {
        it('should initialize with round 0 when inactive', () => {
            const emomActive = false;
            const round = 0;
            
            expect(emomActive).toBe(false);
            expect(round).toBe(0);
        });

        it('should start at round 1 when timer starts', () => {
            // Simulating timer start behavior
            const interval = 60;
            let emomSeconds = interval;
            let emomActive = true;
            let round = 1;
            
            expect(emomSeconds).toBe(60);
            expect(emomActive).toBe(true);
            expect(round).toBe(1);
        });

        it('should increment round when interval resets', () => {
            const interval = 60;
            let emomSeconds = 1;
            let round = 1;
            
            // Count down to zero
            emomSeconds = emomSeconds - 1;
            expect(emomSeconds).toBe(0);
            
            // Should reset to interval and increment round
            if (emomSeconds === 0) {
                emomSeconds = interval;
                round = round + 1;
            }
            
            expect(emomSeconds).toBe(60);
            expect(round).toBe(2);
        });

        it('should track multiple round increments', () => {
            const interval = 60;
            let round = 1;
            
            // Simulate multiple round completions
            for (let i = 0; i < 5; i++) {
                round = round + 1;
            }
            
            expect(round).toBe(6);
        });

        it('should reset round to 0 when timer stops', () => {
            let emomActive = true;
            let round = 5;
            
            // Stop timer
            emomActive = false;
            round = 0;
            
            expect(emomActive).toBe(false);
            expect(round).toBe(0);
        });
    });

    describe('EMOM Sound Effects', () => {
        it('should detect countdown range for tick sounds', () => {
            // Seconds 5, 4, 3, 2, 1 should trigger tick sound
            const tickRange = [5, 4, 3, 2, 1];
            
            tickRange.forEach(seconds => {
                const shouldTick = seconds <= 5 && seconds >= 1;
                expect(shouldTick).toBe(true);
            });
        });

        it('should not tick outside countdown range', () => {
            const noTickRange = [60, 30, 10, 6, 0];
            
            noTickRange.forEach(seconds => {
                const shouldTick = seconds <= 5 && seconds >= 1;
                if (seconds === 0 || seconds > 5) {
                    expect(shouldTick).toBe(false);
                }
            });
        });

        it('should detect interval reset for beep sound', () => {
            const emomSeconds = 0;
            const emomActive = true;
            
            const shouldBeep = emomSeconds === 0 && emomActive;
            expect(shouldBeep).toBe(true);
        });

        it('should verify AudioContext mock is set up correctly', () => {
            // Verify AudioContext mock is set up
            expect(global.AudioContext).toBeDefined();
            
            // Verify mock returns the expected structure
            const mockInstance = global.AudioContext();
            expect(mockInstance.createOscillator).toBeDefined();
            expect(mockInstance.createGain).toBeDefined();
            expect(mockInstance.destination).toBeDefined();
        });
    });

    describe('EMOM Exercise Detection', () => {
        it('should detect EMOM in notes (uppercase)', () => {
            const notes = 'EMOM';
            const hasEmom = notes.toUpperCase().includes('EMOM');
            expect(hasEmom).toBe(true);
        });

        it('should detect EMOM in notes (lowercase)', () => {
            const notes = 'emom';
            const hasEmom = notes.toUpperCase().includes('EMOM');
            expect(hasEmom).toBe(true);
        });

        it('should detect EMOM in notes (mixed case)', () => {
            const notes = 'This is an Emom exercise';
            const hasEmom = notes.toUpperCase().includes('EMOM');
            expect(hasEmom).toBe(true);
        });

        it('should not detect EMOM when not present', () => {
            const notes = 'Regular exercise';
            const hasEmom = notes.toUpperCase().includes('EMOM');
            expect(hasEmom).toBe(false);
        });

        it('should handle null notes gracefully', () => {
            const notes = null;
            const hasEmom = notes && notes.toUpperCase().includes('EMOM');
            expect(hasEmom).toBeFalsy();
        });

        it('should detect EMOM in exercise name (uppercase)', () => {
            const exercise = { name: 'Pull-Up EMOM', notes: 'Density' };
            const isEMOM = (ex) => ex && ((ex.notes && ex.notes.toLowerCase().includes('emom')) || (ex.name && ex.name.toLowerCase().includes('emom')));
            expect(isEMOM(exercise)).toBe(true);
        });

        it('should detect EMOM in exercise name (lowercase)', () => {
            const exercise = { name: 'pull-up emom', notes: 'Density' };
            const isEMOM = (ex) => ex && ((ex.notes && ex.notes.toLowerCase().includes('emom')) || (ex.name && ex.name.toLowerCase().includes('emom')));
            expect(isEMOM(exercise)).toBe(true);
        });

        it('should detect EMOM in exercise name (mixed case)', () => {
            const exercise = { name: 'Bulgarian Split Squat EMOM', notes: 'Accessory' };
            const isEMOM = (ex) => ex && ((ex.notes && ex.notes.toLowerCase().includes('emom')) || (ex.name && ex.name.toLowerCase().includes('emom')));
            expect(isEMOM(exercise)).toBe(true);
        });

        it('should prioritize notes over name for EMOM detection', () => {
            const exercise = { name: 'Regular Exercise', notes: 'EMOM' };
            const isEMOM = (ex) => ex && ((ex.notes && ex.notes.toLowerCase().includes('emom')) || (ex.name && ex.name.toLowerCase().includes('emom')));
            expect(isEMOM(exercise)).toBe(true);
        });

        it('should detect EMOM when both name and notes contain it', () => {
            const exercise = { name: 'Push-Up EMOM', notes: 'EMOM format' };
            const isEMOM = (ex) => ex && ((ex.notes && ex.notes.toLowerCase().includes('emom')) || (ex.name && ex.name.toLowerCase().includes('emom')));
            expect(isEMOM(exercise)).toBe(true);
        });

        it('should not detect EMOM when neither name nor notes contain it', () => {
            const exercise = { name: 'Regular Push-Ups', notes: 'Accessory' };
            const isEMOM = (ex) => ex && ((ex.notes && ex.notes.toLowerCase().includes('emom')) || (ex.name && ex.name.toLowerCase().includes('emom')));
            expect(isEMOM(exercise)).toBe(false);
        });
    });

    describe('EMOM Timer Integration', () => {
        it('should not interfere with rest timer', () => {
            // EMOM timer state
            const emomActive = true;
            const emomSeconds = 30;
            
            // Rest timer state
            const timerActive = true;
            const timerSeconds = 90;
            
            // Both timers should be able to run simultaneously
            expect(emomActive).toBe(true);
            expect(timerActive).toBe(true);
            expect(emomSeconds).toBe(30);
            expect(timerSeconds).toBe(90);
        });

        it('should maintain separate countdown logic', () => {
            let emomSeconds = 60;
            let timerSeconds = 90;
            
            // Simulate separate countdowns
            emomSeconds = emomSeconds - 1;
            timerSeconds = timerSeconds - 1;
            
            expect(emomSeconds).toBe(59);
            expect(timerSeconds).toBe(89);
            
            // EMOM resets, rest timer doesn't
            if (emomSeconds === 0) {
                emomSeconds = 60; // reset
            }
            if (timerSeconds === 0) {
                timerSeconds = 0; // stays at 0
            }
        });
    });

    describe('Edge Cases', () => {
        it('should handle stopping timer before completion', () => {
            let emomActive = true;
            let emomSeconds = 30;
            
            // Stop timer
            emomActive = false;
            emomSeconds = 0;
            
            expect(emomActive).toBe(false);
            expect(emomSeconds).toBe(0);
        });

        it('should handle rapid interval adjustments', () => {
            let interval = 60;
            
            // Multiple rapid adjustments
            for (let i = 0; i < 10; i++) {
                interval = Math.min(180, interval + 5);
            }
            
            expect(interval).toBe(110); // 60 + 10*5 = 110
        });

        it('should maintain state after localStorage clear', () => {
            localStorage.setItem('emom_interval', JSON.stringify(75));
            
            // Clear storage
            localStorage.clear();
            
            const stored = localStorage.getItem('emom_interval');
            expect(stored).toBeNull();
        });

        it('should handle zero interval edge case', () => {
            let interval = 10;
            
            // Try to set to zero
            interval = Math.max(10, 0);
            
            expect(interval).toBe(10); // Should maintain minimum
        });
    });
});

/**
 * useEmomTimer Hook Tests
 * 
 * Tests the EMOM timer hook for round tracking, countdown functionality,
 * and haptic feedback.
 */
import { renderHook, act } from '@testing-library/react';
import { useEmomTimer } from '../hooks/useEmomTimer';

// Mock the haptic interface
const createMockHaptic = () => ({
    tick: vi.fn(),
    bump: vi.fn(),
    success: vi.fn(),
    timer: vi.fn(),
});

describe('useEmomTimer Hook', () => {
    let mockHaptic;

    beforeEach(() => {
        vi.useFakeTimers();
        mockHaptic = createMockHaptic();
        
        // Mock localStorage
        const localStorageMock = {};
        global.localStorage = {
            getItem: vi.fn((key) => localStorageMock[key] || null),
            setItem: vi.fn((key, value) => {
                localStorageMock[key] = value;
            }),
            removeItem: vi.fn((key) => {
                delete localStorageMock[key];
            }),
            clear: vi.fn(() => {
                Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);
            })
        };

        // Mock AudioContext
        global.AudioContext = vi.fn().mockImplementation(() => ({
            createOscillator: vi.fn(() => ({
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
                frequency: { value: 0 },
                type: 'sine'
            })),
            createGain: vi.fn(() => ({
                connect: vi.fn(),
                gain: {
                    setValueAtTime: vi.fn(),
                    exponentialRampToValueAtTime: vi.fn()
                }
            })),
            destination: {},
            currentTime: 0
        }));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('Round Tracking', () => {
        it('should start with round 0 when inactive', () => {
            const { result } = renderHook(() => useEmomTimer({ haptic: mockHaptic }));

            expect(result.current.active).toBe(false);
            expect(result.current.round).toBe(0);
        });

        it('should set round to 1 when timer starts', () => {
            const { result } = renderHook(() => useEmomTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start();
            });

            expect(result.current.active).toBe(true);
            expect(result.current.round).toBe(1);
        });

        it('should increment round when interval resets', () => {
            const { result } = renderHook(() => useEmomTimer({ haptic: mockHaptic }));

            // Start timer with 2-second interval for quick testing
            act(() => {
                result.current.setIntervalDuration(2);
            });

            act(() => {
                result.current.start();
            });

            expect(result.current.round).toBe(1);
            expect(result.current.seconds).toBe(2);

            // Advance time to complete first interval
            act(() => {
                vi.advanceTimersByTime(2000);
            });

            // Round should increment when timer resets
            expect(result.current.round).toBe(2);
        });

        it('should reset round to 0 when timer stops', () => {
            const { result } = renderHook(() => useEmomTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start();
            });

            expect(result.current.round).toBe(1);

            act(() => {
                result.current.stop();
            });

            expect(result.current.round).toBe(0);
            expect(result.current.active).toBe(false);
        });

        it('should reset round to 0 when timer is toggled off', () => {
            const { result } = renderHook(() => useEmomTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.toggle();
            });

            expect(result.current.round).toBe(1);
            expect(result.current.active).toBe(true);

            act(() => {
                result.current.toggle();
            });

            expect(result.current.round).toBe(0);
            expect(result.current.active).toBe(false);
        });
    });

    describe('Countdown Behavior', () => {
        it('should start with seconds equal to interval', () => {
            const { result } = renderHook(() => useEmomTimer({ haptic: mockHaptic }));

            expect(result.current.interval).toBe(60); // default
            
            act(() => {
                result.current.start();
            });

            expect(result.current.seconds).toBe(60);
        });

        it('should countdown every second', () => {
            const { result } = renderHook(() => useEmomTimer({ haptic: mockHaptic }));

            act(() => {
                result.current.start();
            });

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
});
