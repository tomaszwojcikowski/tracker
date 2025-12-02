import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import {
    useFocusTrap,
    useAriaAnnounce,
    useReducedMotion,
    useKeyboardShortcut,
} from '../hooks/useAccessibility';

// Test component for useFocusTrap
const FocusTrapTestComponent = ({ isActive }) => {
    const containerRef = useFocusTrap(isActive);

    return (
        <div ref={containerRef} data-testid="focus-trap">
            <button data-testid="first-button">First</button>
            <input data-testid="input" type="text" />
            <button data-testid="last-button">Last</button>
        </div>
    );
};

// Test component for useAriaAnnounce
const AnnounceTestComponent = () => {
    const announce = useAriaAnnounce();

    return (
        <button onClick={() => announce('Test announcement')}>
            Announce
        </button>
    );
};

// Test component for useKeyboardShortcut
const ShortcutTestComponent = ({ onShortcut, shortcutKey, options = {} }) => {
    useKeyboardShortcut(shortcutKey, onShortcut, options);
    return <div data-testid="shortcut-test">Shortcut Component</div>;
};

describe('Accessibility Hooks', () => {
    describe('useFocusTrap', () => {
        it('returns a ref object', () => {
            const TestComponent = () => {
                const ref = useFocusTrap(false);
                return <div ref={ref} data-testid="container" />;
            };

            render(<TestComponent />);
            expect(screen.getByTestId('container')).toBeInTheDocument();
        });

        it('focuses first element when activated', async () => {
            render(<FocusTrapTestComponent isActive={true} />);

            // Wait for RAF to complete
            await act(async () => {
                await new Promise(resolve => requestAnimationFrame(resolve));
            });

            // First focusable element should be focused
            expect(document.activeElement).toBe(screen.getByTestId('first-button'));
        });

        it('does not focus when inactive', () => {
            render(<FocusTrapTestComponent isActive={false} />);

            // Should not change focus
            expect(document.activeElement).not.toBe(screen.getByTestId('first-button'));
        });

        it('traps Tab navigation at the end', async () => {
            render(<FocusTrapTestComponent isActive={true} />);

            await act(async () => {
                await new Promise(resolve => requestAnimationFrame(resolve));
            });

            const lastButton = screen.getByTestId('last-button');
            const firstButton = screen.getByTestId('first-button');

            // Focus last button
            lastButton.focus();

            // Simulate Tab key
            fireEvent.keyDown(screen.getByTestId('focus-trap'), {
                key: 'Tab',
                shiftKey: false,
            });

            // Should wrap to first button
            expect(document.activeElement).toBe(firstButton);
        });

        it('traps Shift+Tab navigation at the start', async () => {
            render(<FocusTrapTestComponent isActive={true} />);

            await act(async () => {
                await new Promise(resolve => requestAnimationFrame(resolve));
            });

            const lastButton = screen.getByTestId('last-button');
            const firstButton = screen.getByTestId('first-button');

            // Focus first button
            firstButton.focus();

            // Simulate Shift+Tab key
            fireEvent.keyDown(screen.getByTestId('focus-trap'), {
                key: 'Tab',
                shiftKey: true,
            });

            // Should wrap to last button
            expect(document.activeElement).toBe(lastButton);
        });
    });

    describe('useAriaAnnounce', () => {
        beforeEach(() => {
            // Clean up any existing announcer elements
            document.querySelectorAll('[id^="aria-announcer"]').forEach(el => el.remove());
        });

        afterEach(() => {
            // Clean up after each test
            document.querySelectorAll('[id^="aria-announcer"]').forEach(el => el.remove());
        });

        it('creates an announcer element', async () => {
            render(<AnnounceTestComponent />);

            // Click to trigger announce
            fireEvent.click(screen.getByText('Announce'));

            await act(async () => {
                await new Promise(resolve => requestAnimationFrame(resolve));
            });

            const announcer = document.getElementById('aria-announcer-polite');
            expect(announcer).toBeInTheDocument();
        });

        it('sets aria-live attribute on announcer', async () => {
            render(<AnnounceTestComponent />);

            fireEvent.click(screen.getByText('Announce'));

            await act(async () => {
                await new Promise(resolve => requestAnimationFrame(resolve));
            });

            const announcer = document.getElementById('aria-announcer-polite');
            expect(announcer).toHaveAttribute('aria-live', 'polite');
        });

        it('announces message text', async () => {
            render(<AnnounceTestComponent />);

            fireEvent.click(screen.getByText('Announce'));

            await act(async () => {
                await new Promise(resolve => requestAnimationFrame(resolve));
                await new Promise(resolve => requestAnimationFrame(resolve));
            });

            const announcer = document.getElementById('aria-announcer-polite');
            expect(announcer.textContent).toBe('Test announcement');
        });
    });

    describe('useReducedMotion', () => {
        let matchMediaMock;

        beforeEach(() => {
            matchMediaMock = vi.fn().mockReturnValue({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            });
            window.matchMedia = matchMediaMock;
        });

        it('returns false when reduced motion is not preferred', () => {
            const TestComponent = () => {
                const prefersReducedMotion = useReducedMotion();
                return <div data-testid="result">{prefersReducedMotion.toString()}</div>;
            };

            render(<TestComponent />);
            expect(screen.getByTestId('result').textContent).toBe('false');
        });

        it('returns true when reduced motion is preferred', () => {
            matchMediaMock.mockReturnValue({
                matches: true,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            });

            const TestComponent = () => {
                const prefersReducedMotion = useReducedMotion();
                return <div data-testid="result">{prefersReducedMotion.toString()}</div>;
            };

            render(<TestComponent />);
            expect(screen.getByTestId('result').textContent).toBe('true');
        });
    });

    describe('useKeyboardShortcut', () => {
        it('calls callback on key press', () => {
            const onShortcut = vi.fn();
            render(<ShortcutTestComponent onShortcut={onShortcut} shortcutKey="Escape" />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onShortcut).toHaveBeenCalledTimes(1);
        });

        it('does not call callback for wrong key', () => {
            const onShortcut = vi.fn();
            render(<ShortcutTestComponent onShortcut={onShortcut} shortcutKey="Escape" />);

            fireEvent.keyDown(document, { key: 'Enter' });

            expect(onShortcut).not.toHaveBeenCalled();
        });

        it('respects ctrl modifier', () => {
            const onShortcut = vi.fn();
            render(
                <ShortcutTestComponent
                    onShortcut={onShortcut}
                    shortcutKey="s"
                    options={{ ctrl: true }}
                />
            );

            // Without Ctrl - should not trigger
            fireEvent.keyDown(document, { key: 's' });
            expect(onShortcut).not.toHaveBeenCalled();

            // With Ctrl - should trigger
            fireEvent.keyDown(document, { key: 's', ctrlKey: true });
            expect(onShortcut).toHaveBeenCalledTimes(1);
        });

        it('respects shift modifier', () => {
            const onShortcut = vi.fn();
            render(
                <ShortcutTestComponent
                    onShortcut={onShortcut}
                    shortcutKey="?"
                    options={{ shift: true }}
                />
            );

            fireEvent.keyDown(document, { key: '?', shiftKey: true });
            expect(onShortcut).toHaveBeenCalledTimes(1);
        });

        it('does not trigger when disabled', () => {
            const onShortcut = vi.fn();
            render(
                <ShortcutTestComponent
                    onShortcut={onShortcut}
                    shortcutKey="Escape"
                    options={{ enabled: false }}
                />
            );

            fireEvent.keyDown(document, { key: 'Escape' });
            expect(onShortcut).not.toHaveBeenCalled();
        });

        it('is case insensitive', () => {
            const onShortcut = vi.fn();
            render(<ShortcutTestComponent onShortcut={onShortcut} shortcutKey="A" />);

            fireEvent.keyDown(document, { key: 'a' });
            expect(onShortcut).toHaveBeenCalledTimes(1);
        });
    });
});
