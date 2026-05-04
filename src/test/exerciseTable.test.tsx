import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseTable } from '../components/ExerciseTable';
import { getExerciseHistory } from '../utils/exerciseHistory';
import type { ExerciseLogEntry } from '../types/workout';

vi.mock('../utils/exerciseHistory', () => ({
    getExerciseHistory: vi.fn(() => []),
}));

const baseLog: ExerciseLogEntry = {
    sets: [false, false, false],
    weight: '50',
    rpe: {},
};

const baseHaptic = {
    tick: vi.fn(),
    bump: vi.fn(),
    success: vi.fn(),
};

const renderTable = (overrides: Partial<React.ComponentProps<typeof ExerciseTable>> = {}) => {
    const defaults: React.ComponentProps<typeof ExerciseTable> = {
        exId: 'bench_press',
        effectiveName: 'Bench Press',
        sets: [false, false, false],
        defaultSets: 3,
        exerciseLog: baseLog,
        prescription: '3x8 reps',
        haptic: baseHaptic,
        onToggleSet: vi.fn(),
        onSaveSetWeight: vi.fn(),
        onSaveSetReps: vi.fn(),
        onSaveRPE: vi.fn(),
    };
    return render(<ExerciseTable {...defaults} {...overrides} />);
};

describe('ExerciseTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getExerciseHistory).mockReturnValue([]);
    });

    it('renders one row per set', () => {
        renderTable();
        expect(screen.getAllByTestId('set-row')).toHaveLength(3);
    });

    it('renders the header row with Previous, Kg, Reps', () => {
        const { container } = renderTable();
        const table = container.querySelector('[data-testid="exercise-table"]');
        expect(table?.textContent).toContain('Previous');
        expect(table?.textContent).toContain('Kg');
        expect(table?.textContent).toContain('Reps');
    });

    it('marks first incomplete row as current', () => {
        renderTable({ sets: [true, false, false] });
        const rows = screen.getAllByTestId('set-row');
        expect(rows[0]).toHaveAttribute('data-completed', 'true');
        expect(rows[1]).toHaveAttribute('data-current', 'true');
    });

    it('hides weight column for bodyweight exercise', () => {
        renderTable({ isBodyweight: true });
        const headers = screen.getByTestId('exercise-table');
        expect(headers.textContent).not.toContain('Kg');
    });

    it('fires onSaveSetWeight when weight input changes', () => {
        const onSaveSetWeight = vi.fn();
        renderTable({ onSaveSetWeight });
        const inputs = screen.getAllByRole('spinbutton');
        fireEvent.change(inputs[0], { target: { value: '52.5' } });
        expect(onSaveSetWeight).toHaveBeenCalledWith('bench_press', 0, '52.5', 3);
    });

    it('fires onToggleSet when checkmark clicked', () => {
        const onToggleSet = vi.fn();
        renderTable({ onToggleSet });
        const checkButtons = screen.getAllByRole('button', { name: /mark set/i });
        fireEvent.click(checkButtons[0]);
        expect(onToggleSet).toHaveBeenCalledWith('bench_press', 0, 3, undefined, undefined, undefined);
        expect(baseHaptic.success).toHaveBeenCalled();
    });

    it('uses per-set weight override when present', () => {
        const log: ExerciseLogEntry = {
            ...baseLog,
            setWeights: ['60', undefined, '70'],
        };
        renderTable({ exerciseLog: log });
        const inputs = screen.getAllByRole('spinbutton');
        // Weight inputs are at even positions (0,2,4) when both weight+reps shown
        expect((inputs[0] as HTMLInputElement).value).toBe('60');
        // Set 2 falls back to log.weight = '50'
        expect((inputs[2] as HTMLInputElement).value).toBe('50');
        // Set 3 uses override
        expect((inputs[4] as HTMLInputElement).value).toBe('70');
    });

    it('fills row weights from previous history when current weight is empty', () => {
        vi.mocked(getExerciseHistory).mockReturnValue([
            {
                date: '2026-05-03',
                week: 1,
                day: 1,
                prescription: '3x8 reps',
                sets: 3,
                weight: 65,
                rpe: {},
            },
        ]);

        const log: ExerciseLogEntry = {
            ...baseLog,
            weight: '',
            setWeights: [undefined, undefined, undefined],
        };

        renderTable({ exerciseLog: log });
        const inputs = screen.getAllByRole('spinbutton');
        expect((inputs[0] as HTMLInputElement).value).toBe('65');
        expect((inputs[2] as HTMLInputElement).value).toBe('65');
        expect((inputs[4] as HTMLInputElement).value).toBe('65');
    });

    it('shows previous column using the latest history entry with a weight', () => {
        vi.mocked(getExerciseHistory).mockReturnValue([
            {
                date: '2026-05-01',
                week: 1,
                day: 1,
                prescription: '3x8 reps',
                sets: 3,
                weight: 62.5,
                rpe: {},
            },
            {
                date: '2026-05-03',
                week: 1,
                day: 3,
                prescription: '3x8 reps',
                sets: 3,
                rpe: {},
            },
        ]);

        renderTable({ exerciseLog: { ...baseLog, weight: '' } });
        expect(screen.getAllByText('62.5kg')).toHaveLength(3);
    });
});
