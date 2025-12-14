/**
 * Feature Integrity Tests
 *
 * These tests verify that core features still work correctly after code cleanup.
 * They focus on ensuring no functionality was accidentally removed during the
 * removal of unused code, dependencies, and exports.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
    };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
    value: vi.fn(() => true),
    writable: true,
});

describe('Feature Integrity Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    describe('Core Hooks Still Work', () => {
        it('useHaptic hook provides all haptic feedback methods', async () => {
            const { useHaptic } = await import('../hooks');

            // Render a component that uses the hook
            function TestComponent() {
                const haptic = useHaptic();
                return (
                    <div>
                        <button onClick={haptic.tick} data-testid="tick">Tick</button>
                        <button onClick={haptic.bump} data-testid="bump">Bump</button>
                        <button onClick={haptic.success} data-testid="success">Success</button>
                        <button onClick={haptic.timer} data-testid="timer">Timer</button>
                        <button onClick={haptic.complete} data-testid="complete">Complete</button>
                        <button onClick={haptic.milestone} data-testid="milestone">Milestone</button>
                        <button onClick={haptic.countdown} data-testid="countdown">Countdown</button>
                        <button onClick={haptic.error} data-testid="error">Error</button>
                        <button onClick={haptic.swipe} data-testid="swipe">Swipe</button>
                    </div>
                );
            }

            render(<TestComponent />);

            // All buttons should render
            expect(screen.getByTestId('tick')).toBeDefined();
            expect(screen.getByTestId('bump')).toBeDefined();
            expect(screen.getByTestId('success')).toBeDefined();
            expect(screen.getByTestId('timer')).toBeDefined();
            expect(screen.getByTestId('complete')).toBeDefined();
            expect(screen.getByTestId('milestone')).toBeDefined();
            expect(screen.getByTestId('countdown')).toBeDefined();
            expect(screen.getByTestId('error')).toBeDefined();
            expect(screen.getByTestId('swipe')).toBeDefined();
        });

        it('useSwipe hook provides touch handlers', async () => {
            const { useSwipe } = await import('../hooks');

            function TestComponent() {
                const handlers = useSwipe({
                    onSwipeLeft: () => {},
                    onSwipeRight: () => {},
                });
                return (
                    <div
                        data-testid="swipeable"
                        onTouchStart={handlers.onTouchStart}
                        onTouchMove={handlers.onTouchMove}
                        onTouchEnd={handlers.onTouchEnd}
                    >
                        Swipeable
                    </div>
                );
            }

            render(<TestComponent />);
            expect(screen.getByTestId('swipeable')).toBeDefined();
        });

        it('useDebounce hook debounces values', async () => {
            const { useDebounce } = await import('../hooks');

            function TestComponent({ value }: { value: string }) {
                const debouncedValue = useDebounce(value, 100);
                return <div data-testid="debounced">{debouncedValue}</div>;
            }

            const { rerender } = render(<TestComponent value="initial" />);
            expect(screen.getByTestId('debounced').textContent).toBe('initial');

            rerender(<TestComponent value="updated" />);
            // Value should not change immediately due to debounce
            expect(screen.getByTestId('debounced').textContent).toBe('initial');
        });
    });

    describe('Core Components Still Export Correctly', () => {
        it('AnimatedNumber component exports both named exports', async () => {
            const module = await import('../components/animations/AnimatedNumber');
            expect(module.AnimatedNumber).toBeDefined();
            expect(module.AnimatedCounter).toBeDefined();
        });

        it('BottomSheet component exports correctly', async () => {
            const module = await import('../components/BottomSheet');
            expect(module.BottomSheet).toBeDefined();
        });

        it('ErrorBoundary component exports correctly', async () => {
            const module = await import('../components/ErrorBoundary');
            expect(module.ErrorBoundary).toBeDefined();
        });

        it('Navigation components export correctly', async () => {
            const module = await import('../components/navigation');
            expect(module.NavigationBar).toBeDefined();
        });

        it('Modal components export correctly', async () => {
            const module = await import('../components/modals');
            expect(module.ExerciseDetailModal).toBeDefined();
        });

        it('Progress components export correctly', async () => {
            const module = await import('../components/progress');
            expect(module.WeeklyProgressRing).toBeDefined();
        });
    });

    describe('Core Utilities Still Work', () => {
        it('storage utilities work correctly', async () => {
            const { safeGetJSON, safeSetJSON, safeRemove } = await import('../utils/storage');

            // Test set
            const setResult = safeSetJSON('test_key', { foo: 'bar' });
            expect(setResult).toBe(true);

            // Test get
            const value = safeGetJSON<{ foo: string }>('test_key', { foo: 'default' });
            expect(value).toEqual({ foo: 'bar' });

            // Test remove
            const removeResult = safeRemove('test_key');
            expect(removeResult).toBe(true);

            // Verify removal
            const afterRemove = safeGetJSON<{ foo: string }>('test_key', { foo: 'default' });
            expect(afterRemove).toEqual({ foo: 'default' });
        });

        it('time utilities work correctly', async () => {
            const { formatTime, formatRelativeTime } = await import('../utils/time');

            // Format time
            const formatted = formatTime(90);
            expect(formatted).toBe('1:30');

            // Format relative time returns null for null input
            const relative = formatRelativeTime(null);
            expect(relative).toBeNull();
        });

        it('exercise history utilities work correctly', async () => {
            const { getExerciseHistory, updateExerciseHistory } = await import('../utils/exerciseHistory');

            // Get empty history
            const emptyHistory = getExerciseHistory('test_exercise');
            expect(emptyHistory).toEqual([]);

            // Update history
            updateExerciseHistory('test_exercise', {
                date: '2024-01-15',
                week: 1,
                day: 1,
                prescription: '3x8',
                sets: [true, true, true],
                weight: '50kg',
            });

            // Verify update
            const history = getExerciseHistory('test_exercise');
            expect(history.length).toBe(1);
            expect(history[0].weight).toBe('50kg');
        });
    });

    describe('Icon Exports Still Work', () => {
        it('icons module exports required icons', async () => {
            const icons = await import('../icons');

            // Icons used by ThemeSelector
            expect(icons.Check).toBeDefined();
            expect(icons.Palette).toBeDefined();

            // Icons used by Onboarding
            expect(icons.Dumbbell).toBeDefined();
            expect(icons.Calendar).toBeDefined();
            expect(icons.TrendingUp).toBeDefined();
            expect(icons.Cloud).toBeDefined();
            expect(icons.ChevronRight).toBeDefined();
            expect(icons.X).toBeDefined();

            // Icons used by PullToRefresh
            expect(icons.RefreshCw).toBeDefined();
        });
    });

    describe('Constants Still Export Correctly', () => {
        it('constants module exports required values', async () => {
            const constants = await import('../constants');

            // Core constants
            expect(constants.MAX_SETS).toBeDefined();
            expect(constants.FETCH_TIMEOUT_MS).toBeDefined();
            expect(constants.DEBOUNCE_DELAY_MS).toBeDefined();

            // Time constants
            expect(constants.MS_PER_MINUTE).toBeDefined();
            expect(constants.MS_PER_HOUR).toBeDefined();
            expect(constants.MS_PER_DAY).toBeDefined();

            // Validation arrays
            expect(constants.VALID_TABS).toBeDefined();
            expect(constants.VALID_DAYS).toBeDefined();
            expect(constants.VALID_VIEW_MODES).toBeDefined();

            // Defaults
            expect(constants.DEFAULT_WEEK).toBeDefined();
            expect(constants.DEFAULT_DAY).toBeDefined();
            expect(constants.DEFAULT_TAB).toBeDefined();

            // Functions
            expect(constants.getShortExerciseName).toBeDefined();
            expect(typeof constants.getShortExerciseName).toBe('function');
        });

        it('getShortExerciseName returns correct short names', async () => {
            const { getShortExerciseName } = await import('../constants');

            // Known short names
            expect(getShortExerciseName('Bulgarian Split Squat')).toBe('BSS');
            expect(getShortExerciseName('Bulgarian Split Squat (Left)')).toBe('BSS (L)');

            // Unknown names return original
            expect(getShortExerciseName('Unknown Exercise')).toBe('Unknown Exercise');
        });
    });

    describe('Program Data Still Works', () => {
        it('can access program data functions', async () => {
            const { PROGRAM_DATA, getWorkoutForDay, getBlockForWeek } = await import('../data/programData');

            expect(PROGRAM_DATA).toBeDefined();
            expect(PROGRAM_DATA.getWorkout).toBeDefined();
            expect(getWorkoutForDay).toBeDefined();
            expect(getBlockForWeek).toBeDefined();
        });
    });

    describe('Firebase Service Still Exports', () => {
        it('firebase service exports required functions', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const firebase = await import('../firebase-service');

            // Core exports should exist (may be null if not initialized)
            expect('FirebaseService' in firebase || 'initializeFirebase' in firebase).toBe(true);

            consoleWarnSpy.mockRestore();
        });
    });

    describe('Hooks Index Re-exports Work', () => {
        it('hooks index exports all required hooks', async () => {
            const hooks = await import('../hooks');

            // Core hooks
            expect(hooks.useHaptic).toBeDefined();
            expect(hooks.useSwipe).toBeDefined();
            expect(hooks.useDebounce).toBeDefined();

            // Re-exported hooks
            expect(hooks.useKeyboardShortcut).toBeDefined();
            expect(hooks.useTheme).toBeDefined();
            expect(hooks.useWorkoutTimer).toBeDefined();
            expect(hooks.useRestTimer).toBeDefined();
            expect(hooks.useEmomTimer).toBeDefined();
            expect(hooks.useExerciseCollapse).toBeDefined();
            expect(hooks.useScrollToElement).toBeDefined();
            expect(hooks.useScrollToTop).toBeDefined();
            expect(hooks.useMediaQuery).toBeDefined();
        });

        it('HapticFeedback type is exported', async () => {
            const hooks = await import('../hooks');

            // Type should be usable (we can't directly test types, but we can verify the hook returns the right shape)
            const TestComponent = () => {
                const haptic: typeof hooks extends { useHaptic: () => infer R } ? R : never = hooks.useHaptic();
                return <div>{typeof haptic.tick}</div>;
            };

            render(<TestComponent />);
        });
    });

    describe('PWA Features Still Work', () => {
        it('PWA hook exports correctly', async () => {
            const { usePWA } = await import('../hooks/usePWA');
            expect(usePWA).toBeDefined();
        });

        it('PWAWrapper component exports correctly', async () => {
            const module = await import('../components/PWAWrapper');
            expect(module.PWAWrapper).toBeDefined();
            expect(module.default).toBeDefined(); // Needed for React.lazy
        });
    });

    describe('Theme System Still Works', () => {
        it('useTheme hook works', async () => {
            const { useTheme, THEMES } = await import('../hooks/useTheme');

            expect(useTheme).toBeDefined();
            expect(THEMES).toBeDefined();
            expect(Array.isArray(THEMES)).toBe(true);
            expect(THEMES.length).toBeGreaterThan(0);
        });
    });

    describe('Timer Hooks Still Work', () => {
        it('useWorkoutTimer exports correctly', async () => {
            const { useWorkoutTimer, formatTimerTime, MAX_TIMER_SECONDS } = await import('../hooks/useWorkoutTimer');

            expect(useWorkoutTimer).toBeDefined();
            expect(formatTimerTime).toBeDefined();
            expect(MAX_TIMER_SECONDS).toBeDefined();

            // Test formatTimerTime
            expect(formatTimerTime(90)).toBe('01:30');
            expect(formatTimerTime(3661)).toBe('1:01:01');
        });

        it('useRestTimer exports correctly', async () => {
            const { useRestTimer } = await import('../hooks/useRestTimer');
            expect(useRestTimer).toBeDefined();
        });

        it('useEmomTimer exports correctly', async () => {
            const { useEmomTimer } = await import('../hooks/useEmomTimer');
            expect(useEmomTimer).toBeDefined();
        });
    });

    describe('Accessibility Features Still Work', () => {
        it('useKeyboardShortcut exports correctly', async () => {
            const { useKeyboardShortcut } = await import('../hooks/useAccessibility');
            expect(useKeyboardShortcut).toBeDefined();
        });
    });

    describe('Long Press Hook Still Works', () => {
        it('useLongPress exports correctly', async () => {
            const { useLongPress } = await import('../hooks/useLongPress');
            expect(useLongPress).toBeDefined();
        });
    });

    describe('Pull to Refresh Still Works', () => {
        it('usePullToRefresh exports correctly', async () => {
            const { usePullToRefresh } = await import('../hooks/usePullToRefresh');
            expect(usePullToRefresh).toBeDefined();
        });

        it('PullToRefresh component exports correctly', async () => {
            const { PullToRefresh } = await import('../components/PullToRefresh');
            expect(PullToRefresh).toBeDefined();
        });
    });

    describe('Optimistic Sync Still Works', () => {
        it('useOptimisticSync exports correctly', async () => {
            const { useOptimisticSync, SyncStatus } = await import('../hooks/useOptimisticSync');
            expect(useOptimisticSync).toBeDefined();
            expect(SyncStatus).toBeDefined();
        });
    });

    describe('URL State Management Still Works', () => {
        it('URL state utilities export correctly', async () => {
            const urlState = await import('../utils/urlState');

            expect(urlState.getUrlParams).toBeDefined();
            expect(urlState.saveAppState).toBeDefined();
            expect(urlState.loadAppState).toBeDefined();
        });
    });

    describe('Automerge Sync Utilities Still Work', () => {
        it('automergeSync exports key functions', async () => {
            const automerge = await import('../utils/automergeSync');

            expect(automerge.getActorId).toBeDefined();
            expect(automerge.isAutomergeMigrated).toBeDefined();
            expect(automerge.AUTOMERGE_DOC_KEY).toBeDefined();
            expect(automerge.ACTOR_ID_KEY).toBeDefined();
        });
    });

    describe('Error Reporting Still Works', () => {
        it('error reporting exports correctly', async () => {
            const errorReporting = await import('../utils/errorReporting');

            expect(errorReporting.initErrorReporting).toBeDefined();
            expect(errorReporting.captureError).toBeDefined();
            expect(errorReporting.setErrorReportingUser).toBeDefined();
        });
    });

    describe('Schedule Utilities Still Work', () => {
        it('schedule utilities export correctly', async () => {
            const schedule = await import('../utils/schedule');

            expect(schedule.buildCompleteSchedule).toBeDefined();
            expect(schedule.getCompleteSchedule).toBeDefined();
            expect(schedule.setActiveScheduleProgram).toBeDefined();
        });
    });

    describe('Volume Utilities Still Work', () => {
        it('volume utilities export correctly', async () => {
            const volume = await import('../utils/volume');

            expect(volume.calculateWorkoutVolume).toBeDefined();
        });
    });

    describe('Firebase Sync Utilities Still Work', () => {
        it('firebase sync utilities export correctly', async () => {
            const firebaseSync = await import('../utils/firebaseSync');

            expect(firebaseSync.mergeCloudData).toBeDefined();
            expect(firebaseSync.localDataToCloudData).toBeDefined();
            expect(firebaseSync.getAllLocalData).toBeDefined();
        });
    });
});
