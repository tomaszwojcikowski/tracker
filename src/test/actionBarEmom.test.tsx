import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionBar } from '../components/ActionBar';

vi.mock('../hooks', () => ({
  useHaptic: () => ({
    tick: vi.fn(),
    bump: vi.fn(),
    timer: vi.fn(),
  }),
}));

describe('ActionBar EMOM timer display', () => {
  it('should display total rounds in EMOM timer', () => {
    render(
      <ActionBar
        timerState={{ time: 0, active: false }}
        setTimerActive={() => {}}
        setTimerSeconds={() => {}}
        emomState={{
          active: true,
          seconds: 30,
          interval: 60,
          round: 2,
          totalRounds: 5,
        }}
        setEmomActive={() => {}}
        setEmomSeconds={() => {}}
        setEmomInterval={() => {}}
      />
    );

    expect(screen.getByText('Round 2/5')).toBeInTheDocument();
    expect(screen.getByText('60s')).toBeInTheDocument();
  });

  it('should display total rounds when on first round', () => {
    render(
      <ActionBar
        timerState={{ time: 0, active: false }}
        setTimerActive={() => {}}
        setTimerSeconds={() => {}}
        emomState={{
          active: true,
          seconds: 60,
          interval: 60,
          round: 1,
          totalRounds: 4,
        }}
        setEmomActive={() => {}}
        setEmomSeconds={() => {}}
        setEmomInterval={() => {}}
      />
    );

    expect(screen.getByText('Round 1/4')).toBeInTheDocument();
  });

  it('should display just round number when totalRounds is not provided', () => {
    render(
      <ActionBar
        timerState={{ time: 0, active: false }}
        setTimerActive={() => {}}
        setTimerSeconds={() => {}}
        emomState={{
          active: true,
          seconds: 60,
          interval: 60,
          round: 3,
        }}
        setEmomActive={() => {}}
        setEmomSeconds={() => {}}
        setEmomInterval={() => {}}
      />
    );

    expect(screen.getByText('Round 3')).toBeInTheDocument();
  });
});
