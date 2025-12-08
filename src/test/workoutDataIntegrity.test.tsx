import { describe, it, expect } from 'vitest';
import workoutData from '../../data/workout-plan-v2.4.json';
import { loadWorkoutPlan, convertV2ToInternal } from '../workout-plan-utils';

describe('Workout Data Integrity', () => {
  it('should load the workout plan without errors', () => {
    expect(() => loadWorkoutPlan(workoutData)).not.toThrow();
  });

  it('should convert to internal format without errors', () => {
    expect(() => convertV2ToInternal(workoutData)).not.toThrow();
  });

  it('should have valid phases and weeks', () => {
    const { schedule } = loadWorkoutPlan(workoutData);
    expect(schedule.length).toBeGreaterThan(0);

    // Check for specific exercises we modified
    // schedule is a flat array of ScheduleEntry objects

    // Check for Butcher's Block Stretch
    const butchersBlock = schedule.find(entry => entry.ex === "Butcher's Block Stretch");
    expect(butchersBlock).toBeDefined();

    // Check for Pull-Ups
    const pullUps = schedule.find(entry => entry.ex === "Pull-Ups");
    expect(pullUps).toBeDefined();

    // Check for Weighted Pull-Ups
    const weightedPullUps = schedule.find(entry => entry.ex === "Weighted Pull-Ups");
    expect(weightedPullUps).toBeDefined();
  });

  it('should resolve all references correctly', () => {
     // This is implicitly tested by convertV2ToInternal not throwing,
     // as resolveExerciseReference throws if template is missing.
     const { schedule } = loadWorkoutPlan(workoutData);

     // Verify some specific reference resolutions
     // Let's just iterate and ensure no "undefined" names or weird states
     schedule.forEach(entry => {
       expect(entry.ex).toBeDefined();
       expect(entry.ex).not.toBe('');
     });
  });

  it('should have a valid program structure', () => {
    const { metadata } = loadWorkoutPlan(workoutData);
    expect(metadata.durationWeeks).toBe(21);
    expect(metadata.phases.length).toBeGreaterThan(0);

    // Check phase continuity
    let expectedStart = 1;
    metadata.phases.forEach(phase => {
      expect(phase.startWeek).toBe(expectedStart);
      expect(phase.endWeek).toBeGreaterThanOrEqual(phase.startWeek);
      expectedStart = phase.endWeek + 1;
    });
    expect(expectedStart - 1).toBe(21);
  });

  it('should have exercises for every week', () => {
    const { schedule } = loadWorkoutPlan(workoutData);
    const weeks = new Set(schedule.map(s => s.w));

    // Expect weeks 1 through 21 to be present
    for (let i = 1; i <= 21; i++) {
      expect(weeks.has(i), `Week ${i} is missing`).toBe(true);
    }
  });

  it('should have valid exercise data', () => {
    const { schedule } = loadWorkoutPlan(workoutData);
    const validCategories = ['warmup', 'main', 'accessory', 'cooldown', 'skill', 'core', 'mobility', 'activation', 'test'];

    schedule.forEach(entry => {
      // Check category
      if (entry.category) {
        expect(validCategories).toContain(entry.category);
      }

      // Check sets
      expect(entry.s).toBeGreaterThan(0);

      // Check rest
      if (entry.restSeconds !== undefined) {
        expect(entry.restSeconds).toBeGreaterThanOrEqual(0);
      }

      // Check load unit if present
      if (entry.loadRange) {
        expect(['kg', 'band', 'bodyweight', 'percent']).toContain(entry.loadRange.unit);
      }
    });
  });

  it('should have unique template IDs', () => {
    // Check exercise templates
    const exerciseIds = new Set();
    workoutData.plan.exerciseTemplates?.forEach((t: any) => {
      if (t.id) {
        expect(exerciseIds.has(t.id), `Duplicate exercise template ID: ${t.id}`).toBe(false);
        exerciseIds.add(t.id);
      }
    });

    // Check day templates
    const dayIds = new Set();
    workoutData.plan.dayTemplates?.forEach((t: any) => {
      if (t.id) {
        expect(dayIds.has(t.id), `Duplicate day template ID: ${t.id}`).toBe(false);
        dayIds.add(t.id);
      }
    });

    // Check routine templates
    const routineIds = new Set();
    workoutData.plan.routineTemplates?.forEach((t: any) => {
      if (t.id) {
        expect(routineIds.has(t.id), `Duplicate routine template ID: ${t.id}`).toBe(false);
        routineIds.add(t.id);
      }
    });
  });
});
