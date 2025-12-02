import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLongPress } from '../hooks/useLongPress';

describe('useLongPress', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Mock navigator.vibrate
        Object.defineProperty(navigator, 'vibrate', {
            value: vi.fn(),
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should return event handlers', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useLongPress(callback));

        expect(result.current).toHaveProperty('onTouchStart');
        expect(result.current).toHaveProperty('onTouchEnd');
        expect(result.current).toHaveProperty('onTouchMove');
        expect(result.current).toHaveProperty('onMouseDown');
        expect(result.current).toHaveProperty('onMouseUp');
        expect(result.current).toHaveProperty('onMouseLeave');
        expect(result.current).toHaveProperty('onClick');
    });

    it('should call callback after default delay (500ms)', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useLongPress(callback));

        const mockEvent = {
            target: {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        };

        act(() => {
            result.current.onTouchStart(mockEvent);
        });

        expect(callback).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should respect custom delay option', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useLongPress(callback, { delay: 1000 }));

        const mockEvent = {
            target: {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        };

        act(() => {
            result.current.onTouchStart(mockEvent);
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel on touch end before delay', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useLongPress(callback));

        const mockEvent = {
            target: {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        };

        act(() => {
            result.current.onTouchStart(mockEvent);
        });

        act(() => {
            vi.advanceTimersByTime(200);
        });

        act(() => {
            result.current.onTouchEnd();
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).not.toHaveBeenCalled();
    });

    it('should cancel on touch move', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useLongPress(callback));

        const mockEvent = {
            target: {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        };

        act(() => {
            result.current.onTouchStart(mockEvent);
        });

        act(() => {
            result.current.onTouchMove();
        });

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(callback).not.toHaveBeenCalled();
    });

    it('should trigger haptic feedback when enabled', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useLongPress(callback, { haptic: true }));

        const mockEvent = {
            target: {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        };

        act(() => {
            result.current.onTouchStart(mockEvent);
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(navigator.vibrate).toHaveBeenCalledWith([50, 50, 100]);
    });

    it('should not trigger haptic feedback when disabled', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useLongPress(callback, { haptic: false }));

        const mockEvent = {
            target: {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        };

        act(() => {
            result.current.onTouchStart(mockEvent);
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(navigator.vibrate).not.toHaveBeenCalled();
    });

    it('should work with mouse events', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useLongPress(callback));

        const mockEvent = {
            target: {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        };

        act(() => {
            result.current.onMouseDown(mockEvent);
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel on mouse up', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useLongPress(callback));

        const mockEvent = {
            target: {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        };

        act(() => {
            result.current.onMouseDown(mockEvent);
        });

        act(() => {
            result.current.onMouseUp();
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).not.toHaveBeenCalled();
    });

    it('should cancel on mouse leave', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useLongPress(callback));

        const mockEvent = {
            target: {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        };

        act(() => {
            result.current.onMouseDown(mockEvent);
        });

        act(() => {
            result.current.onMouseLeave();
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).not.toHaveBeenCalled();
    });
});
