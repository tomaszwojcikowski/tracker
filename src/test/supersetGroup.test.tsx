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
        name: 'Bulgarian Split Squat',
        prescription: '3 x 8',
        notes: 'Left side. EMOM. Unilateral work.',
        sets: [false, false, false],
        defaultSets: 3,
        weight: '16',
        isBodyweight: false,
        restTime: 60,
        restSeconds: 60,
        isEmom: true,
        isUnilateral: true,
      },
      {
        exId: 'bss_right',
        name: 'Bulgarian Split Squat',
        prescription: '3 x 8',
        notes: 'Right side. EMOM. Unilateral work.',
        sets: [false, false, false],
        defaultSets: 3,
        weight: '16',
        isBodyweight: false,
        restTime: 60,
        restSeconds: 60,
        isEmom: true,
        isUnilateral: true,
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

      // Should show short names (or full names if short names not mocked for base name)
      // Since we changed the name to "Bulgarian Split Squat", and the mock only has (Left)/(Right),
      // it will return "Bulgarian Split Squat".
      // But wait, we have two exercises with the same name now.
      const elements = screen.getAllByText('Bulgarian Split Squat');
      expect(elements).toHaveLength(2);
    });

    it('should show EMOM SUPERSET badge when exercises have isEmom flag', () => {
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

      it('should display EMOM timer button with 60s interval by default', () => {
        render(
          <SupersetGroup
            exercises={mockExercises}
            haptic={mockHaptic}
            onToggleRound={vi.fn()}
            onWeightChange={vi.fn()}
            onCompleteAllRounds={vi.fn()}
            onToggleEmomTimer={vi.fn()}
          />
        );

        expect(screen.getByRole('button', { name: 'Start EMOM timer with 60 second interval' })).toBeInTheDocument();
        expect(screen.getByText('60s')).toBeInTheDocument();
      });

    it('should show plain SUPERSET badge when exercises do not have isEmom flag', () => {
      const nonEmomExercises = [
        {
          exId: 'ring_rows',
          name: 'Ring Rows',
          prescription: '3 x 15',
          sets: [false, false, false],
          defaultSets: 3,
          weight: '',
          isBodyweight: true,
          restTime: 60,
          isEmom: false,
        },
        {
          exId: 'incline_pushups',
          name: 'Incline Push-Ups',
          prescription: '3 x 10',
          sets: [false, false, false],
          defaultSets: 3,
          weight: '',
          isBodyweight: true,
          restTime: 60,
          isEmom: false,
        },
      ];

      render(
        <SupersetGroup
          exercises={nonEmomExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Should show plain SUPERSET badge, not EMOM SUPERSET
      expect(screen.getByText('SUPERSET')).toBeInTheDocument();
      expect(screen.queryByText(/EMOM SUPERSET/)).not.toBeInTheDocument();
    });

    it('should display total rounds in expanded header', () => {
      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Should show "3 Rounds" text
      expect(screen.getByText('3 Rounds')).toBeInTheDocument();
    });

    it('should use max set count across exercises for total rounds', () => {
      const mixedSetExercises = [
        {
          ...mockExercises[0],
          defaultSets: 2,
          sets: [false, false],
        },
        {
          ...mockExercises[1],
          defaultSets: 4,
          sets: [false, false, false, false],
        },
      ];

      render(
        <SupersetGroup
          exercises={mixedSetExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      expect(screen.getByText('4 Rounds')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Round 4' })).toBeInTheDocument();
    });

    it('should display singular "Round" for single round superset', () => {
      const singleRoundExercises = [
        {
          ...mockExercises[0],
          defaultSets: 1,
          sets: [false],
        },
        {
          ...mockExercises[1],
          defaultSets: 1,
          sets: [false],
        },
      ];

      render(
        <SupersetGroup
          exercises={singleRoundExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Should show "1 Round" text
      expect(screen.getByText('1 Round')).toBeInTheDocument();
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
        60,
        undefined,
        true,
        60
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

    it('should call onToggleEmomTimer with EmomConfig when EMOM button clicked', () => {
      const onToggleEmomTimer = vi.fn();

      render(
        <SupersetGroup
          exercises={mockExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
          onToggleEmomTimer={onToggleEmomTimer}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Start EMOM timer with 60 second interval' }));

      expect(mockHaptic.tick).toHaveBeenCalled();
      // Should pass EmomConfig object with totalRounds (3) and interval (60)
      expect(onToggleEmomTimer).toHaveBeenCalledWith({ totalRounds: 3, interval: 60 });
    });

    it('should pass correct totalRounds based on max sets when EMOM button clicked', () => {
      const onToggleEmomTimer = vi.fn();
      const mixedSetExercises = [
        {
          ...mockExercises[0],
          defaultSets: 4,
          sets: [false, false, false, false],
        },
        {
          ...mockExercises[1],
          defaultSets: 2,
          sets: [false, false],
        },
      ];

      render(
        <SupersetGroup
          exercises={mixedSetExercises}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
          onToggleEmomTimer={onToggleEmomTimer}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Start EMOM timer with 60 second interval' }));

      // totalRounds should be max(4, 2) = 4
      expect(onToggleEmomTimer).toHaveBeenCalledWith({ totalRounds: 4, interval: 60 });
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

  describe('Round Toggle Behavior', () => {
    it('should pass all exercise IDs when toggling any round', () => {
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

      // Click round 2 button
      fireEvent.click(screen.getByRole('button', { name: 'Round 2' }));

      // Should be called with all exercise IDs
      expect(onToggleRound).toHaveBeenCalledWith(
        ['bss_left', 'bss_right'],
        1, // roundIndex for Round 2
        3, // defaultSets
        60, // restTime from first exercise
        undefined,
        true,
        60 // emomInterval
      );
    });

    it('should pass all exercise IDs when toggling a completed round (unmarking)', () => {
      const onToggleRound = vi.fn();
      const completedRound1 = [
        { ...mockExercises[0], sets: [true, false, false] },
        { ...mockExercises[1], sets: [true, false, false] },
      ];

      render(
        <SupersetGroup
          exercises={completedRound1}
          haptic={mockHaptic}
          onToggleRound={onToggleRound}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Click the completed round 1 button to unmark it
      fireEvent.click(screen.getByRole('button', { name: 'Round 1 completed' }));

      // Should be called with all exercise IDs to unmark all
      expect(onToggleRound).toHaveBeenCalledWith(
        ['bss_left', 'bss_right'],
        0, // roundIndex for Round 1
        3,
        60,
        undefined,
        true,
        60 // emomInterval
      );
    });

    it('should show round as incomplete when only some exercises have that set done', () => {
      // Only first exercise has round 1 complete
      const mixedState = [
        { ...mockExercises[0], sets: [true, false, false] },
        { ...mockExercises[1], sets: [false, false, false] },
      ];

      render(
        <SupersetGroup
          exercises={mixedState}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Round 1 should NOT show as completed since not all exercises have it done
      expect(screen.getByRole('button', { name: 'Round 1' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Round 1 completed' })).not.toBeInTheDocument();
    });

    it('should show round as complete only when ALL exercises have that set done', () => {
      const allRound1Complete = [
        { ...mockExercises[0], sets: [true, false, false] },
        { ...mockExercises[1], sets: [true, false, false] },
      ];

      render(
        <SupersetGroup
          exercises={allRound1Complete}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Round 1 should show as completed
      expect(screen.getByRole('button', { name: 'Round 1 completed' })).toBeInTheDocument();
      // Round 2 and 3 should still be incomplete
      expect(screen.getByRole('button', { name: 'Round 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Round 3' })).toBeInTheDocument();
    });

    it('should correctly count completed rounds for display', () => {
      // All rounds complete for all exercises
      const fullyComplete = [
        { ...mockExercises[0], sets: [true, true, true] },
        { ...mockExercises[1], sets: [true, true, true] },
      ];

      render(
        <SupersetGroup
          exercises={fullyComplete}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Should show 3/3 in collapsed state
      expect(screen.getByText('3/3')).toBeInTheDocument();
    });

    it('should not count round as complete when only partial exercises done', () => {
      // Mixed: first exercise has round 1+2, second only has round 1
      const mixedCompletion = [
        { ...mockExercises[0], sets: [true, true, false] },
        { ...mockExercises[1], sets: [true, false, false] },
      ];

      render(
        <SupersetGroup
          exercises={mixedCompletion}
          haptic={mockHaptic}
          onToggleRound={vi.fn()}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      // Only round 1 is fully complete (both exercises have sets[0] = true)
      expect(screen.getByRole('button', { name: 'Round 1 completed' })).toBeInTheDocument();
      // Round 2 is NOT complete (only first exercise has it)
      expect(screen.getByRole('button', { name: 'Round 2' })).toBeInTheDocument();
    });

    it('should work with more than 2 exercises in the superset', () => {
      const onToggleRound = vi.fn();
      const threeExercises = [
        ...mockExercises,
        {
          exId: 'step_ups',
          name: 'Step Ups',
          sets: [false, false, false],
          defaultSets: 3,
          weight: '10',
          isBodyweight: false,
          restTime: 60,
          restSeconds: 60,
        },
      ];

      render(
        <SupersetGroup
          exercises={threeExercises}
          haptic={mockHaptic}
          onToggleRound={onToggleRound}
          onWeightChange={vi.fn()}
          onCompleteAllRounds={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Round 1' }));

      // Should include all 3 exercise IDs
      expect(onToggleRound).toHaveBeenCalledWith(
        ['bss_left', 'bss_right', 'step_ups'],
        0,
        3,
        60,
        undefined,
        true,
        60
      );
    });
  });
});
