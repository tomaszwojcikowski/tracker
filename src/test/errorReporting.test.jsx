import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry before importing the module
vi.mock('@sentry/react', () => ({
    init: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    setUser: vi.fn(),
    addBreadcrumb: vi.fn(),
    withScope: vi.fn((callback) => {
        callback({
            setLevel: vi.fn(),
            setTag: vi.fn(),
            setExtra: vi.fn(),
        });
    }),
    browserTracingIntegration: vi.fn(() => ({})),
    replayIntegration: vi.fn(() => ({})),
    ErrorBoundary: vi.fn(),
    withProfiler: vi.fn(),
}));

// Import after mocking
import * as Sentry from '@sentry/react';
import {
    initErrorReporting,
    captureError,
    captureMessage,
    setErrorReportingUser,
    addBreadcrumb,
    isErrorReportingEnabled,
} from '../utils/errorReporting';

describe('Error Reporting Service', () => {
    const originalEnv = { ...import.meta.env };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the env for each test
        vi.stubEnv('VITE_SENTRY_DSN', '');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('isErrorReportingEnabled', () => {
        it('should return false when VITE_SENTRY_DSN is not set', () => {
            vi.stubEnv('VITE_SENTRY_DSN', '');
            expect(isErrorReportingEnabled()).toBe(false);
        });

        it('should return true when VITE_SENTRY_DSN is set', () => {
            vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
            expect(isErrorReportingEnabled()).toBe(true);
        });
    });

    describe('initErrorReporting', () => {
        it('should not initialize Sentry when DSN is not set', () => {
            vi.stubEnv('VITE_SENTRY_DSN', '');
            initErrorReporting();
            expect(Sentry.init).not.toHaveBeenCalled();
        });

        it('should initialize Sentry when DSN is set', () => {
            vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
            initErrorReporting();
            expect(Sentry.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    dsn: 'https://test@sentry.io/123',
                })
            );
        });
    });

    describe('captureError', () => {
        it('should log error to console when reporting is disabled', () => {
            vi.stubEnv('VITE_SENTRY_DSN', '');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const testError = new Error('Test error');

            captureError(testError);

            expect(consoleSpy).toHaveBeenCalledWith('Error captured:', testError, undefined);
            expect(Sentry.withScope).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should capture error with Sentry when enabled', () => {
            vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const testError = new Error('Test error');

            captureError(testError);

            expect(Sentry.withScope).toHaveBeenCalled();
            expect(Sentry.captureException).toHaveBeenCalledWith(testError);
            consoleSpy.mockRestore();
        });

        it('should capture string errors by converting to Error', () => {
            vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            captureError('String error message');

            expect(Sentry.captureException).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'String error message',
                })
            );
            consoleSpy.mockRestore();
        });

        it('should set context when provided', () => {
            vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const testError = new Error('Test error');
            const mockScope = {
                setLevel: vi.fn(),
                setTag: vi.fn(),
                setExtra: vi.fn(),
            };
            vi.mocked(Sentry.withScope).mockImplementation((callback) => callback(mockScope));

            captureError(testError, 'error', {
                component: 'TestComponent',
                action: 'testAction',
                extra: { key: 'value' },
            });

            expect(mockScope.setTag).toHaveBeenCalledWith('component', 'TestComponent');
            expect(mockScope.setTag).toHaveBeenCalledWith('action', 'testAction');
            expect(mockScope.setExtra).toHaveBeenCalledWith('key', 'value');
            consoleSpy.mockRestore();
        });
    });

    describe('captureMessage', () => {
        it('should not capture message when reporting is disabled', () => {
            vi.stubEnv('VITE_SENTRY_DSN', '');

            captureMessage('Test message');

            expect(Sentry.withScope).not.toHaveBeenCalled();
        });

        it('should capture message when enabled', () => {
            vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');

            captureMessage('Test message');

            expect(Sentry.withScope).toHaveBeenCalled();
            expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message');
        });
    });

    describe('setErrorReportingUser', () => {
        it('should not set user when reporting is disabled', () => {
            vi.stubEnv('VITE_SENTRY_DSN', '');

            setErrorReportingUser({ id: '123', email: 'test@example.com' });

            expect(Sentry.setUser).not.toHaveBeenCalled();
        });

        it('should set user when enabled', () => {
            vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
            const user = { id: '123', email: 'test@example.com' };

            setErrorReportingUser(user);

            expect(Sentry.setUser).toHaveBeenCalledWith(user);
        });

        it('should clear user when null is passed', () => {
            vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');

            setErrorReportingUser(null);

            expect(Sentry.setUser).toHaveBeenCalledWith(null);
        });
    });

    describe('addBreadcrumb', () => {
        it('should not add breadcrumb when reporting is disabled', () => {
            vi.stubEnv('VITE_SENTRY_DSN', '');

            addBreadcrumb('Test breadcrumb', 'ui');

            expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
        });

        it('should add breadcrumb when enabled', () => {
            vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');

            addBreadcrumb('Test breadcrumb', 'ui', { action: 'click' });

            expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
                message: 'Test breadcrumb',
                category: 'ui',
                level: 'info',
                data: { action: 'click' },
            });
        });

        it('should use default category when not provided', () => {
            vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');

            addBreadcrumb('Test breadcrumb');

            expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'app',
                })
            );
        });
    });
});
