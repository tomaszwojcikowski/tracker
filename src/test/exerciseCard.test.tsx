import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * ExerciseCard Component Tests
 *
 * Tests the ExerciseCard component used in the workout player card view.
 * Covers rendering, user interactions, and callback handling.
 */

// Mock the RPESelector component
vi.mock('../components/RPESelector', () => ({
    RPESelector: ({ value, onChange, onSkip, setNumber, showAsPrompt }) => (
        <div data-testid="rpe-selector" data-set={setNumber} data-prompt={showAsPrompt}>
            <button onClick={() => onChange('8')}>RPE 8</button>
            <button onClick={onSkip}>Skip</button>
        </div>
    ),
}));

// Mock custom icons module
vi.mock('../components/icons', () => ({
    ChevronDown: () => <span data-testid="icon-chevron-down">▼</span>,
    ChevronUp: () => <span data-testid="icon-chevron-up">▲</span>,
    Timer: () => <span data-testid="icon-timer">⏱</span>,
    Repeat: () => <span data-testid="icon-repeat">🔄</span>,
    Check: () => <span data-testid="icon-check">✓</span>,
    Plus: () => <span data-testid="icon-plus">+</span>,
    CheckCheck: () => <span data-testid="icon-checkcheck">✓✓</span>,
    Minus: () => <span data-testid="icon-minus">-</span>,
    Link: () => <span data-testid="icon-link">🔗</span>,
    Zap: () => <span data-testid="icon-zap">⚡</span>,
    ArrowRightLeft: () => <span data-testid="icon-swap">⇄</span>,
}));

import { ExerciseCard } from '../components/ExerciseCard';

