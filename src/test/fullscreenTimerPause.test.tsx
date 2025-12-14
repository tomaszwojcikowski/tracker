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
