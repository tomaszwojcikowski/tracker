import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FullscreenTimer } from '../components/FullscreenTimer';

describe('FullscreenTimer - tap ring to pause', () => {
  it('should call onTogglePause when the timer ring is clicked', () => {
    const onTogglePause = vi.fn();

    render(
      <FullscreenTimer
        mode="rest"
        seconds={120}
        totalSeconds={300}
        onStop={vi.fn()}
        onAddTime={vi.fn()}
        onMinimize={vi.fn()}
        isPaused={false}
        onTogglePause={onTogglePause}
        soundEnabled={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pause timer' }));
    expect(onTogglePause).toHaveBeenCalledTimes(1);
  });

  it('should expose Resume timer label when paused', () => {
    const onTogglePause = vi.fn();

    render(
      <FullscreenTimer
        mode="rest"
        seconds={120}
        totalSeconds={300}
        onStop={vi.fn()}
        onAddTime={vi.fn()}
        onMinimize={vi.fn()}
        isPaused={true}
        onTogglePause={onTogglePause}
        soundEnabled={false}
      />
    );

    expect(screen.getByRole('button', { name: 'Resume timer' })).toBeInTheDocument();
  });
});

describe('FullscreenTimer - EMOM mode with totalRounds', () => {
  it('should display "Round X of Y" when totalRounds is provided', () => {
    render(
      <FullscreenTimer
        mode="emom"
        seconds={45}
        totalSeconds={60}
        round={2}
        totalRounds={5}
        onStop={vi.fn()}
        onAddTime={vi.fn()}
        onMinimize={vi.fn()}
        soundEnabled={false}
      />
    );

    // Should show "2 of 5" in the round display
    expect(screen.getByText('2 of 5')).toBeInTheDocument();
  });

  it('should display only round number when totalRounds is not provided', () => {
    render(
      <FullscreenTimer
        mode="emom"
        seconds={45}
        totalSeconds={60}
        round={3}
        onStop={vi.fn()}
        onAddTime={vi.fn()}
        onMinimize={vi.fn()}
        soundEnabled={false}
      />
    );

    // Should show just "3" without "of X"
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText(/of/)).not.toBeInTheDocument();
  });

  it('should display "Round" label with round counter', () => {
    render(
      <FullscreenTimer
        mode="emom"
        seconds={45}
        totalSeconds={60}
        round={1}
        totalRounds={3}
        onStop={vi.fn()}
        onAddTime={vi.fn()}
        onMinimize={vi.fn()}
        soundEnabled={false}
      />
    );

    // Should show "Round" label
    expect(screen.getByText('Round')).toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });
});
