import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (props: { error: Error | null; reset: () => void }) => ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    isRecovering: boolean;
}

/**
 * ErrorBoundary - React error boundary with recovery UI
 *
 * Catches JavaScript errors in child components and displays a fallback UI
 * with options to recover. Prevents the entire app from crashing.
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            isRecovering: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error details
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });

        // Optional: Send to error tracking service
        // logErrorToService(error, errorInfo);
    }

    handleRefresh = (): void => {
        window.location.reload();
    };

    handleRecover = async (): Promise<void> => {
        this.setState({ isRecovering: true });

        try {
            // Clear potentially corrupted app state while preserving workout data
            const keysToPreserve = ['global_history', 'workoutLogs', 'exercise_history'];
            const preservedData: Record<string, string> = {};

            // Backup important data
            keysToPreserve.forEach(key => {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        preservedData[key] = data;
                    }
                } catch (e) {
                    console.warn(`Could not backup ${key}:`, e);
                }
            });

            // Clear app state
            localStorage.removeItem('tracker_app_state');

            // Small delay to show recovery in progress
            await new Promise(resolve => setTimeout(resolve, 500));

            // Reload the page
            window.location.reload();
        } catch (e) {
            console.error('Recovery failed:', e);
            this.setState({ isRecovering: false });
        }
    };

    handleClearAll = (): void => {
        if (window.confirm('This will delete ALL workout data. Are you sure?')) {
            try {
                localStorage.clear();
                window.location.reload();
            } catch (e) {
                console.error('Failed to clear storage:', e);
            }
        }
    };

    render(): ReactNode {
        const { hasError, error, isRecovering } = this.state;
        const { children, fallback } = this.props;

        if (hasError) {
            // Custom fallback UI provided
            if (fallback) {
                return fallback({ error, reset: this.handleRefresh });
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-sys-black flex flex-col items-center justify-center p-6">
                    {/* Error icon */}
                    <div
                        className="h-20 w-20 rounded-full bg-sys-error/10 flex items-center justify-center mb-6"
                        role="img"
                        aria-label="Error"
                    >
                        <svg
                            className="w-10 h-10 text-sys-error"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    {/* Error message */}
                    <h1 className="text-2xl font-bold text-white mb-2 text-center">
                        Something went wrong
                    </h1>
                    <p className="text-sys-onSurfaceVar text-center mb-6 max-w-sm">
                        Don't worry, your workout data is saved locally.
                        Try refreshing or recovering the app.
                    </p>

                    {/* Error details (collapsed) */}
                    {error && (
                        <details className="mb-6 w-full max-w-sm">
                            <summary className="text-xs text-sys-onSurfaceVar cursor-pointer hover:text-white transition-colors">
                                Show error details
                            </summary>
                            <pre className="mt-2 p-3 bg-sys-surface rounded-xl text-xs text-sys-error overflow-auto max-h-32 border border-white/5">
                                {error.message || error.toString()}
                            </pre>
                        </details>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 w-full max-w-sm">
                        <button
                            onClick={this.handleRefresh}
                            className="w-full h-14 rounded-xl bg-sys-accent text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            disabled={isRecovering}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh Page
                        </button>

                        <button
                            onClick={this.handleRecover}
                            className="w-full h-14 rounded-xl bg-sys-surfaceHigh text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sys-accent disabled:opacity-50"
                            disabled={isRecovering}
                        >
                            {isRecovering ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Recovering...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Reset App State
                                </>
                            )}
                        </button>

                        <button
                            onClick={this.handleClearAll}
                            className="w-full h-12 rounded-xl text-sys-error text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-sys-error"
                            disabled={isRecovering}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear All Data
                        </button>
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-sys-onSurfaceVar text-center mt-8 max-w-xs">
                        If the problem persists, try clearing your browser cache or contact support.
                    </p>
                </div>
            );
        }

        return children;
    }
}

export default ErrorBoundary;
