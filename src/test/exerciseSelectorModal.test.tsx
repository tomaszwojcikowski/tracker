import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * ExerciseSelectorModal Component Tests
 *
 * Tests the exercise selector modal for adding exercises to workouts.
 */

// Mock custom icons module
vi.mock('../components/icons', () => ({
    X: () => <span data-testid="icon-x">✕</span>,
    Search: () => <span data-testid="icon-search">🔍</span>,
    Plus: () => <span data-testid="icon-plus">+</span>,
    Dumbbell: () => <span data-testid="icon-dumbbell">🏋</span>,
    Check: () => <span data-testid="icon-check">✓</span>,
}));

// Mock child components
vi.mock('../components/ExerciseListItem', () => ({
    ExerciseListItem: ({ exercise, onAdd }) => (
        <div data-testid={`exercise-item-${exercise.id}`}>
            <span>{exercise.name}</span>
            <button onClick={() => onAdd(exercise)}>Add</button>
        </div>
    ),
}));

vi.mock('../components/RecentExercises', () => ({
    RecentExercisesList: ({ exerciseLibrary, onSelectExercise }) => (
        <div data-testid="recent-exercises">
            <button onClick={() => onSelectExercise(exerciseLibrary[0])}>
                Select Recent
            </button>
        </div>
    ),
    addRecentExercise: vi.fn(),
}));

import { ExerciseSelectorModal } from '../components/ExerciseSelectorModal';

describe('ExerciseSelectorModal', () => {
    const mockHaptic = {
        tick: vi.fn(),
        bump: vi.fn(),
    };

    const mockExercises = [
        {
            id: 'bench_press',
            name: 'Bench Press',
            category: 'chest',
            primaryMuscles: ['chest'],
        },
        {
            id: 'squats',
            name: 'Squats',
            category: 'legs',
            primaryMuscles: ['quadriceps'],
        },
        {
            id: 'pull_ups',
            name: 'Pull-Ups',
            category: 'back',
            primaryMuscles: ['lats'],
        },
    ];

    const defaultProps = {
        isOpen: true,
        searchTerm: '',
        debouncedSearchTerm: '',
        selectedFilter: 'all',
        filteredExercises: mockExercises,
        exerciseLibrary: mockExercises,
        haptic: mockHaptic,
        onSearchChange: vi.fn(),
        onFilterChange: vi.fn(),
        onAddExercise: vi.fn(),
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render when isOpen is true', () => {
            render(<ExerciseSelectorModal {...defaultProps} />);

            expect(screen.getByText('Add Exercise')).toBeInTheDocument();
        });

        it('should not render when isOpen is false', () => {
            render(<ExerciseSelectorModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByText('Add Exercise')).not.toBeInTheDocument();
        });

        it('should not render when exercise library is empty', () => {
            render(
                <ExerciseSelectorModal
                    {...defaultProps}
                    exerciseLibrary={[]}
                />
            );

            expect(screen.queryByText('Add Exercise')).not.toBeInTheDocument();
        });

        it('should render search input', () => {
            render(<ExerciseSelectorModal {...defaultProps} />);

            expect(screen.getByPlaceholderText('Search exercises...')).toBeInTheDocument();
        });

        it('should render muscle filter buttons', () => {
            render(<ExerciseSelectorModal {...defaultProps} />);

            expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Push' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Pull' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Legs' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Core' })).toBeInTheDocument();
        });

        it('should render exercise list', () => {
            render(<ExerciseSelectorModal {...defaultProps} />);

            expect(screen.getByTestId('exercise-item-bench_press')).toBeInTheDocument();
            expect(screen.getByTestId('exercise-item-squats')).toBeInTheDocument();
            expect(screen.getByTestId('exercise-item-pull_ups')).toBeInTheDocument();
        });

        it('should render close button', () => {
            render(<ExerciseSelectorModal {...defaultProps} />);

            expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
        });
    });

    describe('Search', () => {
        it('should call onSearchChange when typing in search', () => {
            render(<ExerciseSelectorModal {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('Search exercises...');
            fireEvent.change(searchInput, { target: { value: 'bench' } });

            expect(defaultProps.onSearchChange).toHaveBeenCalledWith('bench');
        });

        it('should show search term in input', () => {
            render(
                <ExerciseSelectorModal
                    {...defaultProps}
                    searchTerm="bench"
                />
            );

            expect(screen.getByPlaceholderText('Search exercises...')).toHaveValue('bench');
        });

        it('should show empty list when no exercises match filter', () => {
            render(
                <ExerciseSelectorModal
                    {...defaultProps}
                    filteredExercises={[]}
                    debouncedSearchTerm="xyz"
                />
            );

            // The component shows an empty list, not a message
            expect(screen.queryByTestId('exercise-item-bench_press')).not.toBeInTheDocument();
        });
    });

    describe('Muscle Filters', () => {
        it('should call onFilterChange when filter button is clicked', () => {
            render(<ExerciseSelectorModal {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Push' }));

            // Filter buttons don't trigger haptic in the component
            expect(defaultProps.onFilterChange).toHaveBeenCalledWith('push');
        });

        it('should highlight selected filter', () => {
            render(
                <ExerciseSelectorModal
                    {...defaultProps}
                    selectedFilter="pull"
                />
            );

            const pullButton = screen.getByRole('button', { name: 'Pull' });
            expect(pullButton).toHaveClass('btn-filled');
        });
    });

    describe('Exercise Selection', () => {
        it('should call onAddExercise when exercise is added', () => {
            render(<ExerciseSelectorModal {...defaultProps} />);

            const addButton = screen.getAllByText('Add')[0];
            fireEvent.click(addButton);

            expect(defaultProps.onAddExercise).toHaveBeenCalledWith(
                mockExercises[0],
                undefined,
                undefined,
                undefined
            );
        });
    });

    describe('Closing Modal', () => {
        it('should call onClose when close button is clicked', () => {
            render(<ExerciseSelectorModal {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Close' }));

            expect(mockHaptic.tick).toHaveBeenCalled();
            expect(defaultProps.onClose).toHaveBeenCalled();
        });
    });

    describe('Recent Exercises', () => {
        it('should render recent exercises section', () => {
            render(<ExerciseSelectorModal {...defaultProps} />);

            expect(screen.getByTestId('recent-exercises')).toBeInTheDocument();
        });
    });
});
