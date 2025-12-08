/**
 * Flow Exercise Feature Tests
 *
 * Tests for the v2.4 flow exercise feature which allows predefined
 * movement sequences for mobility exercises.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Import after mocking (setup.ts handles localStorage and lucide-react mocks)
import {
  convertV2ToInternal,
  loadWorkoutPlan,
  type ExerciseOption,
  type ScheduleEntry,
} from '../workout-plan-utils';
import { FlowMovementsDisplay } from '../components/FlowMovementsDisplay';

// ============================================================================
// TEST DATA
// ============================================================================

const mockV24PlanWithFlow = {
  formatVersion: '2.4.0',
  plan: {
    id: 'test-flow-plan',
    name: 'Test Flow Plan',
    description: 'Test plan with flow exercises',
    version: '1.0.0',
    author: 'Test',
    durationWeeks: 1,
    daysPerWeek: [1],
    targetLevel: 'intermediate',
    goals: ['mobility'],
    equipment: [],
    exerciseTemplates: [
      {
        id: 'ex-test-flow',
        exerciseName: 'Test Mobility Flow',
        category: 'mobility',
        sets: 1,
        repsType: 'time',
        repsValue: 300,
        repsUnit: 'seconds',
        loadUnit: 'bodyweight',
        restSeconds: 0,
        isFlow: true,
        notes: 'Choose a flow that matches your goals',
        exerciseOptions: [
          {
            optionName: 'Flow A - Basic',
            description: 'Basic flow sequence',
            flowMovements: [
              'Deep Squat',
              'Spiderman Lunge',
              'Downward Dog',
              'Stand',
            ],
          },
          {
            optionName: 'Flow B - Advanced',
            description: 'Advanced flow sequence',
            flowMovements: [
              'Deep Squat',
              'Spiderman Lunge',
              'Downward Dog',
              'Plank',
              'Push-up',
              'Upward Dog',
              'Stand',
            ],
          },
        ],
      },
      {
        id: 'ex-regular',
        exerciseName: 'Regular Exercise',
        category: 'main',
        sets: 3,
        repsType: 'reps',
        repsValue: 10,
      },
    ],
    phases: [
      {
        number: 1,
        name: 'Test Phase',
        startWeek: 1,
        endWeek: 1,
        focus: 'Testing',
        weeks: [
          {
            weekNumber: 1,
            description: 'Test Week',
            days: [
              {
                dayNumber: 1,
                name: 'Test Day',
                type: 'mobility',
                exercises: [
                  { $ref: 'ex-test-flow' },
                  { $ref: 'ex-regular' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

const mockFlowOptions: ExerciseOption[] = [
  {
    optionName: 'Flow 1 - Squat/Lunge',
    description: 'Dynamic squat and lunge sequence',
    flowMovements: [
      'Deep Squat',
      'Spiderman Lunge',
      'Downward Dog',
      'Plank',
      'Stand',
    ],
  },
  {
    optionName: 'Flow 2 - Beast to Plank',
    description: 'Quadruped-based flow',
    flowMovements: [
      'Quadruped',
      'Beast',
      'Plank',
      'Pike',
      'Return',
    ],
  },
];

// ============================================================================
// TESTS: V2.4 FORMAT VALIDATION
// ============================================================================

describe('Flow Exercise Feature', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('v2.4 Format Support', () => {
    it('should accept v2.4.0 format version', () => {
      const result = convertV2ToInternal(mockV24PlanWithFlow);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should preserve isFlow flag in internal format', () => {
      const result = convertV2ToInternal(mockV24PlanWithFlow);
      const flowExercise = result.find((e) => e.ex === 'Test Mobility Flow');

      expect(flowExercise).toBeDefined();
      expect(flowExercise?.isFlow).toBe(true);
    });

    it('should preserve exerciseOptions with flowMovements in internal format', () => {
      const result = convertV2ToInternal(mockV24PlanWithFlow);
      const flowExercise = result.find((e) => e.ex === 'Test Mobility Flow');

      expect(flowExercise?.exerciseOptions).toBeDefined();
      expect(flowExercise?.exerciseOptions?.length).toBe(2);
      expect(flowExercise?.exerciseOptions?.[0].flowMovements).toBeDefined();
      expect(flowExercise?.exerciseOptions?.[0].flowMovements?.length).toBe(4);
    });

    it('should not set isFlow for regular exercises', () => {
      const result = convertV2ToInternal(mockV24PlanWithFlow);
      const regularExercise = result.find((e) => e.ex === 'Regular Exercise');

      expect(regularExercise).toBeDefined();
      expect(regularExercise?.isFlow).toBeUndefined();
    });

    it('should include flowMovements in exercise options', () => {
      const result = convertV2ToInternal(mockV24PlanWithFlow);
      const flowExercise = result.find((e) => e.ex === 'Test Mobility Flow');

      const flowA = flowExercise?.exerciseOptions?.find(
        (o) => o.optionName === 'Flow A - Basic'
      );
      expect(flowA?.flowMovements).toEqual([
        'Deep Squat',
        'Spiderman Lunge',
        'Downward Dog',
        'Stand',
      ]);

      const flowB = flowExercise?.exerciseOptions?.find(
        (o) => o.optionName === 'Flow B - Advanced'
      );
      expect(flowB?.flowMovements?.length).toBe(7);
    });
  });

  describe('loadWorkoutPlan with v2.4', () => {
    it('should load v2.4 plan and preserve flow data', () => {
      const result = loadWorkoutPlan(mockV24PlanWithFlow);

      expect(result.schedule).toBeDefined();
      expect(result.metadata?.id).toBe('test-flow-plan');

      const flowExercise = result.schedule.find(
        (e: ScheduleEntry) => e.ex === 'Test Mobility Flow'
      );
      expect(flowExercise?.isFlow).toBe(true);
      expect(flowExercise?.exerciseOptions?.length).toBe(2);
    });
  });

  // ============================================================================
  // TESTS: FlowMovementsDisplay COMPONENT
  // ============================================================================

  describe('FlowMovementsDisplay Component', () => {
    it('should render nothing when no options provided', () => {
      const { container } = render(
        <FlowMovementsDisplay
          options={[]}
          selectedOptionName={undefined}
          selectedOption={undefined}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when selected option has no flowMovements', () => {
      const optionsWithoutFlow: ExerciseOption[] = [
        { optionName: 'Regular Option', description: 'No flow' },
      ];
      const { container } = render(
        <FlowMovementsDisplay
          options={optionsWithoutFlow}
          selectedOptionName="Regular Option"
          selectedOption={optionsWithoutFlow[0]}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render flow movements badge with count', () => {
      render(
        <FlowMovementsDisplay
          options={mockFlowOptions}
          selectedOptionName="Flow 1 - Squat/Lunge"
          selectedOption={mockFlowOptions[0]}
        />
      );

      // Should show the flow name and movement count in the header
      expect(screen.getByText('Flow 1 - Squat/Lunge')).toBeInTheDocument();
      expect(screen.getByText(/5.*movements/)).toBeInTheDocument();
    });

    it('should always show all movements (no expand/collapse)', () => {
      render(
        <FlowMovementsDisplay
          options={mockFlowOptions}
          selectedOptionName="Flow 1 - Squat/Lunge"
          selectedOption={mockFlowOptions[0]}
        />
      );

      // All movements should be visible immediately - no click needed
      expect(screen.getByText('Deep Squat')).toBeInTheDocument();
      expect(screen.getByText('Spiderman Lunge')).toBeInTheDocument();
      expect(screen.getByText('Downward Dog')).toBeInTheDocument();
      expect(screen.getByText('Plank')).toBeInTheDocument();
      expect(screen.getByText('Stand')).toBeInTheDocument();
    });

    it('should show flow name and movement count in header', () => {
      render(
        <FlowMovementsDisplay
          options={mockFlowOptions}
          selectedOptionName="Flow 1 - Squat/Lunge"
          selectedOption={mockFlowOptions[0]}
        />
      );

      // The header should be visible with the flow name and count
      expect(screen.getByText('Flow 1 - Squat/Lunge')).toBeInTheDocument();
      expect(screen.getByText(/5.*movements/)).toBeInTheDocument();
    });

    it('should display movements with numbered steps', () => {
      render(
        <FlowMovementsDisplay
          options={mockFlowOptions}
          selectedOptionName="Flow 1 - Squat/Lunge"
          selectedOption={mockFlowOptions[0]}
        />
      );

      // Movements are always visible - check for numbered steps (1, 2, 3, etc.)
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render Change button when onChooseFlow is provided', () => {
      const mockOnChooseFlow = vi.fn();
      render(
        <FlowMovementsDisplay
          options={mockFlowOptions}
          selectedOptionName="Flow 1 - Squat/Lunge"
          selectedOption={mockFlowOptions[0]}
          onChooseFlow={mockOnChooseFlow}
        />
      );

      const changeButton = screen.getByRole('button', { name: /change/i });
      expect(changeButton).toBeInTheDocument();

      fireEvent.click(changeButton);
      expect(mockOnChooseFlow).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TESTS: DATA PROPAGATION
  // ============================================================================

  describe('Data Propagation', () => {
    it('should include all flow options in converted schedule entry', () => {
      const result = convertV2ToInternal(mockV24PlanWithFlow);
      const flowExercise = result.find((e) => e.ex === 'Test Mobility Flow');

      expect(flowExercise?.exerciseOptions).toHaveLength(2);

      // Check first option
      const option1 = flowExercise?.exerciseOptions?.[0];
      expect(option1?.optionName).toBe('Flow A - Basic');
      expect(option1?.description).toBe('Basic flow sequence');
      expect(option1?.flowMovements).toHaveLength(4);

      // Check second option
      const option2 = flowExercise?.exerciseOptions?.[1];
      expect(option2?.optionName).toBe('Flow B - Advanced');
      expect(option2?.flowMovements).toHaveLength(7);
    });

    it('should preserve exercise options through reference resolution', () => {
      // This tests that when using $ref, the exerciseOptions from the template are resolved
      const result = convertV2ToInternal(mockV24PlanWithFlow);
      const flowExercise = result.find((e) => e.ex === 'Test Mobility Flow');

      // The exercise was referenced via $ref, options should still be present
      expect(flowExercise?.exerciseOptions).toBeDefined();
      expect(flowExercise?.exerciseOptions?.[0].flowMovements).toBeDefined();
    });
  });

  // ============================================================================
  // TESTS: EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle flow exercise with empty flowMovements array', () => {
      const planWithEmptyFlow = {
        ...mockV24PlanWithFlow,
        plan: {
          ...mockV24PlanWithFlow.plan,
          exerciseTemplates: [
            {
              id: 'ex-empty-flow',
              exerciseName: 'Empty Flow',
              category: 'mobility',
              sets: 1,
              repsType: 'time',
              repsValue: 60,
              isFlow: true,
              exerciseOptions: [
                {
                  optionName: 'Empty Option',
                  flowMovements: [],
                },
              ],
            },
          ],
          phases: [
            {
              number: 1,
              name: 'Test Phase',
              startWeek: 1,
              endWeek: 1,
              focus: 'Testing',
              weeks: [
                {
                  weekNumber: 1,
                  days: [
                    {
                      dayNumber: 1,
                      name: 'Test',
                      exercises: [{ $ref: 'ex-empty-flow' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const result = convertV2ToInternal(planWithEmptyFlow);
      const exercise = result.find((e) => e.ex === 'Empty Flow');

      expect(exercise?.isFlow).toBe(true);
      expect(exercise?.exerciseOptions?.[0].flowMovements).toEqual([]);
    });

    it('should handle flow exercise without exerciseOptions', () => {
      const planWithoutOptions = {
        ...mockV24PlanWithFlow,
        plan: {
          ...mockV24PlanWithFlow.plan,
          exerciseTemplates: [
            {
              id: 'ex-no-options',
              exerciseName: 'Flow Without Options',
              category: 'mobility',
              sets: 1,
              repsType: 'time',
              repsValue: 60,
              isFlow: true,
              // No exerciseOptions
            },
          ],
          phases: [
            {
              number: 1,
              name: 'Test Phase',
              startWeek: 1,
              endWeek: 1,
              focus: 'Testing',
              weeks: [
                {
                  weekNumber: 1,
                  days: [
                    {
                      dayNumber: 1,
                      name: 'Test',
                      exercises: [{ $ref: 'ex-no-options' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const result = convertV2ToInternal(planWithoutOptions);
      const exercise = result.find((e) => e.ex === 'Flow Without Options');

      expect(exercise?.isFlow).toBe(true);
      expect(exercise?.exerciseOptions).toBeUndefined();
    });

    it('should handle mixed flow and non-flow exercises', () => {
      const result = convertV2ToInternal(mockV24PlanWithFlow);

      const flowEx = result.find((e) => e.ex === 'Test Mobility Flow');
      const regularEx = result.find((e) => e.ex === 'Regular Exercise');

      expect(flowEx?.isFlow).toBe(true);
      expect(flowEx?.exerciseOptions).toBeDefined();

      expect(regularEx?.isFlow).toBeUndefined();
      expect(regularEx?.exerciseOptions).toBeUndefined();
    });
  });
});
