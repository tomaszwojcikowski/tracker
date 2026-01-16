import { describe, it, expect, beforeEach, vi, useState } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnifiedFloatingTimerButton } from '../components/UnifiedFloatingTimerButton';
import React from 'react';

// Mock hooks
vi.mock('../hooks', () => {
    return {
        useHaptic: () => ({
            tick: vi.fn(),
            bump: vi.fn(),
            success: vi.fn(),
        }),
        useRestTimer: () => ({
            active: false,
            seconds: 0,
            start: vi.fn(),
            stop: vi.fn(),
            setSeconds: vi.fn(),
        }),
        useEmomTimer: () => ({
            active: false,
            seconds: 0,
            round: 1,
            interval: 60,
            start: vi.fn(),
            stop: vi.fn(),
            setActive: vi.fn(),
            setIntervalState: vi.fn(),
        }),
        useDensityTimer: () => {
             // We'll use a local state to make it somewhat realistic for the test that needs it
             const [active, setActive] = React.useState(false);
             const [seconds, setSeconds] = React.useState(0);
             return {
                active,
                seconds,
                start: (mins) => {
                    setActive(true);
                    setSeconds(mins * 60);
                },
                stop: () => setActive(false),
                setActive,
                setSeconds,
                timeMinutes: 10
             };
        },
        useWorkoutTimer: () => ({
            isRunning: false,
            elapsedSeconds: 0,
            formattedTime: '00:00',
            start: vi.fn(),
            pause: vi.fn(),
            stop: vi.fn(),
            toggle: vi.fn(),
        }),
    };
});

// Mock icons
vi.mock('../components/icons', () => ({
    Timer: () => <span data-testid="icon-timer">Timer</span>,
    X: () => <span data-testid="icon-x">X</span>,
    Plus: () => <span data-testid="icon-plus">Plus</span>,
    Minus: () => <span data-testid="icon-minus">Minus</span>,
    Clock: () => <span data-testid="icon-clock">Clock</span>,
    Repeat: () => <span data-testid="icon-repeat">Repeat</span>,
    Zap: () => <span data-testid="icon-zap">Zap</span>,
    Activity: () => <span data-testid="icon-activity">Activity</span>,
}));

// Mock FullscreenTimer
vi.mock('../components/FullscreenTimer', () => ({
    FullscreenTimer: ({ densityRepControls, mode }) => (
        <div data-testid="fullscreen-timer" data-mode={mode}>
            {densityRepControls && (
                <div data-testid="density-reps">
                    Target: {densityRepControls.targetReps}
                    Reps: {densityRepControls.repChunks.join(',')}
                </div>
            )}
            <button onClick={() => densityRepControls?.onUpdateRepChunks([5])}>Add 5 Reps</button>
        </div>
    ),
}));

describe('UnifiedFloatingTimerButton', () => {
    it('should show extended bar when clicked and no timer is active', () => {
        render(<UnifiedFloatingTimerButton />);

        const fab = screen.getByLabelText('Open timer options');
        fireEvent.click(fab);

        // Should show extended bar icons
        expect(screen.getByLabelText('Rest Timer')).toBeInTheDocument();
        expect(screen.getByLabelText('EMOM Timer')).toBeInTheDocument();
        expect(screen.getByLabelText('Density Timer')).toBeInTheDocument();
        expect(screen.getByLabelText('Workout Timer')).toBeInTheDocument();

        // FAB should now show X
        expect(screen.getByLabelText('Close timer options')).toBeInTheDocument();
    });

    it('should open bottom sheet with correct section when a timer type is selected', () => {
        render(<UnifiedFloatingTimerButton />);

        // Open extended bar
        fireEvent.click(screen.getByLabelText('Open timer options'));

        // Click Rest Timer icon
        fireEvent.click(screen.getByLabelText('Rest Timer'));

        // Should show Rest Timer section in BottomSheet
        expect(screen.getByText('Rest Timer')).toBeInTheDocument();

        // Should NOT show other sections (they are filtered out)
        expect(screen.queryByText('EMOM Timer')).not.toBeInTheDocument();
        expect(screen.queryByText('Density Timer')).not.toBeInTheDocument();
        expect(screen.queryByText('Workout Timer')).not.toBeInTheDocument();
    });

    it('should allow changing density target reps', () => {
        render(<UnifiedFloatingTimerButton />);

        // Open extended bar and select Density
        fireEvent.click(screen.getByLabelText('Open timer options'));
        fireEvent.click(screen.getByLabelText('Density Timer'));

        // Default should be 30
        expect(screen.getByText('30')).toBeInTheDocument();

        // Increase reps
        const increaseBtn = screen.getByLabelText('Increase target reps');
        fireEvent.click(increaseBtn);
        expect(screen.getByText('31')).toBeInTheDocument();

        // Decrease reps
        const decreaseBtn = screen.getByLabelText('Decrease target reps');
        fireEvent.click(decreaseBtn);
        fireEvent.click(decreaseBtn);
        expect(screen.getByText('29')).toBeInTheDocument();

        // Start timer and check if it reflects in fullscreen
        const startBtn = screen.getByText('Start');
        fireEvent.click(startBtn);

        // Fullscreen should be visible automatically now
        expect(screen.getByTestId('fullscreen-timer')).toBeInTheDocument();
        expect(screen.getByText(/Target: 29/)).toBeInTheDocument();
    });

    it('should track reps in fullscreen density timer', () => {
        // We need to trigger the density timer active state
        render(<UnifiedFloatingTimerButton />);

        // Open extended bar
        fireEvent.click(screen.getByLabelText('Open timer options'));

        // Click Density Timer icon
        fireEvent.click(screen.getByLabelText('Density Timer'));

        // Start density timer (e.g. 10m)
        fireEvent.click(screen.getAllByText('10m')[0]);

        // Fullscreen should be visible automatically now
        expect(screen.getByTestId('fullscreen-timer')).toHaveAttribute('data-mode', 'density');
        expect(screen.getByTestId('density-reps')).toBeInTheDocument();

        // Add reps
        fireEvent.click(screen.getByText('Add 5 Reps'));

        // Reps should be updated (the mock uses join(','))
        expect(screen.getByText(/Reps: 5/)).toBeInTheDocument();
    });
});
