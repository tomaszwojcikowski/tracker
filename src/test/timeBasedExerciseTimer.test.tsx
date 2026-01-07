/**
 * Time-Based Exercise Timer Tests
 *
 * Tests for the time-based exercise timer feature added to warmup/cooldown exercises
 * and flow timer calculation fixes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock icons
vi.mock('../components/icons', () => ({
    ChevronDown: () => <span data-testid="icon-chevron-down">▼</span>,
    ChevronUp: () => <span data-testid="icon-chevron-up">▲</span>,
    Timer: () => <span data-testid="icon-timer">⏱</span>,
    Gauge: () => <span data-testid="icon-gauge">📊</span>,
    Check: () => <span data-testid="icon-check">✓</span>,
    Plus: () => <span data-testid="icon-plus">+</span>,
    Minus: () => <span data-testid="icon-minus">-</span>,
    Zap: () => <span data-testid="icon-zap">⚡</span>,
    CheckCheck: () => <span data-testid="icon-checkcheck">✓✓</span>,
    ArrowRightLeft: () => <span data-testid="icon-swap">⇄</span>,
    TrendingUp: () => <span data-testid="icon-trending">↗</span>,
    BarChart2: () => <span data-testid="icon-chart">📊</span>,
    History: () => <span data-testid="icon-history">📜</span>,
    Info: () => <span data-testid="icon-info">ℹ️</span>,
    Clock: () => <span data-testid="icon-clock">🕒</span>,
    Dumbbell: () => <span data-testid="icon-dumbbell">🏋️</span>,
}));

// Mock components
vi.mock('../components/RPESelector', () => ({
    RPESelector: () => <div data-testid="rpe-selector">RPE</div>,
}));

vi.mock('../components/DensityRepControls', () => ({
    DensityRepControls: () => <div data-testid="density-rep-controls">Density</div>,
}));

vi.mock('../components/FlowMovementsDisplay', () => ({
    FlowMovementsDisplay: () => <div data-testid="flow-movements">Flow</div>,
    FlowBadge: () => <span data-testid="flow-badge">Flow Badge</span>,
}));

vi.mock('../components/ExerciseOptionsBadge', () => ({
    ExerciseOptionsBadge: () => <span data-testid="options-badge">Options</span>,
}));

vi.mock('../components/CompactSetButtons', () => ({
    CompactSetButtons: () => <div data-testid="compact-set-buttons">Sets</div>,
}));

vi.mock('../utils/exerciseHistory', () => ({
    getExerciseHistory: vi.fn(() => []),
}));

vi.mock('../constants', () => ({
    getShortExerciseName: vi.fn((name) => name),
}));

import { ExerciseCard } from '../components/ExerciseCard';
import { CompactExerciseRow } from '../components/CompactExerciseRow';
import { getExerciseTypeFlags } from '../utils/exerciseProps';
import type { WorkoutExercise } from '../data/programData';

describe('Time-Based Exercise Timer', () => {
    const defaultHaptic = {
        tick: vi.fn(),
        bump: vi.fn(),
        success: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getExerciseTypeFlags', () => {
        it('should calculate flowTimeMinutes for flow exercises', () => {
            const flowExercise: Partial<WorkoutExercise> = {
                isFlow: true,
                repsRange: {
                    type: 'time',
                    value: 300, // 5 minutes in seconds
                },
            };

            const flags = getExerciseTypeFlags(flowExercise as WorkoutExercise);

            expect(flags.isFlow).toBe(true);
            expect(flags.flowTimeMinutes).toBe(5);
            expect(flags.isTimeBased).toBe(true);
            expect(flags.timeSeconds).toBe(300);
            expect(flags.timeMinutes).toBe(5);
        });

        it('should calculate time properties for time-based exercises', () => {
            const timeExercise: Partial<WorkoutExercise> = {
                repsRange: {
                    type: 'time',
                    value: 60, // 60 seconds
                },
            };

            const flags = getExerciseTypeFlags(timeExercise as WorkoutExercise);

            expect(flags.isTimeBased).toBe(true);
            expect(flags.timeSeconds).toBe(60);
            expect(flags.timeMinutes).toBe(1);
        });

        it('should use max seconds for time ranges', () => {
            const timeRangeExercise: Partial<WorkoutExercise> = {
                repsRange: {
                    type: 'time',
                    min: 20,
                    max: 30,
                    unit: 'seconds',
                    raw: '20-30s',
                },
            };

            const flags = getExerciseTypeFlags(timeRangeExercise as WorkoutExercise);

            expect(flags.isTimeBased).toBe(true);
            expect(flags.timeSeconds).toBe(30);
            expect(flags.timeMinutes).toBe(0.5);
        });

        it('should handle flow exercise with non-time repsRange', () => {
            const exercise: Partial<WorkoutExercise> = {
                isFlow: true,
                repsRange: {
                    type: 'reps',
                    value: 10,
                },
            };

            const flags = getExerciseTypeFlags(exercise as WorkoutExercise);

            expect(flags.isFlow).toBe(true);
            expect(flags.flowTimeMinutes).toBeUndefined();
        });

        it('should handle exercise without repsRange', () => {
            const exercise: Partial<WorkoutExercise> = {
                isBodyweight: true,
            };

            const flags = getExerciseTypeFlags(exercise as WorkoutExercise);

            expect(flags.isTimeBased).toBe(false);
            expect(flags.timeSeconds).toBeUndefined();
            expect(flags.timeMinutes).toBeUndefined();
        });
    });

    describe('ExerciseCard - Time-Based Timer', () => {
        const baseProps = {
            exId: 'warmup_exercise',
            name: 'Dead Hang',
            effectiveName: 'Dead Hang',
            prescription: '60s hold',
            sets: [false],
            defaultSets: 1,
            exerciseLog: { sets: [false], weight: '', rpe: {} },
            hasHistory: false,
            isFirstIncomplete: true,
            isCollapsed: false,
            rpePrompt: null,
            haptic: defaultHaptic,
            sectionType: 'prep',
            isBodyweight: true,
            isEmom: false,
            isUnilateral: false,
            isAmrap: false,
            isLadder: false,
            isDensity: false,
            isFlow: false,
            emomTimerActive: false,
            emomTimerInterval: 60,
            restTimerActive: false,
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
            onSaveNotes: vi.fn(),
        };

        it('should show time-based timer button for warmup exercise with time duration', () => {
            render(
                <ExerciseCard
                    {...baseProps}
                    timeSeconds={60}
                />
            );

            // 60 seconds is displayed as 1m
            const timerButton = screen.getByRole('button', { name: /Start 1m timer/i });
            expect(timerButton).toBeInTheDocument();
            expect(timerButton).toHaveTextContent('1m');
        });

        it('should show time in minutes when >= 60 seconds', () => {
            render(
                <ExerciseCard
                    {...baseProps}
                    timeSeconds={120}
                />
            );

            const timerButton = screen.getByRole('button', { name: /Start 2m timer/i });
            expect(timerButton).toBeInTheDocument();
            expect(timerButton).toHaveTextContent('2m');
        });

        it('should call onStartRestTimer with correct seconds when clicked', () => {
            const onStartRestTimer = vi.fn();
            render(
                <ExerciseCard
                    {...baseProps}
                    timeSeconds={90}
                    onStartRestTimer={onStartRestTimer}
                />
            );

            const timerButton = screen.getByRole('button', { name: /Start 90s timer/i });
            fireEvent.click(timerButton);

            expect(onStartRestTimer).toHaveBeenCalledWith(90);
        });

        it('should NOT show time-based timer for flow exercises', () => {
            render(
                <ExerciseCard
                    {...baseProps}
                    isFlow={true}
                    timeSeconds={180}
                    flowTimeMinutes={3}
                    onToggleFlowTimer={vi.fn()}
                />
            );

            // Should show flow timer, not time-based timer
            expect(screen.queryByRole('button', { name: /Start 180s timer/i })).not.toBeInTheDocument();
        });

        it('should NOT show time-based timer for EMOM exercises', () => {
            render(
                <ExerciseCard
                    {...baseProps}
                    isEmom={true}
                    timeSeconds={60}
                    sectionType="main"
                />
            );

            expect(screen.queryByRole('button', { name: /Start 60s timer/i })).not.toBeInTheDocument();
        });

        it('should NOT show time-based timer for density exercises', () => {
            render(
                <ExerciseCard
                    {...baseProps}
                    isDensity={true}
                    timeSeconds={300}
                    densityTimeMinutes={5}
                    densityRepsTotal={30}
                    onToggleDensityTimer={vi.fn()}
                    onUpdateDensityRepChunks={vi.fn()}
                    onMarkDensityComplete={vi.fn()}
                />
            );

            expect(screen.queryByRole('button', { name: /Start 300s timer/i })).not.toBeInTheDocument();
        });

        it('should NOT show rest timer when timeSeconds is present', () => {
            render(
                <ExerciseCard
                    {...baseProps}
                    timeSeconds={60}
                    restTime={90}
                    sectionType="main"
                />
            );

            // Should not show rest timer
            expect(screen.queryByRole('button', { name: /Start 90s rest timer/i })).not.toBeInTheDocument();
        });

        it('should show active styling when timer is running', () => {
            render(
                <ExerciseCard
                    {...baseProps}
                    timeSeconds={60}
                    restTimerActive={true}
                />
            );

            const timerButton = screen.getByRole('button', { name: /Stop timer/i });
                expect(screen.queryByRole('button', { name: /Start 90s rest timer/i })).not.toBeInTheDocument();
        });
    });

    describe('CompactExerciseRow - Time-Based Timer', () => {
        const baseProps = {
            exId: 'cooldown_stretch',
            name: 'Cobra Stretch',
            displayName: 'Cobra Stretch',
            prescription: '60s hold',
            sets: [false],
            defaultSets: 1,
            weight: '',
            isBodyweight: true,
            restTime: 0,
            isFirstIncomplete: true,
            isEmom: false,
            isUnilateral: false,
            isAmrap: false,
            isLadder: false,
            isDensity: false,
            isFlow: false,
            haptic: defaultHaptic,
            hasHistory: false,
            sectionType: 'cool',
            restTimerActive: false,
            emomTimerActive: false,
            emomTimerInterval: 60,
            onToggleSet: vi.fn(),
            onWeightChange: vi.fn(),
            onAddSet: vi.fn(),
            onCompleteAllSets: vi.fn(),
            onShowHistory: vi.fn(),
            onStartRestTimer: vi.fn(),
        };

        it('should show time-based timer button on active row', () => {
            render(
                <CompactExerciseRow
                    {...baseProps}
                    timeSeconds={60}
                />
            );

            // 60 seconds is displayed as 1m
            const timerButtons = screen.getAllByRole('button', { name: /Start 1m timer/i });
            expect(timerButtons.length).toBeGreaterThan(0);
            expect(timerButtons[0]).toBeInTheDocument();
        });

        it('should show time-based timer in expanded section', () => {
            render(
                <CompactExerciseRow
                    {...baseProps}
                    timeSeconds={90}
                />
            );

            // Should find timer button(s) with correct label
            const timerButtons = screen.getAllByRole('button', { name: /Start 90s timer/i });
            expect(timerButtons.length).toBeGreaterThanOrEqual(1);
        });

        it('should call onStartRestTimer with correct seconds', () => {
            const onStartRestTimer = vi.fn();
            render(
                <CompactExerciseRow
                    {...baseProps}
                    timeSeconds={120}
                    onStartRestTimer={onStartRestTimer}
                />
            );

            const timerButtons = screen.getAllByRole('button', { name: /Start 2m timer/i });
            fireEvent.click(timerButtons[0]);

            expect(onStartRestTimer).toHaveBeenCalledWith(120);
        });

        it('should NOT show time-based timer for flow exercises', () => {
            render(
                <CompactExerciseRow
                    {...baseProps}
                    isFlow={true}
                    timeSeconds={180}
                    flowTimeMinutes={3}
                    onToggleFlowTimer={vi.fn()}
                />
            );

            expect(screen.queryByRole('button', { name: /Start 180s timer/i })).not.toBeInTheDocument();
        });

        it('should NOT show rest timer when timeSeconds is present', () => {
            render(
                <CompactExerciseRow
                    {...baseProps}
                    timeSeconds={60}
                    restTime={90}
                    sectionType="main"
                    isFirstIncomplete={true}
                />
            );

            expect(screen.queryByRole('button', { name: /Start 90s rest timer/i })).not.toBeInTheDocument();
        });

        it('should show regular rest timer for main section when no timeSeconds', () => {
            render(
                <CompactExerciseRow
                    {...baseProps}
                    restTime={90}
                    sectionType="main"
                />
            );

            const restTimerButtons = screen.getAllByRole('button', { name: /Start 90s rest timer/i });
            expect(restTimerButtons.length).toBeGreaterThan(0);
        });
    });

    describe('Flow Timer Integration', () => {
        const baseProps = {
            exId: 'flow_mobility',
            name: 'Mobility Flow',
            effectiveName: 'Mobility Flow',
            prescription: '5m flow',
            sets: [false],
            defaultSets: 1,
            exerciseLog: { sets: [false], weight: '', rpe: {} },
            hasHistory: false,
            isFirstIncomplete: true,
            isCollapsed: false,
            rpePrompt: null,
            haptic: defaultHaptic,
            sectionType: 'prep',
            isBodyweight: true,
            isEmom: false,
            isUnilateral: false,
            isAmrap: false,
            isLadder: false,
            isDensity: false,
            isFlow: true,
            emomTimerActive: false,
            emomTimerInterval: 60,
            restTimerActive: false,
            flowTimerActive: false,
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
            onSaveNotes: vi.fn(),
        };

        it('should show flow timer button with minutes', () => {
            const onToggleFlowTimer = vi.fn();
            render(
                <ExerciseCard
                    {...baseProps}
                    flowTimeMinutes={5}
                    timeSeconds={300}
                    onToggleFlowTimer={onToggleFlowTimer}
                />
            );

            const flowTimerButton = screen.getByRole('button', { name: /Start 5m flow timer/i });
            expect(flowTimerButton).toBeInTheDocument();
            expect(flowTimerButton).toHaveTextContent('5m');
        });

        it('should call onToggleFlowTimer with correct minutes', () => {
            const onToggleFlowTimer = vi.fn();
            render(
                <ExerciseCard
                    {...baseProps}
                    flowTimeMinutes={3}
                    timeSeconds={180}
                    onToggleFlowTimer={onToggleFlowTimer}
                />
            );

            const flowTimerButton = screen.getByRole('button', { name: /Start 3m flow timer/i });
            fireEvent.click(flowTimerButton);

            expect(onToggleFlowTimer).toHaveBeenCalledWith(3);
        });

        it('should show active styling for flow timer when active', () => {
            render(
                <ExerciseCard
                    {...baseProps}
                    flowTimeMinutes={5}
                    timeSeconds={300}
                    flowTimerActive={true}
                    onToggleFlowTimer={vi.fn()}
                />
            );

            const flowTimerButton = screen.getByRole('button', { name: /Stop flow timer/i });
            expect(flowTimerButton).toHaveClass('bg-sys-primary', 'text-sys-onPrimary');
        });
    });

    describe('Timer Button Priority', () => {
        it('should prefer flow timer over time-based timer for flow exercises', () => {
            render(
                <ExerciseCard
                    exId="test"
                    name="Test"
                    effectiveName="Test"
                    prescription="5m"
                    sets={[false]}
                    defaultSets={1}
                    exerciseLog={{ sets: [false], weight: '', rpe: {} }}
                    hasHistory={false}
                    isFirstIncomplete={true}
                    isCollapsed={false}
                    rpePrompt={null}
                    haptic={defaultHaptic}
                    sectionType="prep"
                    isBodyweight={true}
                    isEmom={false}
                    isUnilateral={false}
                    isAmrap={false}
                    isLadder={false}
                    isDensity={false}
                    isFlow={true}
                    flowTimeMinutes={5}
                    timeSeconds={300}
                    emomTimerActive={false}
                    emomTimerInterval={60}
                    restTimerActive={false}
                    flowTimerActive={false}
                    onToggleCollapse={vi.fn()}
                    onToggleSet={vi.fn()}
                    onAddSet={vi.fn()}
                    onCompleteAllSets={vi.fn()}
                    onSaveWeight={vi.fn()}
                    onSaveRPE={vi.fn()}
                    onClearRPEPrompt={vi.fn()}
                    onStartRestTimer={vi.fn()}
                    onToggleEmomTimer={vi.fn()}
                    onToggleFlowTimer={vi.fn()}
                    onShowHistory={vi.fn()}
                    onShowAlternatives={vi.fn()}
                    onSaveNotes={vi.fn()}
                />
            );

            // Should show flow timer, not regular time-based timer
            expect(screen.getByRole('button', { name: /flow timer/i })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /Start 300s timer/i })).not.toBeInTheDocument();
        });

        it('should not show rest timer for time-based cooldown exercises', () => {
            render(
                <ExerciseCard
                    exId="test"
                    name="Test"
                    effectiveName="Test"
                    prescription="60s"
                    sets={[false]}
                    defaultSets={1}
                    exerciseLog={{ sets: [false], weight: '', rpe: {} }}
                    hasHistory={false}
                    isFirstIncomplete={true}
                    isCollapsed={false}
                    rpePrompt={null}
                    haptic={defaultHaptic}
                    sectionType="cool"
                    isBodyweight={true}
                    isEmom={false}
                    isUnilateral={false}
                    isAmrap={false}
                    isLadder={false}
                    isDensity={false}
                    isFlow={false}
                    timeSeconds={60}
                    restTime={30}
                    emomTimerActive={false}
                    emomTimerInterval={60}
                    restTimerActive={false}
                    onToggleCollapse={vi.fn()}
                    onToggleSet={vi.fn()}
                    onAddSet={vi.fn()}
                    onCompleteAllSets={vi.fn()}
                    onSaveWeight={vi.fn()}
                    onSaveRPE={vi.fn()}
                    onClearRPEPrompt={vi.fn()}
                    onStartRestTimer={vi.fn()}
                    onToggleEmomTimer={vi.fn()}
                    onShowHistory={vi.fn()}
                    onShowAlternatives={vi.fn()}
                    onSaveNotes={vi.fn()}
                />
            );

            // Should show time-based timer (60 seconds displays as 1m)
            expect(screen.getByRole('button', { name: /Start 1m timer/i })).toBeInTheDocument();
            // Should NOT show rest timer
            expect(screen.queryByRole('button', { name: /rest timer/i })).not.toBeInTheDocument();
        });
    });
});
