/**
 * Error Reporting Service - Sentry Integration
 *
 * This module provides error tracking and reporting functionality using Sentry.
 * It captures runtime errors, unhandled promise rejections, and React component errors.
 *
 * Configuration:
 * Set VITE_SENTRY_DSN environment variable with your Sentry DSN to enable error reporting.
 * See ERROR_REPORTING_SETUP.md for detailed setup instructions.
 */

import * as Sentry from '@sentry/react';

declare const __BUILD_VERSION__: string;

/**
 * Error severity levels for categorizing errors
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

/**
 * Context information to attach to error reports
 */
export interface ErrorContext {
    /** Component or module where the error occurred */
    component?: string;
    /** Action being performed when the error occurred */
    action?: string;
    /** Additional key-value pairs for context */
    extra?: Record<string, unknown>;
}

/**
 * Configuration options for the error reporting service
 */
export interface ErrorReportingConfig {
    /** Sentry DSN (Data Source Name) for the project */
    dsn: string;
    /** Application environment (e.g., 'development', 'production') */
    environment?: string;
    /** Application release version */
    release?: string;
    /** Sample rate for error events (0.0 to 1.0) */
    sampleRate?: number;
    /** Whether to enable debug mode */
    debug?: boolean;
}

/**
 * Check if error reporting is configured
 */
export function isErrorReportingEnabled(): boolean {
    return Boolean(import.meta.env.VITE_SENTRY_DSN);
}

/**
 * Initialize the error reporting service
 *
 * Should be called once at application startup, before rendering the app.
 * If VITE_SENTRY_DSN is not set, initialization is skipped and errors
 * are only logged to the console.
 */
export function initErrorReporting(): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

    if (!dsn) {
        console.log(
            'Error reporting not configured. Set VITE_SENTRY_DSN to enable. See ERROR_REPORTING_SETUP.md for instructions.'
        );
        return;
    }

    const environment = import.meta.env.MODE || 'development';
    // Safely get build version, defaulting to 'unknown' if not defined
    let release: string | undefined;
    try {
        release = typeof __BUILD_VERSION__ !== 'undefined' ? `tracker@${__BUILD_VERSION__}` : 'tracker@unknown';
    } catch {
        release = 'tracker@unknown';
    }

    Sentry.init({
        dsn,
        environment,
        release,
        // Sample rate for errors (1.0 = 100% of errors are sent)
        sampleRate: 1.0,
        // Enable in development for testing, but you may want to disable in production
        debug: import.meta.env.DEV,
        // Integrations
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                // Only capture replays on errors
                maskAllText: true,
                blockAllMedia: true,
            }),
            // Capture console.error calls as breadcrumbs and errors
            Sentry.captureConsoleIntegration({
                levels: ['error', 'warn'],
            }),
        ],
        // Performance monitoring sample rate (adjust based on traffic)
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        // Session replay sample rate (only on errors)
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
        // Capture console.error as Sentry events
        beforeSend(event, hint) {
            // Add extra context for console errors
            if (hint.originalException && typeof hint.originalException === 'string') {
                event.fingerprint = ['console-error', hint.originalException];
            }
            return event;
        },
    });

    // Also wrap console.error to capture as Sentry events
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
        // Call original console.error first
        originalConsoleError.apply(console, args);

        // Send to Sentry if initialized
        if (isErrorReportingEnabled()) {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');

            // Check if first arg is an Error object
            const firstArg = args[0];
            if (firstArg instanceof Error) {
                Sentry.captureException(firstArg, {
                    extra: { consoleArgs: args.slice(1) },
                    tags: { source: 'console.error' },
                });
            } else {
                Sentry.captureMessage(message, {
                    level: 'error',
                    tags: { source: 'console.error' },
                });
            }
        }
    };

    console.log('Error reporting initialized (console.error capture enabled)');
}

