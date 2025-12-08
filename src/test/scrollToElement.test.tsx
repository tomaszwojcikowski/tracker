/**
 * Tests for useScrollToElement and useScrollToTop hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollToElement, useScrollToTop } from '../hooks';

describe('useScrollToElement', () => {
    let scrollIntoViewMock;
    let scrollToMock;

    beforeEach(() => {
        vi.useFakeTimers();
        scrollIntoViewMock = vi.fn();
        scrollToMock = vi.fn();

        // Mock window.scrollTo
        vi.spyOn(window, 'scrollTo').mockImplementation(scrollToMock);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should scroll to element when elementId is provided', () => {
        // Create mock element
        const mockElement = document.createElement('div');
        mockElement.id = 'test-element';
        mockElement.scrollIntoView = scrollIntoViewMock;
        document.body.appendChild(mockElement);

        renderHook(() => useScrollToElement({ elementId: 'test-element' }));

        // Advance timers to trigger scroll
        vi.advanceTimersByTime(150);

        expect(scrollIntoViewMock).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'start',
        });

        // Cleanup
        document.body.removeChild(mockElement);
    });

    it('should scroll to top when no elementId is provided', () => {
        renderHook(() => useScrollToElement({ elementId: undefined }));

        // Advance timers to trigger scroll
        vi.advanceTimersByTime(150);

        expect(scrollToMock).toHaveBeenCalledWith({
            top: 0,
            behavior: 'smooth',
        });
    });

    it('should not scroll when enabled is false', () => {
        renderHook(() => useScrollToElement({ elementId: undefined, enabled: false }));

        // Advance timers
        vi.advanceTimersByTime(200);

        expect(scrollToMock).not.toHaveBeenCalled();
    });

    it('should respect custom delay', () => {
        renderHook(() => useScrollToElement({ elementId: undefined, delay: 500 }));

        // Advance timers partway
        vi.advanceTimersByTime(200);
        expect(scrollToMock).not.toHaveBeenCalled();

        // Advance past delay
        vi.advanceTimersByTime(350);
        expect(scrollToMock).toHaveBeenCalled();
    });

    it('should not scroll if element not found', () => {
        renderHook(() => useScrollToElement({ elementId: 'non-existent-element' }));

        // Advance timers
        vi.advanceTimersByTime(150);

        // Should not throw or cause issues
        expect(scrollToMock).not.toHaveBeenCalled();
    });

    it('should only scroll once even if re-rendered', () => {
        const { rerender } = renderHook(() => useScrollToElement({ elementId: undefined }));

        // Advance timers to trigger scroll
        vi.advanceTimersByTime(150);
        expect(scrollToMock).toHaveBeenCalledTimes(1);

        // Re-render and advance timers again
        rerender();
        vi.advanceTimersByTime(150);

        // Should still be 1
        expect(scrollToMock).toHaveBeenCalledTimes(1);
    });

    it('should use offset when provided', () => {
        // Create mock element
        const mockElement = document.createElement('div');
        mockElement.id = 'test-element-with-offset';
        
        // Mock getBoundingClientRect
        mockElement.getBoundingClientRect = vi.fn(() => ({
            top: 200,
            left: 0,
            right: 0,
            bottom: 250,
            width: 100,
            height: 50,
            x: 0,
            y: 200,
            toJSON: () => ({})
        })) as any;
        
        document.body.appendChild(mockElement);
        
        // Mock window.scrollY
        Object.defineProperty(window, 'scrollY', {
            value: 0,
            writable: true,
            configurable: true
        });

        renderHook(() => useScrollToElement({ 
            elementId: 'test-element-with-offset',
            offset: 110 // TopAppBar + section header
        }));

        // Advance timers to trigger scroll
        vi.advanceTimersByTime(150);

        // Should scroll to element position minus offset
        // Element top (200) + scrollY (0) - offset (110) = 90
        expect(scrollToMock).toHaveBeenCalledWith({
            top: 90,
            behavior: 'smooth',
        });

        // Cleanup
        document.body.removeChild(mockElement);
    });
});

describe('useScrollToTop', () => {
    let scrollToMock;

    beforeEach(() => {
        vi.useFakeTimers();
        scrollToMock = vi.fn();
        vi.spyOn(window, 'scrollTo').mockImplementation(scrollToMock);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should scroll to top on mount', () => {
        renderHook(() => useScrollToTop());

        // Advance timers to trigger scroll
        vi.advanceTimersByTime(150);

        expect(scrollToMock).toHaveBeenCalledWith({
            top: 0,
            behavior: 'smooth',
        });
    });

    it('should respect custom delay', () => {
        renderHook(() => useScrollToTop({ delay: 300 }));

        // Advance timers partway
        vi.advanceTimersByTime(150);
        expect(scrollToMock).not.toHaveBeenCalled();

        // Advance past delay
        vi.advanceTimersByTime(200);
        expect(scrollToMock).toHaveBeenCalled();
    });

    it('should respect enabled option', () => {
        renderHook(() => useScrollToTop({ enabled: false }));

        // Advance timers
        vi.advanceTimersByTime(200);

        expect(scrollToMock).not.toHaveBeenCalled();
    });
});
