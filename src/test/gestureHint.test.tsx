import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GestureHint } from '../components/GestureHint';

describe('GestureHint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('clears delayed dismiss work when unmounted after a click dismiss', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(
      <GestureHint
        type="swipe-horizontal"
        storageKey="click-cleanup"
        forceShow
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByRole('dialog', { name: 'Gesture tutorial' }));
    unmount();

    vi.advanceTimersByTime(200);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('clears delayed auto-dismiss work when unmounted mid-animation', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(
      <GestureHint type="swipe-left" storageKey="auto-cleanup" forceShow onDismiss={onDismiss} />
    );

    vi.advanceTimersByTime(3000);
    unmount();
    vi.advanceTimersByTime(200);

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
