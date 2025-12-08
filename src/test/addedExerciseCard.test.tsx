import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * AddedExerciseCard Component Tests
 *
 * Tests the AddedExerciseCard component for custom/added exercises.
 */

// Mock custom icons module
vi.mock('../components/icons', () => ({
    Check: () => <span data-testid="icon-check">✓</span>,
    X: () => <span data-testid="icon-x">✕</span>,
    Timer: () => <span data-testid="icon-timer">⏱</span>,
}));

import { AddedExerciseCard } from '../components/AddedExerciseCard';

describe('AddedExerciseCard', () => {
    const defaultHaptic = {
        tick: vi.fn(),
        bump: vi.fn(),
    };

    const defaultExercise = {
        id: 'custom_1',
        name: 'Lateral Raises',
        sets: 3,
        weight: '10',
        rest: 60,
    };

    const defaultProps = {
        exercise: defaultExercise,
        sets: [false, false, false],
        haptic: defaultHaptic,
        onToggleSet: vi.fn(),
        onRemove: vi.fn(),
        onStartRestTimer: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render exercise name', () => {
            render(<AddedExerciseCard {...defaultProps} />);

            expect(screen.getByText('Lateral Raises')).toBeInTheDocument();
        });

        it('should render exercise details with weight', () => {
            render(<AddedExerciseCard {...defaultProps} />);

            expect(screen.getByText('3 sets @ 10kg')).toBeInTheDocument();
        });

        it('should render exercise details without weight', () => {
            render(
                <AddedExerciseCard
                    {...defaultProps}
                    exercise={{ ...defaultExercise, weight: '' }}
                />
            );

            expect(screen.getByText('3 sets')).toBeInTheDocument();
        });

        it('should render set buttons for each set', () => {
            render(<AddedExerciseCard {...defaultProps} />);

            // 3 set buttons + timer button + remove button
            expect(screen.getByRole('button', { name: 'Set 1' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Set 2' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Set 3' })).toBeInTheDocument();
        });

        it('should show completed status for finished sets', () => {
            render(
                <AddedExerciseCard
                    {...defaultProps}
                    sets={[true, false, false]}
                />
            );

            expect(screen.getByRole('button', { name: 'Set 1 completed' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Set 2' })).toBeInTheDocument();
        });

        it('should show progress counter when sets completed', () => {
            render(
                <AddedExerciseCard
                    {...defaultProps}
                    sets={[true, true, false]}
                />
            );

            expect(screen.getByText('2/3')).toBeInTheDocument();
        });

        it('should show remove button', () => {
            render(<AddedExerciseCard {...defaultProps} />);

            expect(screen.getByRole('button', { name: 'Remove exercise' })).toBeInTheDocument();
        });
    });

    describe('User Interactions', () => {
        it('should call onToggleSet when set button is clicked', () => {
            render(<AddedExerciseCard {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Set 1' }));

            expect(defaultProps.onToggleSet).toHaveBeenCalledWith('added_custom_1', 0, 3, 60);
        });

        it('should call onRemove when remove button is clicked', () => {
            render(<AddedExerciseCard {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Remove exercise' }));

            expect(defaultProps.onRemove).toHaveBeenCalledWith('custom_1');
        });

        it('should call onStartRestTimer when rest timer button is clicked', () => {
            render(<AddedExerciseCard {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Start 60 second timer' }));

            expect(defaultProps.haptic.bump).toHaveBeenCalled();
            expect(defaultProps.onStartRestTimer).toHaveBeenCalledWith(60);
        });
    });

    describe('Visual States', () => {
        it('should show success styling when all sets completed', () => {
            const { container } = render(
                <AddedExerciseCard
                    {...defaultProps}
                    sets={[true, true, true]}
                />
            );

            const card = container.querySelector('.border-sys-success\\/30');
            expect(card).toBeInTheDocument();
        });

        it('should show default styling when incomplete', () => {
            const { container } = render(<AddedExerciseCard {...defaultProps} />);

            const card = container.querySelector('.border-white\\/5');
            expect(card).toBeInTheDocument();
        });
    });

    describe('Timer Button', () => {
        it('should show timer button when rest time is set', () => {
            render(<AddedExerciseCard {...defaultProps} />);

            expect(screen.getByRole('button', { name: 'Start 60 second timer' })).toBeInTheDocument();
        });

        it('should hide timer button when rest time is 0', () => {
            render(
                <AddedExerciseCard
                    {...defaultProps}
                    exercise={{ ...defaultExercise, rest: 0 }}
                />
            );

            expect(screen.queryByRole('button', { name: /timer/i })).not.toBeInTheDocument();
        });

        it('should hide timer button when rest time is undefined', () => {
            const exerciseWithoutRest = { ...defaultExercise };
            delete exerciseWithoutRest.rest;

            render(
                <AddedExerciseCard
                    {...defaultProps}
                    exercise={exerciseWithoutRest}
                />
            );

            expect(screen.queryByRole('button', { name: /timer/i })).not.toBeInTheDocument();
        });
    });
});
