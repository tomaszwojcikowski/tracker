/**
 * Snackbar Hook and Context
 *
 * Material Design 3 snackbar/toast notification system.
 * Provides context-based snackbar management with auto-dismiss.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type SnackbarVariant = 'default' | 'success' | 'error' | 'warning';

export interface SnackbarAction {
    /** Action button label */
    label: string;
    /** Action callback */
    onClick: () => void;
}

export interface SnackbarMessage {
    /** Unique ID for the snackbar */
    id: string;
    /** Message text */
    message: string;
    /** Visual variant */
    variant?: SnackbarVariant;
    /** Duration in milliseconds (default: 4000, 0 for persistent) */
    duration?: number;
    /** Optional action button */
    action?: SnackbarAction;
}

export interface SnackbarContextValue {
    /** Show a snackbar message */
    show: (message: string, options?: Omit<SnackbarMessage, 'id' | 'message'>) => string;
    /** Show a success snackbar */
    success: (message: string, options?: Omit<SnackbarMessage, 'id' | 'message' | 'variant'>) => string;
    /** Show an error snackbar */
    error: (message: string, options?: Omit<SnackbarMessage, 'id' | 'message' | 'variant'>) => string;
    /** Show a warning snackbar */
    warning: (message: string, options?: Omit<SnackbarMessage, 'id' | 'message' | 'variant'>) => string;
    /** Dismiss a specific snackbar by ID */
    dismiss: (id: string) => void;
    /** Dismiss all snackbars */
    dismissAll: () => void;
    /** Current snackbar (only one shown at a time per MD3) */
    current: SnackbarMessage | null;
}

// ============================================================================
// CONTEXT
// ============================================================================

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

/**
 * Hook to access snackbar functionality
 */
export const useSnackbar = (): SnackbarContextValue => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

export interface SnackbarProviderProps {
    children: React.ReactNode;
    /** Default duration for snackbars in ms (default: 4000) */
    defaultDuration?: number;
}

/**
 * SnackbarProvider - Manages snackbar state and provides context
 */
export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({
    children,
    defaultDuration = 4000,
}) => {
    const [_queue, setQueue] = useState<SnackbarMessage[]>([]);
    const [current, setCurrent] = useState<SnackbarMessage | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const idCounterRef = useRef(0);

    // Process queue - show next snackbar when current is dismissed
    const processQueue = useCallback(() => {
        setQueue((prevQueue) => {
            if (prevQueue.length === 0) {
                setCurrent(null);
                return prevQueue;
            }

            const [next, ...rest] = prevQueue;
            setCurrent(next);

            // Set auto-dismiss timeout
            if (next.duration !== 0) {
                const duration = next.duration || defaultDuration;
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                    setCurrent(null);
                    // Process next item after a brief delay for exit animation
                    setTimeout(() => processQueue(), 200);
                }, duration);
            }

            return rest;
        });
    }, [defaultDuration]);

    // Generate unique ID
    const generateId = useCallback(() => {
        idCounterRef.current += 1;
        return `snackbar-${idCounterRef.current}-${Date.now()}`;
    }, []);

    // Show a snackbar
    const show = useCallback(
        (message: string, options?: Omit<SnackbarMessage, 'id' | 'message'>): string => {
            const id = generateId();
            const snackbar: SnackbarMessage = {
                id,
                message,
                variant: options?.variant || 'default',
                duration: options?.duration,
                action: options?.action,
            };

            setQueue((prev) => {
                const newQueue = [...prev, snackbar];
                // If no current snackbar, process queue
                if (!current) {
                    setTimeout(() => processQueue(), 0);
                }
                return newQueue;
            });

            return id;
        },
        [current, generateId, processQueue]
    );

    // Convenience methods
    const success = useCallback(
        (message: string, options?: Omit<SnackbarMessage, 'id' | 'message' | 'variant'>) =>
            show(message, { ...options, variant: 'success' }),
        [show]
    );

    const error = useCallback(
        (message: string, options?: Omit<SnackbarMessage, 'id' | 'message' | 'variant'>) =>
            show(message, { ...options, variant: 'error' }),
        [show]
    );

    const warning = useCallback(
        (message: string, options?: Omit<SnackbarMessage, 'id' | 'message' | 'variant'>) =>
            show(message, { ...options, variant: 'warning' }),
        [show]
    );

    // Dismiss specific snackbar
    const dismiss = useCallback(
        (id: string) => {
            if (current?.id === id) {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                setCurrent(null);
                setTimeout(() => processQueue(), 200);
            } else {
                setQueue((prev) => prev.filter((s) => s.id !== id));
            }
        },
        [current, processQueue]
    );

    // Dismiss all snackbars
    const dismissAll = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setQueue([]);
        setCurrent(null);
    }, []);

    const value: SnackbarContextValue = {
        show,
        success,
        error,
        warning,
        dismiss,
        dismissAll,
        current,
    };

    return (
        <SnackbarContext.Provider value={value}>
            {children}
        </SnackbarContext.Provider>
    );
};

export default useSnackbar;
