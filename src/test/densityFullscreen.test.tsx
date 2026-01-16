import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExerciseCard } from '../components/ExerciseCard';
import { CompactExerciseRow } from '../components/CompactExerciseRow';

// Mock Lucide icons
vi.mock('../components/icons', () => ({
    Gauge: () => <span data-testid="icon-gauge">Gauge</span>,
    Maximize2: () => <span data-testid="icon-maximize">Maximize</span>,
    ChevronDown: () => <span>▼</span>,
    ChevronUp: () => <span>▲</span>,
    Check: () => <span>✓</span>,
    Plus: () => <span>+</span>,
    Minus: () => <span>-</span>,
    Zap: () => <span>⚡</span>,
    Timer: () => <span>⏱</span>,
    Clock: () => <span>🕒</span>,
    Dumbbell: () => <span>🏋️</span>,
    History: () => <span>H</span>,
    Settings: () => <span>S</span>,
    Info: () => <span>i</span>,
    TrendingUp: () => <span>📈</span>,
    BarChart2: () => <span>📊</span>,
    ArrowRightLeft: () => <span>⇄</span>,
}));

describe('Density Timer Fullscreen Features', () => {
    const defaultExerciseCardProps = {
        exId: 'bench_press',
        name: 'Bench Press',
        effectiveName: 'Bench Press',
        prescription: '3x8 reps',
        sets: [false, false, false],
        defaultSets: 3,
        exerciseLog: { sets: [false, false, false] },
        onToggleCollapse: vi.fn(),
        onToggleSet: vi.fn(),
        onAddSet: vi.fn(),
        onSaveWeight: vi.fn(),
        onSaveRPE: vi.fn(),
        onClearRPEPrompt: vi.fn(),
        onStartRestTimer: vi.fn(),
        onToggleEmomTimer: vi.fn(),
        onToggleDensityTimer: vi.fn(),
        onToggleFlowTimer: vi.fn(),
        onShowHistory: vi.fn(),
        onShowAlternatives: vi.fn(),
        onExpandDensity: vi.fn(),
        isDensity: true,
        densityTimeMinutes: 10,
        densityRepsTotal: 50,
        onUpdateDensityRepChunks: vi.fn(),
        onMarkDensityComplete: vi.fn(),
        haptic: { tick: vi.fn(), bump: vi.fn(), success: vi.fn() },
    };

    const defaultCompactRowProps = {
        exId: 'bench_press',
        name: 'Bench Press',
        sets: [false, false, false],
        weight: '60',
        onToggleSet: vi.fn(),
        onWeightChange: vi.fn(),
        onShowHistory: vi.fn(),
        onStartRestTimer: vi.fn(),
        onToggleDensityTimer: vi.fn(),
        onExpandDensity: vi.fn(),
        onUpdateDensityRepChunks: vi.fn(),
        onMarkDensityComplete: vi.fn(),
        isDensity: true,
        densityTimeMinutes: 10,
        sectionType: 'main' as const,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('ExerciseCard', () => {
        it('should show Maximize button when density timer is active', () => {
            render(<ExerciseCard {...defaultExerciseCardProps} densityTimerActive={true} />);

            const maximizeBtn = screen.getByLabelText('Expand layout');
            expect(maximizeBtn).toBeInTheDocument();

            fireEvent.click(maximizeBtn);
            expect(defaultExerciseCardProps.onExpandDensity).toHaveBeenCalled();
        });

        it('should NOT show Maximize button when density timer is inactive', () => {
            render(<ExerciseCard {...defaultExerciseCardProps} densityTimerActive={false} />);

            expect(screen.queryByLabelText('Expand layout')).not.toBeInTheDocument();
        });

        it('should show Maximize button in focus view (focusTimerButton)', () => {
            render(
                <ExerciseCard
                    {...defaultExerciseCardProps}
                    densityTimerActive={true}
                    hideCollapseButton={true}
                    hideTimerControls={true}
                />
            );

            const maximizeBtn = screen.getByLabelText('Expand density timer');
            expect(maximizeBtn).toBeInTheDocument();

            fireEvent.click(maximizeBtn);
            expect(defaultExerciseCardProps.onExpandDensity).toHaveBeenCalled();
        });
    });

    describe('CompactExerciseRow', () => {
        it('should show Maximize button when expanded and density timer is active', () => {
            render(
                <CompactExerciseRow
                    {...defaultCompactRowProps}
                    densityTimerActive={true}
                    isFirstIncomplete={true} // to ensure it starts expanded
                />
            );

            // Should be two buttons (one for collapsed view, one for expanded view based on my implementation)
            // Actually I added it twice: once for the main row, once for the details area
            const maximizeBtns = screen.getAllByLabelText('Expand density timer');
            expect(maximizeBtns.length).toBeGreaterThan(0);

            fireEvent.click(maximizeBtns[0]);
            expect(defaultCompactRowProps.onExpandDensity).toHaveBeenCalled();
        });
    });
});
