import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseTable } from '../components/ExerciseTable';
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
    });

    it('renders one row per set', () => {
        renderTable();
        expect(screen.getAllByTestId('set-row')).toHaveLength(3);
    });

    it('renders the header row with Previous, Kg, Reps, RPE', () => {
        const { container } = renderTable();
        const table = container.querySelector('[data-testid="exercise-table"]');
        expect(table?.textContent).toContain('Previous');
        expect(table?.textContent).toContain('Kg');
        expect(table?.textContent).toContain('Reps');
        expect(table?.textContent).toContain('RPE');
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
        expect(onSaveSetWeight).toHaveBeenCalledWith('bench_press', 0, '52.5');
    });

    it('fires onToggleSet when checkmark clicked', () => {
        const onToggleSet = vi.fn();
        renderTable({ onToggleSet });
        const checkButtons = screen.getAllByRole('button', { name: /mark set/i });
        fireEvent.click(checkButtons[0]);
        expect(onToggleSet).toHaveBeenCalledWith('bench_press', 0, 3, undefined, undefined, undefined);
        expect(baseHaptic.success).toHaveBeenCalled();
    });

    it('opens RPE prompt when set is completed without existing RPE', () => {
        const onToggleSet = vi.fn();
        renderTable({ onToggleSet });
        const checkButtons = screen.getAllByRole('button', { name: /mark set/i });
        fireEvent.click(checkButtons[0]);
        // RPE prompt appears (RPESelector showAsPrompt header is "Set N · How hard?")
        expect(screen.getByText(/set 1.+how hard/i)).toBeTruthy();
    });

    it('does not open RPE prompt when RPE is already set', () => {
        const onToggleSet = vi.fn();
        const log: ExerciseLogEntry = { ...baseLog, rpe: { 0: '8' } };
        renderTable({ onToggleSet, exerciseLog: log });
        const checkButtons = screen.getAllByRole('button', { name: /mark set/i });
        fireEvent.click(checkButtons[0]);
        expect(screen.queryByText(/set 1.+how hard/i)).toBeNull();
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
});
