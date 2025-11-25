import { useEffect, useRef, useCallback } from 'react';

/**
 * useFocusTrap - Traps focus within a container element
 * 
 * Essential for modal dialogs to ensure keyboard navigation stays within the modal.
 * Automatically focuses the first focusable element and returns focus when unmounted.
 * 
 * @param {boolean} isActive - Whether the focus trap is active
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFocus - Whether to auto-focus first element (default: true)
 * @param {boolean} options.returnFocus - Whether to return focus on deactivate (default: true)
 * @returns {React.RefObject} Ref to attach to the container element
 * 
 * @example
 * const MyModal = ({ isOpen }) => {
 *   const containerRef = useFocusTrap(isOpen);
 *   return isOpen ? <div ref={containerRef}>...</div> : null;
 * };
 */
export const useFocusTrap = (isActive, options = {}) => {
    const { autoFocus = true, returnFocus = true } = options;
    const containerRef = useRef(null);
    const previouslyFocusedRef = useRef(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        // Store currently focused element to restore later
        if (returnFocus) {
            previouslyFocusedRef.current = document.activeElement;
        }

        const container = containerRef.current;
        
        // Get all focusable elements
        const getFocusableElements = () => {
            return container.querySelectorAll(
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
        const lastElement = focusableElements[focusableElements.length - 1];

        // Auto-focus first element
        if (autoFocus && firstElement) {
            // Small delay to ensure element is ready
            requestAnimationFrame(() => {
                firstElement.focus();
            });
        }

        // Handle tab key to trap focus
        const handleKeyDown = (e) => {
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
                previouslyFocusedRef.current.focus();
            }
        };
    }, [isActive, autoFocus, returnFocus]);

    return containerRef;
};

/**
 * useAriaAnnounce - Announces messages to screen readers
 * 
 * Creates a live region for accessibility announcements.
 * 
 * @param {string} politeness - 'polite' or 'assertive' (default: 'polite')
 * @returns {Function} announce function to trigger announcements
 * 
 * @example
 * const announce = useAriaAnnounce();
 * announce('Workout saved successfully');
 */
export const useAriaAnnounce = (politeness = 'polite') => {
    const announcerRef = useRef(null);

    useEffect(() => {
        // Create announcer element if it doesn't exist
        let announcer = document.getElementById(`aria-announcer-${politeness}`);
        
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

    const announce = useCallback((message) => {
        if (announcerRef.current) {
            // Clear and set message (needed for repeated announcements)
            announcerRef.current.textContent = '';
            requestAnimationFrame(() => {
                announcerRef.current.textContent = message;
            });
        }
    }, []);

    return announce;
};

/**
 * useReducedMotion - Detects user's reduced motion preference
 * 
 * @returns {boolean} Whether reduced motion is preferred
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * const animationDuration = prefersReducedMotion ? 0 : 300;
 */
export const useReducedMotion = () => {
    const mediaQuery = typeof window !== 'undefined' 
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const getInitialValue = () => mediaQuery?.matches ?? false;
    
    const prefersReducedMotionRef = useRef(getInitialValue());

    useEffect(() => {
        if (!mediaQuery) return;

        const handler = (e) => {
            prefersReducedMotionRef.current = e.matches;
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [mediaQuery]);

    return prefersReducedMotionRef.current;
};

/**
 * useKeyboardShortcut - Registers keyboard shortcuts
 * 
 * @param {string} key - Key to listen for (e.g., 'Escape', 'Enter')
 * @param {Function} callback - Callback to execute
 * @param {Object} options - Options
 * @param {boolean} options.ctrl - Require Ctrl key
 * @param {boolean} options.shift - Require Shift key
 * @param {boolean} options.alt - Require Alt key
 * @param {boolean} options.enabled - Whether shortcut is enabled (default: true)
 * 
 * @example
 * useKeyboardShortcut('Escape', () => closeModal());
 * useKeyboardShortcut('s', () => save(), { ctrl: true });
 */
export const useKeyboardShortcut = (key, callback, options = {}) => {
    const { ctrl = false, shift = false, alt = false, enabled = true } = options;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e) => {
            const keyMatches = e.key.toLowerCase() === key.toLowerCase();
            const ctrlMatches = ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
            const shiftMatches = shift ? e.shiftKey : !e.shiftKey;
            const altMatches = alt ? e.altKey : !e.altKey;

            if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
                e.preventDefault();
                callback(e);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [key, callback, ctrl, shift, alt, enabled]);
};

export default {
    useFocusTrap,
    useAriaAnnounce,
    useReducedMotion,
    useKeyboardShortcut,
};
