/**
 * Notes Modal Tests
 *
 * Tests for the NotesModal component used to display exercise notes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotesModal } from '../components/modals/NotesModal';

describe('NotesModal', () => {
    const defaultProps = {
        exerciseName: 'Pull-Ups',
        notes: 'Focus on full range of motion. Keep core engaged.',
        isOpen: true,
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Reset body overflow style
        document.body.style.overflow = '';
    });

    describe('Rendering', () => {
        it('should render when isOpen is true', () => {
            render(<NotesModal {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Notes')).toBeInTheDocument();
        });

        it('should not render when isOpen is false', () => {
            render(<NotesModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('should display the exercise name', () => {
            render(<NotesModal {...defaultProps} />);

            expect(screen.getByText('Pull-Ups')).toBeInTheDocument();
        });

        it('should display the notes content', () => {
            render(<NotesModal {...defaultProps} />);

            expect(screen.getByText('Focus on full range of motion. Keep core engaged.')).toBeInTheDocument();
        });

        it('should display multiline notes correctly', () => {
            const multilineNotes = 'Line 1\nLine 2\nLine 3';
            render(<NotesModal {...defaultProps} notes={multilineNotes} />);

            // Use a custom matcher for multiline text
            expect(screen.getByText((content) => content.includes('Line 1') && content.includes('Line 2'))).toBeInTheDocument();
        });
    });

    describe('Interactions', () => {
        it('should call onClose when close button is clicked', () => {
            const onClose = vi.fn();
            render(<NotesModal {...defaultProps} onClose={onClose} />);

            const closeButton = screen.getByLabelText('Close');
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('should call onClose when backdrop is clicked', () => {
            const onClose = vi.fn();
            render(<NotesModal {...defaultProps} onClose={onClose} />);

            // The backdrop is the outer fixed div
            const backdrop = screen.getByRole('dialog').parentElement;
            fireEvent.click(backdrop);

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('should not call onClose when modal content is clicked', () => {
            const onClose = vi.fn();
            render(<NotesModal {...defaultProps} onClose={onClose} />);

            const dialog = screen.getByRole('dialog');
            fireEvent.click(dialog);

            expect(onClose).not.toHaveBeenCalled();
        });

        it('should call onClose when Escape key is pressed', () => {
            const onClose = vi.fn();
            render(<NotesModal {...defaultProps} onClose={onClose} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Accessibility', () => {
        it('should have proper aria attributes', () => {
            render(<NotesModal {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            expect(dialog).toHaveAttribute('aria-labelledby', 'notes-modal-title');
        });

        it('should have accessible close button', () => {
            render(<NotesModal {...defaultProps} />);

            expect(screen.getByLabelText('Close')).toBeInTheDocument();
        });

        it('should lock body scroll when open', () => {
            render(<NotesModal {...defaultProps} />);

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('should restore body scroll when closed', () => {
            const { rerender } = render(<NotesModal {...defaultProps} />);
            expect(document.body.style.overflow).toBe('hidden');

            rerender(<NotesModal {...defaultProps} isOpen={false} />);
            expect(document.body.style.overflow).toBe('');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty notes', () => {
            render(<NotesModal {...defaultProps} notes="" />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should handle very long notes', () => {
            const longNotes = 'A'.repeat(1000);
            render(<NotesModal {...defaultProps} notes={longNotes} />);

            expect(screen.getByText(longNotes)).toBeInTheDocument();
        });

        it('should handle special characters in notes', () => {
            const specialNotes = 'Use 2-1-1-0 tempo. RPE 8-9. Rest 90s between sets.';
            render(<NotesModal {...defaultProps} notes={specialNotes} />);

            expect(screen.getByText(specialNotes)).toBeInTheDocument();
        });

        it('should handle unicode characters in exercise name', () => {
            render(<NotesModal {...defaultProps} exerciseName="Butcher's Block Stretch" />);

            expect(screen.getByText("Butcher's Block Stretch")).toBeInTheDocument();
        });
    });
});
