import { useEffect, useRef, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for the focus trap hook
 */
export interface FocusTrapOptions {
    /** Whether to auto-focus first element (default: true) */
    autoFocus?: boolean;
    /** Whether to return focus on deactivate (default: true) */
    returnFocus?: boolean;
}

/**
 * ARIA live region politeness setting
 */
export type AriaPoliteness = 'polite' | 'assertive';

/**
 * Modifier keys for keyboard shortcuts
 */
export interface KeyboardModifiers {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
}

/**
 * Options for keyboard shortcut hook
 */
export interface KeyboardShortcutOptions extends KeyboardModifiers {
    /** Whether the shortcut is active (default: true) */
    enabled?: boolean;
}

// ============================================================================
// FOCUS TRAP HOOK
// ============================================================================

/**
 * useFocusTrap - Traps focus within a container element
 *
 * Essential for modal dialogs to ensure keyboard navigation stays within the modal.
 * Automatically focuses the first focusable element and returns focus when unmounted.
 *
 * @param isActive - Whether the focus trap is active
 * @param options - Configuration options
 * @returns Ref to attach to the container element
 *
 * @example
 * const MyModal = ({ isOpen }) => {
 *   const containerRef = useFocusTrap(isOpen);
 *   return isOpen ? <div ref={containerRef}>...</div> : null;
 * };
 */
export const useFocusTrap = <T extends HTMLElement = HTMLDivElement>(
    isActive: boolean,
    options: FocusTrapOptions = {}
): React.RefObject<T | null> => {
    const { autoFocus = true, returnFocus = true } = options;
    const containerRef = useRef<T>(null);
    const previouslyFocusedRef = useRef<Element | null>(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        // Store currently focused element to restore later
        if (returnFocus) {
            previouslyFocusedRef.current = document.activeElement;
        }

        const container = containerRef.current;

        // Get all focusable elements
        const getFocusableElements = (): NodeListOf<HTMLElement> => {
            return container.querySelectorAll<HTMLElement>(
                'button:not([disabled]), ' +
                '[href], ' +
                'input:not([disabled]), ' +
                'select:not([disabled]), ' +
                'textarea:not([disabled]), ' +
                '[tabindex]:not([tabindex="-1"]):not([disabled])'
            );
        };

        const focusableElements = getFocusableElements();
        const firstElement = focusableElements[0];

        // Auto-focus first element
        if (autoFocus && firstElement) {
            // Small delay to ensure element is ready
            requestAnimationFrame(() => {
                firstElement.focus();
            });
        }

        // Handle tab key to trap focus
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (e.key !== 'Tab') return;

            const currentFocusableElements = getFocusableElements();
            const currentFirst = currentFocusableElements[0];
            const currentLast = currentFocusableElements[currentFocusableElements.length - 1];

            // If no focusable elements, prevent tab
            if (currentFocusableElements.length === 0) {
                e.preventDefault();
                return;
            }

            if (e.shiftKey) {
                // Shift + Tab: if on first element, go to last
                if (document.activeElement === currentFirst) {
                    e.preventDefault();
                    currentLast?.focus();
                }
            } else {
                // Tab: if on last element, go to first
                if (document.activeElement === currentLast) {
                    e.preventDefault();
                    currentFirst?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('keydown', handleKeyDown);

            // Return focus to previously focused element
            if (returnFocus && previouslyFocusedRef.current) {
                (previouslyFocusedRef.current as HTMLElement).focus?.();
            }
        };
    }, [isActive, autoFocus, returnFocus]);

    return containerRef;
};

// ============================================================================
// ARIA ANNOUNCE HOOK
// ============================================================================

/**
 * useAriaAnnounce - Announces messages to screen readers
 *
 * Creates a live region for accessibility announcements.
 *
 * @param politeness - 'polite' or 'assertive' (default: 'polite')
 * @returns announce function to trigger announcements
 *
 * @example
 * const announce = useAriaAnnounce();
 * announce('Workout saved successfully');
 */
export const useAriaAnnounce = (
    politeness: AriaPoliteness = 'polite'
): ((message: string) => void) => {
    const announcerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Create announcer element if it doesn't exist
        let announcer = document.getElementById(`aria-announcer-${politeness}`) as HTMLDivElement | null;

        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = `aria-announcer-${politeness}`;
            announcer.setAttribute('aria-live', politeness);
            announcer.setAttribute('aria-atomic', 'true');
            announcer.setAttribute('role', 'status');
            announcer.style.cssText = `
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            `;
            document.body.appendChild(announcer);
        }

        announcerRef.current = announcer;

        return () => {
            // Don't remove - other components might be using it
        };
    }, [politeness]);

    const announce = useCallback((message: string): void => {
        if (announcerRef.current) {
            // Clear and set message (needed for repeated announcements)
            announcerRef.current.textContent = '';
            requestAnimationFrame(() => {
                if (announcerRef.current) {
                    announcerRef.current.textContent = message;
                }
            });
        }
    }, []);

    return announce;
};

// ============================================================================
// REDUCED MOTION HOOK
// ============================================================================

/**
 * useReducedMotion - Detects user's reduced motion preference
 *
 * @returns Whether reduced motion is preferred
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * const animationDuration = prefersReducedMotion ? 0 : 300;
 */
export const useReducedMotion = (): boolean => {
    const mediaQuery = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const getInitialValue = (): boolean => mediaQuery?.matches ?? false;

    const prefersReducedMotionRef = useRef<boolean>(getInitialValue());

    useEffect(() => {
        if (!mediaQuery) return;

        const handler = (e: MediaQueryListEvent): void => {
            prefersReducedMotionRef.current = e.matches;
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [mediaQuery]);

    return prefersReducedMotionRef.current;
};

// ============================================================================
// KEYBOARD SHORTCUT HOOK
// ============================================================================

/**
 * useKeyboardShortcut - Registers keyboard shortcuts
 *
 * @param key - Key to listen for (e.g., 'Escape', 'Enter')
 * @param callback - Callback to execute
 * @param options - Options including modifier keys
 *
 * @example
 * useKeyboardShortcut('Escape', () => closeModal());
 * useKeyboardShortcut('s', () => save(), { ctrl: true });
 */
export const useKeyboardShortcut = (
    key: string,
    callback: () => void,
    options: KeyboardShortcutOptions = {}
): void => {
    const {
        ctrl = false,
        alt = false,
        shift = false,
        meta = false,
        enabled = true,
    } = options;

    const callbackRef = useRef(callback);

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent): void => {
            // Check if the key matches
            if (e.key.toLowerCase() !== key.toLowerCase()) return;

            // Check modifier keys
            if (ctrl !== e.ctrlKey) return;
            if (alt !== e.altKey) return;
            if (shift !== e.shiftKey) return;
            if (meta !== e.metaKey) return;

            // Don't trigger if in an input field (unless Escape)
            const target = e.target as HTMLElement;
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
            const isContentEditable = target.isContentEditable;

            if ((isInput || isContentEditable) && key.toLowerCase() !== 'escape') {
                return;
            }

            e.preventDefault();
            callbackRef.current();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [key, ctrl, alt, shift, meta, enabled]);
};

export default {
    useFocusTrap,
    useAriaAnnounce,
    useReducedMotion,
    useKeyboardShortcut,
};
