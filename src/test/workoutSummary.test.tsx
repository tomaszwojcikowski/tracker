import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkoutSummary } from '../components/WorkoutSummary';
import React from 'react';

describe('WorkoutSummary', () => {
    const defaultProps = {
        isOpen: true,
        onClose: () => {},
        title: 'Push Day',
        durationSeconds: 3600,
        exercises: [
            {
                name: 'Bench Press',
                prescription: '3x8',
                completedSets: 3,
                totalSets: 3,
                weight: 80,
                rpe: { 0: 8, 1: 8, 2: 9 }
            },
            {
                name: 'Shoulder Press',
                prescription: '3x10',
                completedSets: 2,
                totalSets: 3,
                weight: 20
            }
        ],
        week: 1,
        day: 1
    };

    it('renders workout title and stats', () => {
        render(<WorkoutSummary {...defaultProps} />);
        expect(screen.getByText('Workout Complete! 💪')).toBeDefined();
        expect(screen.getByText('Push Day • Week 1')).toBeDefined();
        expect(screen.getByText('1h 0m')).toBeDefined(); // Duration
        expect(screen.getByText('83%')).toBeDefined();
        expect(screen.getByText('5/6 sets')).toBeDefined();
    });

    it('renders exercise details', () => {
        render(<WorkoutSummary {...defaultProps} />);
        expect(screen.getAllByText('Bench Press').length).toBeGreaterThan(0);
        expect(screen.getByText('Shoulder Press')).toBeDefined();
    });

    it('renders weight and prescription', () => {
        render(<WorkoutSummary {...defaultProps} />);
        expect(screen.getByText('80 kg')).toBeDefined();
        expect(screen.getByText('20 kg')).toBeDefined();
        expect(screen.getByText('3x8')).toBeDefined();
        expect(screen.getByText('3x10')).toBeDefined();
    });
});
