/**
 * Toast Context
 *
 * Lightweight global toast/snackbar system. Shows transient messages
 * (success / info / error) with auto-dismiss and an optional Undo action.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Set saved');
 *   toast.show({ message: 'Set 2 ✓', action: { label: 'Undo', onClick: ... } });
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

export type ToastVariant = 'info' | 'success' | 'error';

export interface ToastAction {
    label: string;
    onClick: () => void;
}

export interface ToastOptions {
    message: string;
    variant?: ToastVariant;
    /** Auto-dismiss after N ms. Default: 2400ms (4000ms when an action is present). 0 = sticky. */
    duration?: number;
    action?: ToastAction;
}

export interface ToastInstance extends Required<Omit<ToastOptions, 'action' | 'duration'>> {
    id: number;
    duration: number;
    action?: ToastAction;
}

export interface ToastApi {
    show: (opts: ToastOptions) => number;
    success: (message: string, opts?: Omit<ToastOptions, 'message' | 'variant'>) => number;
    info: (message: string, opts?: Omit<ToastOptions, 'message' | 'variant'>) => number;
    error: (message: string, opts?: Omit<ToastOptions, 'message' | 'variant'>) => number;
    dismiss: (id: number) => void;
    clear: () => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const ToastQueueContext = createContext<ToastInstance[]>([]);

let nextId = 1;

const DEFAULT_DURATION = 2400;
const DEFAULT_DURATION_WITH_ACTION = 4000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastInstance[]>([]);
    const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    const dismiss = useCallback((id: number) => {
        const t = timersRef.current.get(id);
        if (t) {
            clearTimeout(t);
            timersRef.current.delete(id);
        }
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const show = useCallback(
        (opts: ToastOptions): number => {
            const id = nextId++;
            const duration =
                opts.duration ??
                (opts.action ? DEFAULT_DURATION_WITH_ACTION : DEFAULT_DURATION);
            const instance: ToastInstance = {
                id,
                message: opts.message,
                variant: opts.variant ?? 'info',
                duration,
                action: opts.action,
            };
            setToasts((current) => [...current, instance]);
            if (duration > 0) {
                const handle = setTimeout(() => dismiss(id), duration);
                timersRef.current.set(id, handle);
            }
            return id;
        },
        [dismiss]
    );

    const success = useCallback(
        (message: string, opts?: Omit<ToastOptions, 'message' | 'variant'>) =>
            show({ ...opts, message, variant: 'success' }),
        [show]
    );
    const info = useCallback(
        (message: string, opts?: Omit<ToastOptions, 'message' | 'variant'>) =>
            show({ ...opts, message, variant: 'info' }),
        [show]
    );
    const errorFn = useCallback(
        (message: string, opts?: Omit<ToastOptions, 'message' | 'variant'>) =>
            show({ ...opts, message, variant: 'error' }),
        [show]
    );

    const clear = useCallback(() => {
        timersRef.current.forEach((handle) => clearTimeout(handle));
        timersRef.current.clear();
        setToasts([]);
    }, []);

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach((handle) => clearTimeout(handle));
            timers.clear();
        };
    }, []);

    const api = useMemo<ToastApi>(
        () => ({ show, success, info, error: errorFn, dismiss, clear }),
        [show, success, info, errorFn, dismiss, clear]
    );

    return (
        <ToastContext.Provider value={api}>
            <ToastQueueContext.Provider value={toasts}>{children}</ToastQueueContext.Provider>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastApi => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
};

/**
 * Read the current toast queue. Used by the toast renderer; not normally
 * needed by application code (use `useToast()` to push toasts).
 */
export const useToastQueue = (): ToastInstance[] => useContext(ToastQueueContext);
