import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DensityRepControls } from '../components/DensityRepControls';

/**
 * DensityRepControls Component Tests
 *
 * Tests the density rep tracking controls for counting reps in chunks,
 * showing progress, and marking exercises as complete.
 */

// Mock haptic interface
const createMockHaptic = () => ({
    tick: vi.fn(),
    bump: vi.fn(),
    success: vi.fn(),
});

describe('DensityRepControls', () => {
    let mockHaptic: ReturnType<typeof createMockHaptic>;
    let mockUpdateRepChunks: ReturnType<typeof vi.fn>;
    let mockMarkComplete: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockHaptic = createMockHaptic();
        mockUpdateRepChunks = vi.fn();
        mockMarkComplete = vi.fn();
    });

    describe('Initial State', () => {
        it('should render with no chunks', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            expect(screen.getByText('0/30')).toBeInTheDocument();
            expect(screen.getByText('0%')).toBeInTheDocument();
            expect(screen.getByLabelText('Mark as complete')).toBeInTheDocument();
        });

        it('should calculate total reps from chunks', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[5, 3, 4]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            expect(screen.getByText('12/30')).toBeInTheDocument();
            expect(screen.getByText('40%')).toBeInTheDocument();
        });

        it('should show completion state when all reps done', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[10, 10, 10]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            expect(screen.getByText('30/30')).toBeInTheDocument();
            expect(screen.getByText('100%')).toBeInTheDocument();
            expect(screen.getByLabelText('Mark as complete')).toBeInTheDocument();
        });

        it('should show completed state when marked complete', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[5, 3]}
                    isComplete={true}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            expect(screen.getByLabelText('Mark as incomplete')).toBeInTheDocument();
        });
    });

    describe('Progress Bar', () => {
        it('should show correct progress percentage', () => {
            render(
                <DensityRepControls
                    targetReps={50}
                    repChunks={[10, 15]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            expect(screen.getByText('25/50')).toBeInTheDocument();
            expect(screen.getByText('50%')).toBeInTheDocument();
        });

        it('should not exceed 100% progress', () => {
            render(
                <DensityRepControls
                    targetReps={20}
                    repChunks={[10, 15]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            // 25 reps out of 20 = 125%, but should cap at 100%
            expect(screen.getByText('25/20')).toBeInTheDocument();
            expect(screen.getByText('100%')).toBeInTheDocument();
        });
    });

    describe('Quick Add Buttons', () => {
        it('should add 1 rep when +1 button clicked', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            const button = screen.getByText('+1');
            fireEvent.click(button);

            expect(mockUpdateRepChunks).toHaveBeenCalledWith([1]);
            expect(mockHaptic.tick).toHaveBeenCalled();
        });

        it('should add 3 reps when +3 button clicked', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[5]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            const button = screen.getByText('+3');
            fireEvent.click(button);

            expect(mockUpdateRepChunks).toHaveBeenCalledWith([5, 3]);
            expect(mockHaptic.tick).toHaveBeenCalled();
        });

        it('should add 5 reps when +5 button clicked', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[5, 3]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            const button = screen.getByText('+5');
            fireEvent.click(button);

            expect(mockUpdateRepChunks).toHaveBeenCalledWith([5, 3, 5]);
            expect(mockHaptic.tick).toHaveBeenCalled();
        });
    });

    describe('Custom Amount Input', () => {
        it('should add custom amount when Add button clicked', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            const input = screen.getByRole('spinbutton');
            const addButton = screen.getByRole('button', { name: /Add custom rep count/i });

            fireEvent.change(input, { target: { value: '7' } });
            fireEvent.click(addButton);

            expect(mockUpdateRepChunks).toHaveBeenCalledWith([7]);
            expect(mockHaptic.tick).toHaveBeenCalled();
        });

        it('should clear input after adding', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            const input = screen.getByRole('spinbutton') as HTMLInputElement;
            const addButton = screen.getByRole('button', { name: /Add custom rep count/i });

            fireEvent.change(input, { target: { value: '7' } });
            fireEvent.click(addButton);

            expect(input.value).toBe('');
        });

        it('should not add invalid amount', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            const input = screen.getByRole('spinbutton');
            const addButton = screen.getByRole('button', { name: /Add custom rep count/i });

            fireEvent.change(input, { target: { value: '0' } });
            fireEvent.click(addButton);

            expect(mockUpdateRepChunks).not.toHaveBeenCalled();
        });
    });

    describe('Rep Chunk Display and Removal', () => {
        it('should display all rep chunks', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[5, 3, 4, 2]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            // Find chunk elements by their role and check count
            const chunkElements = screen.getAllByRole('button', { name: /Remove \d+ reps/i });
            expect(chunkElements).toHaveLength(4);
        });

        it('should remove chunk when X button clicked', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[5, 3, 4]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            const removeButtons = screen.getAllByRole('button', { name: /Remove .* reps/ });
            fireEvent.click(removeButtons[1]); // Remove middle chunk (3)

            expect(mockUpdateRepChunks).toHaveBeenCalledWith([5, 4]);
            expect(mockHaptic.tick).toHaveBeenCalled();
        });

        it('should not show chunk list when no chunks', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            // Chunks are only visible when repChunks.length > 0
            expect(screen.queryByRole('button', { name: /Remove \d+ reps/i })).not.toBeInTheDocument();
        });
    });

    describe('Mark Complete Functionality', () => {
        it('should toggle complete state when button clicked', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[10, 8]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            const button = screen.getByLabelText('Mark as complete');
            fireEvent.click(button);

            expect(mockMarkComplete).toHaveBeenCalledWith(true);
            expect(mockHaptic.bump).toHaveBeenCalled();
        });

        it('should allow marking incomplete', () => {
            render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[30]}
                    isComplete={true}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            const button = screen.getByLabelText('Mark as incomplete');
            fireEvent.click(button);

            expect(mockMarkComplete).toHaveBeenCalledWith(false);
            expect(mockHaptic.bump).toHaveBeenCalled();
        });

        it('should auto-mark complete when all reps are done', async () => {
            const { rerender } = render(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[10, 10, 9]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            // Should not auto-complete yet
            expect(mockMarkComplete).not.toHaveBeenCalled();

            // Update to reach target
            rerender(
                <DensityRepControls
                    targetReps={30}
                    repChunks={[10, 10, 10]}
                    isComplete={false}
                    haptic={mockHaptic}
                    onUpdateRepChunks={mockUpdateRepChunks}
                    onMarkComplete={mockMarkComplete}
                />
            );

            // Should auto-complete
            await waitFor(() => {
                expect(mockMarkComplete).toHaveBeenCalledWith(true);
            });
        });
    });
});
