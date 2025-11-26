import { useRef, useCallback } from 'react';

// ============================================================================
// LONG PRESS TYPES
// ============================================================================

/**
 * Options for long-press detection
 */
export interface LongPressOptions {
    /** Delay in ms before triggering (default: 500) */
    delay?: number;
    /** Enable haptic feedback on trigger (default: true) */
    haptic?: boolean;
}

/**
 * Event handlers returned by useLongPress
 */
export interface LongPressHandlers {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onTouchMove: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onClick: (e: React.MouseEvent) => void;
}

/**
 * Union type for touch or mouse events
 */
type LongPressEvent = React.TouchEvent | React.MouseEvent;

// Helper to prevent context menu
const preventDefault = (e: Event): void => {
    e.preventDefault();
};

/**
 * Long-press detection hook
 * Triggers a callback after holding for a specified duration
 *
 * @param callback - Function to call on successful long-press
 * @param options - Configuration options
 * @returns Event handlers to attach to the target element
 *
 * @example
 * const longPressHandlers = useLongPress(() => {
 *   console.log('Long pressed!');
 * }, { delay: 500 });
 *
 * return <button {...longPressHandlers}>Hold me</button>;
 */
export const useLongPress = (
    callback: (e: LongPressEvent) => void,
    options: LongPressOptions = {}
): LongPressHandlers => {
    const { delay = 500, haptic = true } = options;

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const targetRef = useRef<EventTarget | null>(null);
    const isLongPressRef = useRef<boolean>(false);

    const start = useCallback(
        (e: LongPressEvent) => {
            // Prevent context menu on long press
            const target = e.target as HTMLElement;
            target.addEventListener('contextmenu', preventDefault);

            targetRef.current = target;
            isLongPressRef.current = false;

            timeoutRef.current = setTimeout(() => {
                isLongPressRef.current = true;

                // Haptic feedback for long press
                if (haptic && navigator.vibrate) {
                    navigator.vibrate([50, 50, 100]);
                }

                callback(e);
            }, delay);
        },
        [callback, delay, haptic]
    );

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (targetRef.current) {
            (targetRef.current as HTMLElement).removeEventListener(
                'contextmenu',
                preventDefault
            );
            targetRef.current = null;
        }
    }, []);

    // Prevent default click if long-press was triggered
    const handleClick = useCallback((e: React.MouseEvent) => {
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

export default useLongPress;