/**
 * Capture and report an error to the error reporting service
 *
 * @param error - The error to report
 * @param severity - Error severity level (default: 'error')
 * @param context - Additional context information
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureError(error, 'error', {
 *     component: 'WorkoutPlayer',
 *     action: 'saveWorkout',
 *     extra: { workoutId: 123 }
 *   });
 * }
 * ```
 */
export function captureError(
    error: Error | string,
    severity: ErrorSeverity = 'error',
    context?: ErrorContext
): void {
    // Always log to console for debugging
    console.error('Error captured:', error, context);

    if (!isErrorReportingEnabled()) {
        return;
    }

    const errorInstance = typeof error === 'string' ? new Error(error) : error;

    Sentry.withScope((scope) => {
        // Set severity level
        scope.setLevel(severity);

        // Add context if provided
        if (context?.component) {
            scope.setTag('component', context.component);
        }
        if (context?.action) {
            scope.setTag('action', context.action);
        }
        if (context?.extra) {
            Object.entries(context.extra).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }

        Sentry.captureException(errorInstance);
    });
}

/**
 * Capture a message (non-error event) to the error reporting service
 *
 * @param message - The message to report
 * @param severity - Message severity level (default: 'info')
 * @param context - Additional context information
 *
 * @example
 * ```typescript
 * captureMessage('User completed workout', 'info', {
 *   component: 'WorkoutPlayer',
 *   extra: { duration: 3600 }
 * });
 * ```
 */
export function captureMessage(
    message: string,
    severity: ErrorSeverity = 'info',
    context?: ErrorContext
): void {
    if (!isErrorReportingEnabled()) {
        return;
    }

    Sentry.withScope((scope) => {
        scope.setLevel(severity);

        if (context?.component) {
            scope.setTag('component', context.component);
        }
        if (context?.action) {
            scope.setTag('action', context.action);
        }
        if (context?.extra) {
            Object.entries(context.extra).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }

        Sentry.captureMessage(message);
    });
}

/**
 * Set user information for error reports
 *
 * Call this when a user signs in to attach user info to future error reports.
 * Call with null to clear user info on sign out.
 *
 * @param user - User information or null to clear
 *
 * @example
 * ```typescript
 * // On sign in
 * setErrorReportingUser({
 *   id: user.uid,
 *   email: user.email || undefined
 * });
 *
 * // On sign out
 * setErrorReportingUser(null);
 * ```
 */
export function setErrorReportingUser(
    user: { id: string; email?: string; username?: string } | null
): void {
    if (!isErrorReportingEnabled()) {
        return;
    }

    Sentry.setUser(user);
}

/**
 * Add a breadcrumb for debugging error context
 *
 * Breadcrumbs are a trail of events that happened before an error,
 * helping to understand what led to the error.
 *
 * @param message - Description of the event
 * @param category - Category for grouping (e.g., 'navigation', 'ui', 'api')
 * @param data - Additional data to attach
 *
 * @example
 * ```typescript
 * addBreadcrumb('Clicked save button', 'ui', { workoutId: 123 });
 * ```
 */
export function addBreadcrumb(
    message: string,
    category: string = 'app',
    data?: Record<string, unknown>
): void {
    if (!isErrorReportingEnabled()) {
        return;
    }

    Sentry.addBreadcrumb({
        message,
        category,
        level: 'info',
        data,
    });
}

/**
 * Get the Sentry ErrorBoundary component for wrapping React components
 *
 * Use this to wrap your app or individual components for React error handling.
 *
 * @returns The Sentry ErrorBoundary component
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Get the Sentry React profiler component
 *
 * Use this to profile React component render times.
 *
 * @returns The Sentry Profiler component
 */
export const SentryProfiler = Sentry.withProfiler;

export default {
    init: initErrorReporting,
    captureError,
    captureMessage,
    setUser: setErrorReportingUser,
    addBreadcrumb,
    isEnabled: isErrorReportingEnabled,
};
