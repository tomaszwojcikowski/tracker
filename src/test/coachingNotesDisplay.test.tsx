/**
 * Test to verify coaching notes display in workout player detail modal
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExerciseDetailModal } from '../components/modals/ExerciseDetailModal';

describe('Coaching Notes Display in Detail Modal', () => {
    const defaultProps = {
        exerciseName: 'Pull-Ups',
        onClose: vi.fn(),
        isOpen: true,
    };

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should display coaching notes when provided in metadata', () => {
        const metadata = {
            prescription: '3x8 reps',
            notes: 'Start with bodyweight',
            coachingNotes: 'Start from dead hang with arms fully extended and shoulders engaged. Pull chin over bar using lat activation.',
            restTime: 120,
            isBodyweight: true,
        };

        render(<ExerciseDetailModal {...defaultProps} metadata={metadata} />);

        // Verify "Coaching Notes" heading is displayed
        expect(screen.getByText('Coaching Notes')).toBeInTheDocument();

        // Verify coaching notes content is displayed
        expect(screen.getByText(/Start from dead hang with arms fully extended/)).toBeInTheDocument();
    });

    it('should not display coaching notes section when not provided', () => {
        const metadata = {
            prescription: '3x8 reps',
            notes: 'Start with bodyweight',
            restTime: 120,
            isBodyweight: true,
        };

        render(<ExerciseDetailModal {...defaultProps} metadata={metadata} />);

        // Verify "Coaching Notes" heading is NOT displayed
        expect(screen.queryByText('Coaching Notes')).not.toBeInTheDocument();
    });

    it('should display coaching notes alongside other metadata', () => {
        const metadata = {
            prescription: '3×5 reps',
            notes: 'Add weight if comfortable',
            coachingNotes: 'Maintain strict form throughout the movement.',
            restTime: 120,
            isBodyweight: false,
            cues: ['Chest up', 'Core tight'],
        };

        render(<ExerciseDetailModal {...defaultProps} metadata={metadata} />);

        // All sections should be visible
        expect(screen.getByText('Exercise Notes')).toBeInTheDocument();
        expect(screen.getByText('Coaching Notes')).toBeInTheDocument();
        expect(screen.getByText('Coaching Cues')).toBeInTheDocument();

        // Content should be present
        expect(screen.getByText(/Add weight if comfortable/)).toBeInTheDocument();
        expect(screen.getByText(/Maintain strict form/)).toBeInTheDocument();
        expect(screen.getByText('Chest up')).toBeInTheDocument();
    });
});
