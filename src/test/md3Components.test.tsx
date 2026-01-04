/**
 * Tests for MD3 Dialog and Snackbar components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Dialog, ConfirmDialog } from '../components/Dialog';
import { Snackbar, useSnackbar } from '../components/Snackbar';

describe('Dialog Component', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when closed', () => {
        render(
            <Dialog isOpen={false} onClose={mockOnClose}>
                Dialog content
            </Dialog>
        );
        expect(screen.queryByText('Dialog content')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
        render(
            <Dialog isOpen={true} onClose={mockOnClose}>
                Dialog content
            </Dialog>
        );
        expect(screen.getByText('Dialog content')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
        render(
            <Dialog isOpen={true} onClose={mockOnClose} title="Test Title">
                Dialog content
            </Dialog>
        );
        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
        render(
            <Dialog
                isOpen={true}
                onClose={mockOnClose}
                actions={[
                    { label: 'Cancel', onClick: mockOnClose },
                    { label: 'Okay', onClick: vi.fn() },
                ]}
            >
                Dialog content
            </Dialog>
        );
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Okay')).toBeInTheDocument();
    });

    it('should call onClose when clicking scrim if dismissOnClickOutside is true', () => {
        render(
            <Dialog isOpen={true} onClose={mockOnClose} dismissOnClickOutside={true}>
                Dialog content
            </Dialog>
        );
        // Click on the scrim (the outer element)
        const scrim = screen.getByRole('dialog').closest('[class*="bg-black"]');
        if (scrim) {
            fireEvent.click(scrim);
            expect(mockOnClose).toHaveBeenCalled();
        }
    });

    it('should call onClose when pressing Escape', () => {
        render(
            <Dialog isOpen={true} onClose={mockOnClose}>
                Dialog content
            </Dialog>
        );
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have proper MD3 styling with 28dp radius', () => {
        const { container } = render(
            <Dialog isOpen={true} onClose={mockOnClose}>
                Dialog content
            </Dialog>
        );
        const dialog = container.querySelector('[role="dialog"]');
        expect(dialog).toHaveClass('rounded-[28px]');
    });

    it('should have elevation-3 shadow', () => {
        const { container } = render(
            <Dialog isOpen={true} onClose={mockOnClose}>
                Dialog content
            </Dialog>
        );
        const dialog = container.querySelector('[role="dialog"]');
        expect(dialog).toHaveClass('shadow-elevation-3');
    });
});

describe('ConfirmDialog Component', () => {
    const mockOnConfirm = vi.fn();
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render with title and message', () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Confirm Action"
                message="Are you sure?"
                onConfirm={mockOnConfirm}
                onClose={mockOnClose}
            />
        );
        expect(screen.getByText('Confirm Action')).toBeInTheDocument();
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button clicked', () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Action"
                message="Sure?"
                onConfirm={mockOnConfirm}
                onClose={mockOnClose}
            />
        );
        fireEvent.click(screen.getByTestId('confirm-button'));
        expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('should call onClose when cancel button clicked', () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Action"
                message="Sure?"
                onConfirm={mockOnConfirm}
                onClose={mockOnClose}
            />
        );
        fireEvent.click(screen.getByText('Cancel'));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should use custom button labels', () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Remove Item"
                message="Remove this item?"
                confirmLabel="Remove"
                cancelLabel="Keep"
                onConfirm={mockOnConfirm}
                onClose={mockOnClose}
            />
        );
        expect(screen.getByText('Remove')).toBeInTheDocument();
        expect(screen.getByText('Keep')).toBeInTheDocument();
    });

    it('should show destructive styling when destructive is true', () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Delete Item"
                message="Delete?"
                destructive={true}
                onConfirm={mockOnConfirm}
                onClose={mockOnClose}
            />
        );
        const confirmButton = screen.getByTestId('confirm-button');
        expect(confirmButton).toHaveClass('text-sys-error');
    });
});

describe('Snackbar Component', () => {
    const mockOnClose = vi.fn();
    const mockOnAction = vi.fn();

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should not render when closed', () => {
        render(<Snackbar isOpen={false} message="Test message" onClose={mockOnClose} />);
        expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
        render(<Snackbar isOpen={true} message="Test message" onClose={mockOnClose} />);
        expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render action button when provided', () => {
        render(
            <Snackbar
                isOpen={true}
                message="Changes saved"
                actionLabel="Undo"
                onAction={mockOnAction}
                onClose={mockOnClose}
            />
        );
        expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should call onAction when action clicked', () => {
        render(
            <Snackbar
                isOpen={true}
                message="Changes saved"
                actionLabel="Undo"
                onAction={mockOnAction}
                onClose={mockOnClose}
            />
        );
        fireEvent.click(screen.getByText('Undo'));
        expect(mockOnAction).toHaveBeenCalled();
    });

    it('should auto-dismiss after duration', () => {
        render(
            <Snackbar
                isOpen={true}
                message="Auto-dismiss test"
                duration={4000}
                onClose={mockOnClose}
            />
        );
        expect(mockOnClose).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(4000);
        });

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not auto-dismiss when duration is 0', () => {
        render(
            <Snackbar
                isOpen={true}
                message="Persistent snackbar"
                duration={0}
                onClose={mockOnClose}
            />
        );

        act(() => {
            vi.advanceTimersByTime(10000);
        });

        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should have MD3 inverse surface styling', () => {
        const { container } = render(
            <Snackbar isOpen={true} message="Test" onClose={mockOnClose} />
        );
        const snackbar = container.querySelector('[role="alert"]');
        expect(snackbar).toHaveClass('bg-sys-inverseSurface');
    });

    it('should have elevation-3 shadow', () => {
        const { container } = render(
            <Snackbar isOpen={true} message="Test" onClose={mockOnClose} />
        );
        const snackbar = container.querySelector('[role="alert"]');
        expect(snackbar).toHaveClass('shadow-elevation-3');
    });

    it('should apply success type styling', () => {
        const { container } = render(
            <Snackbar isOpen={true} message="Success!" type="success" onClose={mockOnClose} />
        );
        const snackbar = container.querySelector('[role="alert"]');
        expect(snackbar).toHaveClass('bg-sys-successContainer');
    });

    it('should apply error type styling', () => {
        const { container } = render(
            <Snackbar isOpen={true} message="Error!" type="error" onClose={mockOnClose} />
        );
        const snackbar = container.querySelector('[role="alert"]');
        expect(snackbar).toHaveClass('bg-sys-errorContainer');
    });
});

describe('useSnackbar Hook', () => {
    const TestComponent = () => {
        const { snackbarProps, showSnackbar, hideSnackbar } = useSnackbar();

        return (
            <div>
                <button onClick={() => showSnackbar({ message: 'Test message' })}>Show</button>
                <button onClick={() => showSnackbar({ message: 'With action', actionLabel: 'Undo' })}>
                    Show with action
                </button>
                <button onClick={hideSnackbar}>Hide</button>
                {snackbarProps.isOpen && <span data-testid="snackbar-message">{snackbarProps.message}</span>}
                {snackbarProps.actionLabel && <span data-testid="action-label">{snackbarProps.actionLabel}</span>}
            </div>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should start with snackbar closed', () => {
        render(<TestComponent />);
        expect(screen.queryByTestId('snackbar-message')).not.toBeInTheDocument();
    });

    it('should show snackbar when showSnackbar called', () => {
        render(<TestComponent />);
        fireEvent.click(screen.getByText('Show'));
        expect(screen.getByTestId('snackbar-message')).toHaveTextContent('Test message');
    });

    it('should show snackbar with options', () => {
        render(<TestComponent />);
        fireEvent.click(screen.getByText('Show with action'));
        expect(screen.getByTestId('snackbar-message')).toHaveTextContent('With action');
        expect(screen.getByTestId('action-label')).toHaveTextContent('Undo');
    });

    it('should hide snackbar when hideSnackbar called', () => {
        render(<TestComponent />);
        fireEvent.click(screen.getByText('Show'));
        expect(screen.getByTestId('snackbar-message')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Hide'));
        expect(screen.queryByTestId('snackbar-message')).not.toBeInTheDocument();
    });
});
