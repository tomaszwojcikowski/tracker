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
});
