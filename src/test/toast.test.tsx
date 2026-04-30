import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '../context/ToastContext';
import { Toaster } from '../components/Toaster';

const Trigger: React.FC<{ onReady?: (api: ReturnType<typeof useToast>) => void }> = ({ onReady }) => {
    const api = useToast();
    if (onReady) onReady(api);
    return null;
};

const renderHarness = () => {
    let api: ReturnType<typeof useToast> | null = null;
    render(
        <ToastProvider>
            <Trigger onReady={(a) => { api = a; }} />
            <Toaster />
        </ToastProvider>
    );
    if (!api) throw new Error('toast api not ready');
    return api as ReturnType<typeof useToast>;
};

describe('ToastProvider + Toaster', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders a toast when show() is called', () => {
        const api = renderHarness();
        act(() => { api.success('Set saved'); });
        expect(screen.getByText('Set saved')).toBeTruthy();
        expect(screen.getByTestId('toaster')).toBeTruthy();
        expect(screen.getByTestId('toast-success')).toBeTruthy();
    });

    it('auto-dismisses after default duration', () => {
        const api = renderHarness();
        act(() => { api.show({ message: 'hi' }); });
        expect(screen.getByText('hi')).toBeTruthy();
        act(() => { vi.advanceTimersByTime(2500); });
        expect(screen.queryByText('hi')).toBeNull();
    });

    it('does not auto-dismiss when duration=0', () => {
        const api = renderHarness();
        act(() => { api.show({ message: 'sticky', duration: 0 }); });
        act(() => { vi.advanceTimersByTime(10000); });
        expect(screen.getByText('sticky')).toBeTruthy();
    });

    it('action button fires callback and dismisses', () => {
        const api = renderHarness();
        const onAction = vi.fn();
        act(() => {
            api.show({ message: 'Set saved', action: { label: 'Undo', onClick: onAction } });
        });
        const undoBtn = screen.getByRole('button', { name: /undo/i });
        fireEvent.click(undoBtn);
        expect(onAction).toHaveBeenCalled();
        expect(screen.queryByText('Set saved')).toBeNull();
    });

    it('queues multiple toasts', () => {
        const api = renderHarness();
        act(() => {
            api.success('one');
            api.info('two');
        });
        expect(screen.getByText('one')).toBeTruthy();
        expect(screen.getByText('two')).toBeTruthy();
    });
});
