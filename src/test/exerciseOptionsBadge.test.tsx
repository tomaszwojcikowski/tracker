import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExerciseOptionsBadge } from '../components/ExerciseOptionsBadge';

describe('ExerciseOptionsBadge', () => {
    it('should show option count when no option is selected', () => {
        render(
            <ExerciseOptionsBadge
                optionCount={3}
                hasSelection={false}
            />
        );
        expect(screen.getByText('3 options')).toBeDefined();
    });

    it('should show selected option name when an option is selected', () => {
        render(
            <ExerciseOptionsBadge
                optionCount={3}
                hasSelection={true}
                selectedOptionName="Weighted"
            />
        );
        expect(screen.getByText('Weighted')).toBeDefined();
        expect(screen.queryByText('3 options')).toBeNull();
    });

    it('should call onClick when clicked', () => {
        const handleClick = vi.fn();
        render(
            <ExerciseOptionsBadge
                optionCount={3}
                hasSelection={false}
                onClick={handleClick}
            />
        );

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalled();
    });

    it('should show correct title when selection is made', () => {
        render(
            <ExerciseOptionsBadge
                optionCount={3}
                hasSelection={true}
                selectedOptionName="Weighted"
            />
        );

        const button = screen.getByRole('button');
        expect(button.getAttribute('title')).toBe('Chosen: Weighted. Tap to change.');
    });
});
