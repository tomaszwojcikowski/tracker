import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetRow } from '../components/SetRow';

const baseProps = {
    setNumber: 1,
    completed: false,
    isCurrent: true,
    showWeight: true,
    onToggleComplete: vi.fn(),
    onChangeWeight: vi.fn(),
    onChangeReps: vi.fn(),
};

describe('SetRow', () => {
    it('renders set number', () => {
        render(<SetRow {...baseProps} />);
        expect(screen.getByTestId('set-row')).toHaveAttribute('data-set-number', '1');
    });

    it('marks current row when isCurrent', () => {
        render(<SetRow {...baseProps} isCurrent />);
        expect(screen.getByTestId('set-row')).toHaveAttribute('data-current', 'true');
    });

    it('marks completed row when completed', () => {
        const { container } = render(<SetRow {...baseProps} completed isCurrent={false} />);
        expect(container.querySelector('[data-completed="true"]')).toBeTruthy();
    });

    it('hides weight column when showWeight=false', () => {
        render(<SetRow {...baseProps} showWeight={false} />);
        expect(screen.queryByLabelText(/weight/i)).toBeNull();
    });

    it('fires onChangeWeight when weight input changes', () => {
        const onChangeWeight = vi.fn();
        render(<SetRow {...baseProps} weight="50" onChangeWeight={onChangeWeight} />);
        const inputs = screen.getAllByRole('spinbutton');
        fireEvent.change(inputs[0], { target: { value: '52.5' } });
        expect(onChangeWeight).toHaveBeenCalledWith('52.5');
    });

    it('fires onChangeReps with parsed number', () => {
        const onChangeReps = vi.fn();
        render(<SetRow {...baseProps} reps={8} onChangeReps={onChangeReps} />);
        const inputs = screen.getAllByRole('spinbutton');
        // weight input first when showWeight, reps second
        fireEvent.change(inputs[1], { target: { value: '10' } });
        expect(onChangeReps).toHaveBeenCalledWith(10);
    });

    it('fires onChangeReps with undefined for empty input', () => {
        const onChangeReps = vi.fn();
        render(<SetRow {...baseProps} reps={8} onChangeReps={onChangeReps} />);
        const inputs = screen.getAllByRole('spinbutton');
        fireEvent.change(inputs[1], { target: { value: '' } });
        expect(onChangeReps).toHaveBeenCalledWith(undefined);
    });

    it('fires onToggleComplete when checkmark is clicked', () => {
        const onToggleComplete = vi.fn();
        render(<SetRow {...baseProps} onToggleComplete={onToggleComplete} />);
        const checkButton = screen.getByRole('button', { name: /mark set/i });
        fireEvent.click(checkButton);
        expect(onToggleComplete).toHaveBeenCalled();
    });
});