describe('ExerciseCard', () => {
    // Default props for rendering
    const defaultHaptic = {
        tick: vi.fn(),
        bump: vi.fn(),
        success: vi.fn(),
    };

    const defaultProps = {
        exId: 'bench_press',
        name: 'Bench Press',
        effectiveName: 'Bench Press',
        prescription: '3x8 reps',
        sets: [false, false, false],
        defaultSets: 3,
        exerciseLog: { sets: [false, false, false], weight: '', rpe: {} },
        hasHistory: false,
        isFirstIncomplete: false,
        isCollapsed: false,
        rpePrompt: null,
        emomTimerActive: false,
        emomTimerInterval: 60,
        haptic: defaultHaptic,
        onToggleCollapse: vi.fn(),
        onToggleSet: vi.fn(),
        onAddSet: vi.fn(),
        onCompleteAllSets: vi.fn(),
        onSaveWeight: vi.fn(),
        onSaveRPE: vi.fn(),
        onClearRPEPrompt: vi.fn(),
        onStartRestTimer: vi.fn(),
        onToggleEmomTimer: vi.fn(),
        onShowHistory: vi.fn(),
        onShowAlternatives: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render exercise name and prescription', () => {
            render(<ExerciseCard {...defaultProps} />);

            expect(screen.getByText('Bench Press')).toBeInTheDocument();
            expect(screen.getByText('3x8 reps')).toBeInTheDocument();
        });

        it('should render set buttons for each set', () => {
            render(<ExerciseCard {...defaultProps} />);

            // With progressive reveal: only first incomplete set is shown as button, rest are dots
            expect(screen.getByRole('button', { name: 'Set 1' })).toBeInTheDocument();
            // Sets 2 and 3 are shown as dots (not buttons)
            expect(screen.getByLabelText('Set 2 pending')).toBeInTheDocument();
            expect(screen.getByLabelText('Set 3 pending')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Add set' })).toBeInTheDocument();
            // Progress indicator should be shown
            expect(screen.getByText('(0/3)')).toBeInTheDocument();
        });

        it('should show completed status for finished sets', () => {
            render(
                <ExerciseCard
                    {...defaultProps}
                    sets={[true, true, false]}
                    exerciseLog={{ sets: [true, true, false], weight: '', rpe: {} }}
                />
            );

            expect(screen.getByRole('button', { name: 'Set 1 completed' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Set 2 completed' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Set 3' })).toBeInTheDocument();
        });

        it('should show progress counter when sets are completed', () => {
            render(
                <ExerciseCard
                    {...defaultProps}
                    sets={[true, true, false]}
                    exerciseLog={{ sets: [true, true, false], weight: '', rpe: {} }}
                />
            );

            expect(screen.getByText('2/3')).toBeInTheDocument();
        });

        it('should display EMOM badge when exercise is EMOM type', () => {
            render(<ExerciseCard {...defaultProps} isEmom={true} />);

            expect(screen.getByText('EMOM')).toBeInTheDocument();
        });

        it('should hide content when collapsed', () => {
            render(<ExerciseCard {...defaultProps} isCollapsed={true} />);

            // Set buttons should not be visible when collapsed
            expect(screen.queryByRole('button', { name: 'Set 1' })).not.toBeInTheDocument();
        });

        it('should show superset badge when first in superset', () => {
            render(
                <ExerciseCard
                    {...defaultProps}
                    supersetGroup={1}
                    supersetPosition="first"
                />
            );

            expect(screen.getByText('SUPERSET')).toBeInTheDocument();
        });

        it('should display max 2 dots for exercises with many sets', () => {
            // Test with 5 sets - should show: button for set 1, then 2 dots (sets 2 and 3)
            // Sets 4 and 5 should not have dots
            render(
                <ExerciseCard
                    {...defaultProps}
                    sets={[false, false, false, false, false]}
                    defaultSets={5}
                    exerciseLog={{ sets: [false, false, false, false, false], weight: '', rpe: {} }}
                />
            );

            // First incomplete set should be a button
            expect(screen.getByRole('button', { name: 'Set 1' })).toBeInTheDocument();

            // Should show dots for sets 2 and 3 (max 2 dots)
            expect(screen.getByLabelText('Set 2 pending')).toBeInTheDocument();
            expect(screen.getByLabelText('Set 3 pending')).toBeInTheDocument();

            // Sets 4 and 5 should NOT have dots
            expect(screen.queryByLabelText('Set 4 pending')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Set 5 pending')).not.toBeInTheDocument();

            // Progress indicator should show all sets
            expect(screen.getByText('(0/5)')).toBeInTheDocument();
        });

        it('should display max 2 dots after completing some sets', () => {
            // Test with 6 sets, 2 completed - should show: 2 completed buttons, 1 next button, 2 dots
            render(
                <ExerciseCard
                    {...defaultProps}
                    sets={[true, true, false, false, false, false]}
                    defaultSets={6}
                    exerciseLog={{ sets: [true, true, false, false, false, false], weight: '', rpe: {} }}
                />
            );

            // Completed sets should be buttons
            expect(screen.getByRole('button', { name: 'Set 1 completed' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Set 2 completed' })).toBeInTheDocument();

            // Next incomplete set should be a button
            expect(screen.getByRole('button', { name: 'Set 3' })).toBeInTheDocument();

            // Should show dots for sets 4 and 5 (max 2 dots)
            expect(screen.getByLabelText('Set 4 pending')).toBeInTheDocument();
            expect(screen.getByLabelText('Set 5 pending')).toBeInTheDocument();

            // Set 6 should NOT have a dot
            expect(screen.queryByLabelText('Set 6 pending')).not.toBeInTheDocument();

            // Progress indicator should show all sets
            expect(screen.getByText('2/6')).toBeInTheDocument();
        });
    });

    describe('User Interactions', () => {
        it('should call onToggleSet when set button is clicked', () => {
            render(<ExerciseCard {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Set 1' }));

            expect(defaultProps.onToggleSet).toHaveBeenCalledWith('bench_press', 0, 3, undefined, undefined, undefined);
        });

        it('should call onToggleSet with rest time when provided', () => {
            render(<ExerciseCard {...defaultProps} restTime={90} />);

            fireEvent.click(screen.getByRole('button', { name: 'Set 1' }));

            expect(defaultProps.onToggleSet).toHaveBeenCalledWith('bench_press', 0, 3, 90, undefined, undefined);
        });

        it('should call onAddSet when add set button is clicked', () => {
            render(<ExerciseCard {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Add set' }));

            expect(defaultProps.onAddSet).toHaveBeenCalledWith('bench_press', 3);
        });

        it('should call onToggleCollapse when collapse button is clicked', () => {
            render(<ExerciseCard {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Collapse exercise' }));

            expect(defaultProps.haptic.tick).toHaveBeenCalled();
            expect(defaultProps.onToggleCollapse).toHaveBeenCalledWith('bench_press');
        });

        it('should show Complete All button when multiple sets remain', () => {
            render(<ExerciseCard {...defaultProps} />);

            expect(screen.getByRole('button', { name: 'Complete all sets' })).toBeInTheDocument();
        });

        it('should call onCompleteAllSets when Complete All button is clicked', () => {
            render(<ExerciseCard {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'Complete all sets' }));

            expect(defaultProps.onCompleteAllSets).toHaveBeenCalledWith('bench_press', 3);
        });

        it('should hide Complete All button when only 1 set remains', () => {
            render(
                <ExerciseCard
                    {...defaultProps}
                    sets={[true, true, false]}
                    exerciseLog={{ sets: [true, true, false], weight: '', rpe: {} }}
                />
            );

            expect(screen.queryByRole('button', { name: 'Complete all sets' })).not.toBeInTheDocument();
        });
    });

    // Rest Timer tests removed - rest timer UI moved to FloatingTimer bar

    // EMOM Timer tests removed - EMOM timer UI now controlled via FloatingTimer bar

    describe('Weight Input', () => {
        it('should show weight input for non-bodyweight exercises', () => {
            render(<ExerciseCard {...defaultProps} />);

            expect(screen.getByLabelText('Decrease weight by 2.5kg')).toBeInTheDocument();
            expect(screen.getByRole('spinbutton')).toBeInTheDocument();
            expect(screen.getByLabelText('Increase weight by 2.5kg')).toBeInTheDocument();
        });

        it('should hide weight input for bodyweight exercises', () => {
            render(<ExerciseCard {...defaultProps} isBodyweight={true} />);

            expect(screen.queryByLabelText('Decrease weight by 2.5kg')).not.toBeInTheDocument();
        });

        it('should call onSaveWeight when weight is changed', () => {
            render(<ExerciseCard {...defaultProps} />);

            const input = screen.getByRole('spinbutton');
            fireEvent.change(input, { target: { value: '60' } });

            expect(defaultProps.onSaveWeight).toHaveBeenCalledWith('bench_press', '60');
        });

        it('should decrease weight when minus button is clicked', () => {
            render(
                <ExerciseCard
                    {...defaultProps}
                    exerciseLog={{ sets: [false, false, false], weight: '50', rpe: {} }}
                />
            );

            fireEvent.click(screen.getByLabelText('Decrease weight by 2.5kg'));

            expect(defaultProps.haptic.tick).toHaveBeenCalled();
            expect(defaultProps.onSaveWeight).toHaveBeenCalledWith('bench_press', '47.5');
        });

        it('should increase weight when plus button is clicked', () => {
            render(
                <ExerciseCard
                    {...defaultProps}
                    exerciseLog={{ sets: [false, false, false], weight: '50', rpe: {} }}
                />
            );

            fireEvent.click(screen.getByLabelText('Increase weight by 2.5kg'));

            expect(defaultProps.haptic.tick).toHaveBeenCalled();
            expect(defaultProps.onSaveWeight).toHaveBeenCalledWith('bench_press', '52.5');
        });

        it('should show suggested load when loadRange is provided', () => {
            render(
                <ExerciseCard
                    {...defaultProps}
                    loadRange={{ min: 40, max: 60, unit: 'kg', raw: '40-60kg' }}
                />
            );

            expect(screen.getByText('Suggested: 40-60kg')).toBeInTheDocument();
        });
    });

    describe('Alternatives', () => {
        it('should show alternatives button when alternatives exist', () => {
            render(
                <ExerciseCard
                    {...defaultProps}
                    alternatives={['Dumbbell Press', 'Push-Ups']}
                />
            );

            expect(screen.getByRole('button', { name: 'Swap to alternative exercise' })).toBeInTheDocument();
        });

        it('should call onShowAlternatives when alternatives button is clicked', () => {
            render(
                <ExerciseCard
                    {...defaultProps}
                    alternatives={['Dumbbell Press', 'Push-Ups']}
                />
            );

            fireEvent.click(screen.getByRole('button', { name: 'Swap to alternative exercise' }));

            expect(defaultProps.haptic.tick).toHaveBeenCalled();
            expect(defaultProps.onShowAlternatives).toHaveBeenCalledWith(
                'Bench Press',
                ['Dumbbell Press', 'Push-Ups']
            );
        });
    });

    describe('RPE Selector', () => {
        it('should show RPE selector when rpePrompt matches exercise', () => {
            render(
                <ExerciseCard
                    {...defaultProps}
                    rpePrompt={{ exerciseId: 'bench_press', setIndex: 0 }}
                />
            );

            expect(screen.getByTestId('rpe-selector')).toBeInTheDocument();
        });

        it('should not show RPE selector for different exercise', () => {
            render(
                <ExerciseCard
                    {...defaultProps}
                    rpePrompt={{ exerciseId: 'squats', setIndex: 0 }}
                />
            );

            expect(screen.queryByTestId('rpe-selector')).not.toBeInTheDocument();
        });
    });

    describe('Exercise History', () => {
        it('should make name clickable when history exists', () => {
            render(<ExerciseCard {...defaultProps} hasHistory={true} />);

            const nameButton = screen.getByRole('button', { name: 'View details and history for Bench Press' });
            expect(nameButton).toBeInTheDocument();
        });

        it('should call onShowHistory when name is clicked with history', () => {
            render(<ExerciseCard {...defaultProps} hasHistory={true} />);

            fireEvent.click(screen.getByRole('button', { name: 'View details and history for Bench Press' }));

            expect(defaultProps.haptic.tick).toHaveBeenCalled();
            expect(defaultProps.onShowHistory).toHaveBeenCalledWith(
                expect.objectContaining({
                    displayName: 'Bench Press',
                    historyLookupName: 'Bench Press',
                    originalName: 'Bench Press',
                    isSwapped: false,
                })
            );
        });

        it('should include notes in detail metadata when requesting history', () => {
            render(<ExerciseCard {...defaultProps} hasHistory={true} notes="Keep elbows tucked" restTime={90} />);

            fireEvent.click(screen.getByRole('button', { name: 'View details and history for Bench Press' }));

            expect(defaultProps.onShowHistory).toHaveBeenCalledWith(
                expect.objectContaining({
                    metadata: expect.objectContaining({
                        notes: 'Keep elbows tucked',
                        prescription: '3x8 reps',
                        restTime: 90,
                    }),
                })
            );
        });
    });

    describe('Visual States', () => {
        it('should highlight first incomplete exercise', () => {
            const { container } = render(
                <ExerciseCard {...defaultProps} isFirstIncomplete={true} />
            );

            // Should have primary ring when first incomplete
            const card = container.querySelector('.ring-sys-primary\\/50');
            expect(card).toBeInTheDocument();
        });

        it('should show success styling when all sets completed', () => {
            const { container } = render(
                <ExerciseCard
                    {...defaultProps}
                    sets={[true, true, true]}
                    exerciseLog={{ sets: [true, true, true], weight: '', rpe: {} }}
                />
            );

            const card = container.querySelector('.border-sys-success\\/10');
            expect(card).toBeInTheDocument();
        });
    });
});
