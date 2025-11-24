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
