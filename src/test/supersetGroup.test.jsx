import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

/**
 * Tests for SupersetGroup component
 * Tests the grouped EMOM exercise display with shared set counter
 */

// Mock the constants module
vi.mock('../constants', () => ({
  getShortExerciseName: (name) => {
    const shortNames = {
      'Bulgarian Split Squat (Left)': 'BSS (L)',
      'Bulgarian Split Squat (Right)': 'BSS (R)',
    };
    return shortNames[name] || name;
  },
}));

// Mock the NotesModal
vi.mock('../components/modals', () => ({
  NotesModal: ({ isOpen, onClose, exerciseName, notes }) =>
    isOpen ? (
      <div data-testid="notes-modal">
        <div>{exerciseName}</div>
        <div>{notes}</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe('SupersetGroup', () => {
  let SupersetGroup;
  let mockHaptic;
  let mockExercises;

  beforeEach(async () => {
    // Reset mocks
    vi.resetModules();

    // Import the component
    const module = await import('../components/SupersetGroup');
    SupersetGroup = module.SupersetGroup;

    mockHaptic = {
      tick: vi.fn(),
      success: vi.fn(),
      bump: vi.fn(),
    };

    mockExercises = [
      {
        exId: 'bss_left',
        name: 'Bulgarian Split Squat (Left)',
        prescription: '3 x 8',
        notes: 'EMOM. Unilateral work.',
        sets: [false, false, false],
        defaultSets: 3,
        weight: '16',
        isBodyweight: false,
        restTime: 60,
      },
      {
        exId: 'bss_right',
        name: 'Bulgarian Split Squat (Right)',
        prescription: '3 x 8',
        notes: 'EMOM. Unilateral work.',
        sets: [false, false, false],
        defaultSets: 3,
        weight: '16',
        isBodyweight: false,
        restTime: 60,
      },
    ];
  });

  describe('Rendering', () => {
    it('should render all exercises in the group', () => {
      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Should show short names
      expect(screen.getByText('BSS (L)')).toBeInTheDocument();
      expect(screen.getByText('BSS (R)')).toBeInTheDocument();
    });

    it('should show EMOM SUPERSET badge', () => {
      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // The text is split because the icon renders as "Zap" before the text
      expect(screen.getByText(/EMOM SUPERSET/)).toBeInTheDocument();
    });

    it('should render shared round buttons', () => {
      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Should have 3 round buttons
      expect(screen.getByRole('button', { name: 'Round 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Round 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Round 3' })).toBeInTheDocument();
    });

    it('should show complete all button when there are incomplete rounds', () => {
      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'Complete all rounds' })).toBeInTheDocument();
    });

    it('should show weight steppers for weighted exercises', () => {
      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Should show weight values
      expect(screen.getAllByText('16')).toHaveLength(2);
    });

    it('should not show weight stepper for bodyweight exercises', () => {
      const bodyweightExercises = [
        { ...mockExercises[0], isBodyweight: true, weight: '' },
        { ...mockExercises[1], isBodyweight: true, weight: '' },
      ];

      render(
        <SupersetGroup
          exercises={bodyweightExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Should not show decrease/increase weight buttons
      expect(screen.queryByRole('button', { name: 'Decrease weight' })).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onToggleRound with all exercise IDs when round button clicked', () => {
      const onToggleRound = vi.fn();

      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={onToggleRound}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Round 1' }));

      expect(mockHaptic.tick).toHaveBeenCalled();
      expect(onToggleRound).toHaveBeenCalledWith(
        ['bss_left', 'bss_right'],
        0,
        3,
        60
      );
    });

    it('should call onCompleteAllRounds when complete all button clicked', () => {
      const onCompleteAllRounds = vi.fn();

      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={onCompleteAllRounds}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Complete all rounds' }));

      expect(mockHaptic.success).toHaveBeenCalled();
      expect(onCompleteAllRounds).toHaveBeenCalledWith(
        ['bss_left', 'bss_right'],
        3
      );
    });

    it('should call onWeightChange when weight stepper is used', () => {
      const onWeightChange = vi.fn();

      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={onWeightChange}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Click the first increase weight button
      const increaseButtons = screen.getAllByRole('button', { name: 'Increase weight' });
      fireEvent.click(increaseButtons[0]);

      expect(mockHaptic.tick).toHaveBeenCalled();
      expect(onWeightChange).toHaveBeenCalledWith('bss_left', '17');
    });
  });

  describe('Completion State', () => {
    it('should show collapsed state when all rounds complete', () => {
      const completedExercises = mockExercises.map(ex => ({
        ...ex,
        sets: [true, true, true],
      }));

      render(
        <SupersetGroup
          exercises={completedExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Should show completion count
      expect(screen.getByText('3/3')).toBeInTheDocument();
    });

    it('should show round as completed when all exercises have that set done', () => {
      const partiallyComplete = [
        { ...mockExercises[0], sets: [true, false, false] },
        { ...mockExercises[1], sets: [true, false, false] },
      ];

      render(
        <SupersetGroup
          exercises={partiallyComplete}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Round 1 button should show checkmark (completed)
      const round1Button = screen.getByRole('button', { name: 'Round 1 completed' });
      expect(round1Button).toBeInTheDocument();
    });
  });

  describe('Notes Modal', () => {
    it('should show notes button when exercise has notes', () => {
      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      const notesButtons = screen.getAllByRole('button', { name: 'View notes' });
      expect(notesButtons).toHaveLength(2);
    });

    it('should open notes modal when notes button clicked', () => {
      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      const notesButtons = screen.getAllByRole('button', { name: 'View notes' });
      fireEvent.click(notesButtons[0]);

      expect(screen.getByTestId('notes-modal')).toBeInTheDocument();
    });
  });
});
