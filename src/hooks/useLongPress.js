import { useRef, useCallback } from 'react';

/**
 * Long-press detection hook
 * Triggers a callback after holding for a specified duration
 *
 * @param {Function} callback - Function to call on successful long-press
 * @param {Object} options - Configuration options
 * @param {number} options.delay - Delay in ms before triggering (default: 500)
 * @param {boolean} options.haptic - Enable haptic feedback on trigger (default: true)
 * @returns {Object} Event handlers to attach to the target element
 *
 * @example
 * const longPressHandlers = useLongPress(() => {
 *   console.log('Long pressed!');
 * }, { delay: 500 });
 *
 * return <button {...longPressHandlers}>Hold me</button>;
 */
export const useLongPress = (callback, options = {}) => {
    const { delay = 500, haptic = true } = options;

    const timeoutRef = useRef(null);
    const targetRef = useRef(null);
    const isLongPressRef = useRef(false);

    const start = useCallback((e) => {
        // Prevent context menu on long press
        e.target.addEventListener('contextmenu', preventDefault);

        targetRef.current = e.target;
        isLongPressRef.current = false;

        timeoutRef.current = setTimeout(() => {
            isLongPressRef.current = true;

            // Haptic feedback for long press
            if (haptic && navigator.vibrate) {
                navigator.vibrate([50, 50, 100]);
            }

            callback(e);
        }, delay);
    }, [callback, delay, haptic]);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (targetRef.current) {
            targetRef.current.removeEventListener('contextmenu', preventDefault);
            targetRef.current = null;
        }
    }, []);

    // Prevent default click if long-press was triggered
    const handleClick = useCallback((e) => {
        if (isLongPressRef.current) {
            e.preventDefault();
            e.stopPropagation();
            isLongPressRef.current = false;
        }
    }, []);

    return {
        onTouchStart: start,
        onTouchEnd: cancel,
        onTouchMove: cancel,
        onMouseDown: start,
        onMouseUp: cancel,
        onMouseLeave: cancel,
        onClick: handleClick,
    };
};

// Helper to prevent context menu
const preventDefault = (e) => {
    e.preventDefault();
};

export default useLongPress;
