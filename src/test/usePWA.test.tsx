import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePWA } from '../hooks/usePWA';

const mocks = vi.hoisted(() => ({
  callbacks: null as null | Record<string, (...args: unknown[]) => void>,
  registerSW: vi.fn(),
  updateSW: vi.fn(),
}));

vi.mock('virtual:pwa-register', () => ({
  registerSW: mocks.registerSW,
}));

describe('usePWA', () => {
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    vi.useFakeTimers();
    mocks.callbacks = null;
    mocks.updateSW.mockReset();
    mocks.updateSW.mockResolvedValue(undefined);
    mocks.registerSW.mockReset();
    mocks.registerSW.mockImplementation((callbacks) => {
      mocks.callbacks = callbacks;
      return mocks.updateSW;
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('clears service worker update polling timers on unmount', () => {
    const { unmount } = renderHook(() => usePWA());
    const registration = {
      update: vi.fn().mockResolvedValue(undefined),
    };

    act(() => {
      mocks.callbacks?.onRegisteredSW('/sw.js', registration);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000 + 10 * 1000);
    });

    expect(registration.update).not.toHaveBeenCalled();
  });

  it('clears pending mobile auto-update reload on unmount', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'iPhone',
      configurable: true,
    });

    const { result, unmount } = renderHook(() => usePWA());

    act(() => {
      mocks.callbacks?.onNeedRefresh();
    });

    expect(result.current.needRefresh).toBe(true);

    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mocks.updateSW).not.toHaveBeenCalled();
  });
});
