import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionBar } from '../components/ActionBar';

vi.mock('../hooks', () => ({
  useHaptic: () => ({
    tick: vi.fn(),
    bump: vi.fn(),
    timer: vi.fn(),
  }),
}));

describe('ActionBar density timer controls', () => {
  it('should add 30 seconds from bottom bar control', () => {
    let seconds = 600;

    const setDensitySeconds = vi.fn((updater: number | ((s: number) => number)) => {
      if (typeof updater === 'function') {
        seconds = updater(seconds);
      } else {
        seconds = updater;
      }
    });

    render(
      <ActionBar
        timerState={{ time: 0, active: false }}
        setTimerActive={() => {}}
        setTimerSeconds={() => {}}
        densityState={{ active: true, seconds, timeMinutes: 10 }}
        setDensityActive={() => {}}
        setDensitySeconds={setDensitySeconds}
      />
    );

    fireEvent.click(screen.getByLabelText('Add 30 seconds to density timer'));

    expect(setDensitySeconds).toHaveBeenCalled();
    expect(seconds).toBe(630);
  });

  it('should show rep controls and allow counting reps', () => {
    const onUpdateRepChunks = vi.fn();
    const densityRepControls = {
      targetReps: 50,
      repChunks: [5, 5],
      isComplete: false,
      onUpdateRepChunks,
      onMarkComplete: vi.fn(),
    };

    render(
      <ActionBar
        timerState={{ time: 0, active: false }}
        setTimerActive={() => {}}
        setTimerSeconds={() => {}}
        densityState={{ active: true, seconds: 300, timeMinutes: 10 }}
        setDensityActive={() => {}}
        setDensitySeconds={() => {}}
        densityRepControls={densityRepControls}
      />
    );

    // Verify current rep count is shown
    expect(screen.getByText('10')).toBeInTheDocument(); // 5+5
    expect(screen.getByText('/ 50')).toBeInTheDocument();

    // Click on +5 reps
    const add5Btn = screen.getByText('+5');
    fireEvent.click(add5Btn);

    expect(onUpdateRepChunks).toHaveBeenCalledWith([5, 5, 5]);

    // Click on Undo
    const undoBtn = screen.getByText('Undo');
    fireEvent.click(undoBtn);

    expect(onUpdateRepChunks).toHaveBeenCalledWith([5]);
  });
});
