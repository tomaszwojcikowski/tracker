import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHaptic } from '../hooks/index';

describe('useHaptic - Enhanced Patterns', () => {
    beforeEach(() => {
        // Mock navigator.vibrate
        Object.defineProperty(navigator, 'vibrate', {
            value: vi.fn(),
            writable: true,
            configurable: true,
        });
    });

    it('should return all haptic patterns', () => {
        const { result } = renderHook(() => useHaptic());

        // Basic patterns
        expect(result.current).toHaveProperty('tick');
        expect(result.current).toHaveProperty('bump');
        expect(result.current).toHaveProperty('success');
        expect(result.current).toHaveProperty('timer');

        // Enhanced patterns (Point 11)
        expect(result.current).toHaveProperty('complete');
        expect(result.current).toHaveProperty('milestone');
        expect(result.current).toHaveProperty('countdown');
        expect(result.current).toHaveProperty('error');
        expect(result.current).toHaveProperty('swipe');
    });

    describe('Basic Patterns', () => {
        it('tick should vibrate with [10]', () => {
            const { result } = renderHook(() => useHaptic());
            result.current.tick();
            expect(navigator.vibrate).toHaveBeenCalledWith([10]);
        });

        it('bump should vibrate with [30]', () => {
            const { result } = renderHook(() => useHaptic());
            result.current.bump();
            expect(navigator.vibrate).toHaveBeenCalledWith([30]);
        });

        it('success should vibrate with [50, 50, 50]', () => {
            const { result } = renderHook(() => useHaptic());
            result.current.success();
            expect(navigator.vibrate).toHaveBeenCalledWith([50, 50, 50]);
        });

        it('timer should vibrate with [200, 100, 200]', () => {
            const { result } = renderHook(() => useHaptic());
            result.current.timer();
            expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200]);
        });
    });

    describe('Enhanced Patterns (Point 11)', () => {
        it('complete should vibrate with celebration pattern [10, 30, 10, 30, 50]', () => {
            const { result } = renderHook(() => useHaptic());
            result.current.complete();
            expect(navigator.vibrate).toHaveBeenCalledWith([10, 30, 10, 30, 50]);
        });

        it('milestone should vibrate with achievement pattern [50, 100, 50, 100, 150]', () => {
            const { result } = renderHook(() => useHaptic());
            result.current.milestone();
            expect(navigator.vibrate).toHaveBeenCalledWith([50, 100, 50, 100, 150]);
        });

        it('countdown should vibrate with light tick [15]', () => {
            const { result } = renderHook(() => useHaptic());
            result.current.countdown();
            expect(navigator.vibrate).toHaveBeenCalledWith([15]);
        });

        it('error should vibrate with alert pattern [100, 50, 100]', () => {
            const { result } = renderHook(() => useHaptic());
            result.current.error();
            expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100]);
        });

        it('swipe should vibrate with subtle feedback [5]', () => {
            const { result } = renderHook(() => useHaptic());
            result.current.swipe();
            expect(navigator.vibrate).toHaveBeenCalledWith([5]);
        });
    });

    describe('Graceful Degradation', () => {
        it('should not throw when navigator.vibrate is undefined', () => {
            Object.defineProperty(navigator, 'vibrate', {
                value: undefined,
                writable: true,
                configurable: true,
            });

            const { result } = renderHook(() => useHaptic());

            expect(() => {
                result.current.tick();
                result.current.bump();
                result.current.success();
                result.current.timer();
                result.current.complete();
                result.current.milestone();
                result.current.countdown();
                result.current.error();
                result.current.swipe();
            }).not.toThrow();
        });
    });
});
