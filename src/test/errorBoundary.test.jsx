import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }) => {
    if (shouldThrow) {
        throw new Error('Test error message');
    }
    return <div>No error</div>;
};

describe('ErrorBoundary', () => {
    // Suppress console.error for cleaner test output (React logs errors to console)
    const originalError = console.error;
    beforeEach(() => {
        console.error = vi.fn();
    });
    afterEach(() => {
        console.error = originalError;
    });

    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <div data-testid="child">Child content</div>
            </ErrorBoundary>
        );
        
        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders error UI when child throws an error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText(/Don't worry, your workout data is saved locally/)).toBeInTheDocument();
    });

    it('shows error details when expanded', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        
        // Find and click the details element
        const details = screen.getByText('Show error details');
        fireEvent.click(details);
        
        expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('provides refresh button', () => {
        // Mock window.location.reload
        const reloadMock = vi.fn();
        Object.defineProperty(window, 'location', {
            value: { reload: reloadMock },
            writable: true,
        });

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        
        const refreshButton = screen.getByText('Refresh Page');
        expect(refreshButton).toBeInTheDocument();
        
        fireEvent.click(refreshButton);
        expect(reloadMock).toHaveBeenCalled();
    });

    it('provides reset app state button', async () => {
        // Mock localStorage
        const removeItemMock = vi.fn();
        const getItemMock = vi.fn().mockReturnValue(null);
        Object.defineProperty(window, 'localStorage', {
            value: {
                removeItem: removeItemMock,
                getItem: getItemMock,
            },
            writable: true,
        });

        // Mock window.location.reload
        const reloadMock = vi.fn();
        Object.defineProperty(window, 'location', {
            value: { reload: reloadMock },
            writable: true,
        });

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        
        const resetButton = screen.getByText('Reset App State');
        fireEvent.click(resetButton);
        
        // Wait for async recovery
        await waitFor(() => {
            expect(removeItemMock).toHaveBeenCalledWith('tracker_app_state');
        });
    });

    it('provides clear all data button with confirmation', () => {
        // Mock window.confirm
        const confirmMock = vi.fn().mockReturnValue(false);
        window.confirm = confirmMock;

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        
        const clearButton = screen.getByText('Clear All Data');
        fireEvent.click(clearButton);
        
        expect(confirmMock).toHaveBeenCalledWith(
            'This will delete ALL workout data. Are you sure?'
        );
    });

    it('renders custom fallback when provided', () => {
        const customFallback = ({ error }) => (
            <div data-testid="custom-fallback">
                Custom error: {error.message}
            </div>
        );

        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        
        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
        expect(screen.getByText('Custom error: Test error message')).toBeInTheDocument();
    });

    it('logs error to console', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        
        expect(console.error).toHaveBeenCalled();
    });
});
