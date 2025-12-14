import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FullscreenTimer } from '../components/FullscreenTimer';

describe('FullscreenTimer - density rep controls', () => {
  it('should render density rep controls in density mode and wire callbacks', () => {
    const onUpdateRepChunks = vi.fn();
    const onMarkComplete = vi.fn();

    render(
      <FullscreenTimer
        mode="density"
        seconds={60}
        totalSeconds={600}
        onStop={vi.fn()}
        onAddTime={vi.fn()}
        onMinimize={vi.fn()}
        soundEnabled={false}
        densityRepControls={{
          targetReps: 30,
          repChunks: [],
          isComplete: false,
          onUpdateRepChunks,
          onMarkComplete,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add 1 rep' }));
    expect(onUpdateRepChunks).toHaveBeenCalledWith([1]);
    expect(onMarkComplete).not.toHaveBeenCalled();
  });

  it('should not render density rep controls in rest mode', () => {
    render(
      <FullscreenTimer
        mode="rest"
        seconds={60}
        totalSeconds={600}
        onStop={vi.fn()}
        onAddTime={vi.fn()}
        onMinimize={vi.fn()}
        soundEnabled={false}
        densityRepControls={{
          targetReps: 30,
          repChunks: [],
          isComplete: false,
          onUpdateRepChunks: vi.fn(),
          onMarkComplete: vi.fn(),
        }}
      />
    );

    expect(screen.queryByRole('button', { name: 'Add 1 rep' })).toBeNull();
  });
});
