import { describe, it, expect } from 'vitest';
import {
  convertV2ToInternal,
  loadWorkoutPlan,
  getPhaseForWeek,
  isV2Format,
  getPlanSummary,
  parseLoadRange
} from '../workout-plan-utils';

describe('Workout Plan Utilities', () => {
  // Sample v2.0.0 data
  const v2Data = {
    formatVersion: '2.0.0',
    plan: {
      id: 'test-plan',
      name: 'Test Workout Plan',
      description: 'A test plan',
      author: 'Test Author',
      durationWeeks: 1,
      goals: ['strength'],
      targetLevel: 'beginner',
      equipment: ['bar'],
      phases: [
        {
          phaseNumber: 1,
          name: 'Test Phase',
          description: 'Testing phase',
          startWeek: 1,
          endWeek: 1,
          focus: 'volume',
          weeks: [
            {
              weekNumber: 1,
              description: null,
              focus: null,
              volumeLevel: 'moderate',
              intensityLevel: 'low',
              days: [
                {
                  dayNumber: 1,
                  name: 'Pull Day',
                  type: 'strength',
                  estimatedDuration: 60,
                  description: null,
                  exercises: [
                    {
                      order: 1,
                      exerciseName: 'Pull-Ups',
                      exerciseId: 'pull_ups',
                      category: 'main',
                      sets: 3,
                      reps: '8',
                      tempo: null,
                      restSeconds: 120,
                      rpe: 8,
                      load: 'bodyweight',
                      notes: 'Focus on form',
                      alternatives: [],
                      progressionNotes: null,
                      videoUrl: null,
                      cues: []
                    },
                    {
                      order: 2,
                      exerciseName: 'Dips',
                      exerciseId: 'dips',
                      category: 'accessory',
                      sets: 3,
                      reps: '10',
                      tempo: null,
                      restSeconds: 90,
                      rpe: 7,
                      load: 'bodyweight',
                      notes: null,
                      alternatives: [],
                      progressionNotes: null,
                      videoUrl: null,
                      cues: []
                    }
                  ]
                },
                {
                  dayNumber: 2,
                  name: 'Mobility',
                  type: 'mobility',
                  estimatedDuration: 30,
                  description: null,
                  exercises: [
                    {
                      order: 1,
                      exerciseName: 'Mobility Flow',
                      exerciseId: null,
                      category: 'mobility',
                      sets: 1,
                      reps: '10 min',
                      tempo: null,
                      restSeconds: null,
                      rpe: null,
                      load: null,
                      notes: null,
                      alternatives: [],
                      progressionNotes: null,
                      videoUrl: null,
                      cues: []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  };

  describe('convertV2ToInternal', () => {
    it('should convert v2 to flat internal format', () => {
      const result = convertV2ToInternal(v2Data);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);

      // Check first exercise (has load: 'bodyweight')
      expect(result[0]).toEqual({
        w: 1,
        d: 1,
        ex: 'Pull-Ups',
        s: 3,
        r: '8',
        n: 'Focus on form',
        category: 'main',
        load: 'bodyweight',
        loadRange: { min: 0, max: 0, unit: 'bodyweight', raw: 'bodyweight' },
        repsRange: { type: 'reps', value: 8, raw: '8' },
        tempoRange: undefined
      });

      // Check second exercise (has bodyweight load)
      expect(result[1]).toEqual({
        w: 1,
        d: 1,
        ex: 'Dips',
        s: 3,
        r: '10',
        n: 'accessory',
        category: 'accessory',
        load: 'bodyweight',
        loadRange: { min: 0, max: 0, unit: 'bodyweight', raw: 'bodyweight' },
        repsRange: { type: 'reps', value: 10, raw: '10' },
        tempoRange: undefined
      });

      // Check third exercise (load: null becomes undefined)
      expect(result[2]).toEqual({
        w: 1,
        d: 2,
        ex: 'Mobility Flow',
        s: 1,
        r: '10 min',
        n: 'mobility',
        category: 'mobility',
        load: undefined,
        loadRange: undefined,
        repsRange: { type: 'time', value: 600, unit: 'seconds', perSide: undefined, raw: '10 min' },
        tempoRange: undefined
      });
    });

    it('should handle exercises without notes', () => {
      const result = convertV2ToInternal(v2Data);
      // Second exercise has no notes, should use category
      expect(result[1].n).toBe('accessory');
    });

    it('should throw error for invalid v2 format', () => {
      expect(() => convertV2ToInternal({})).toThrow('Invalid v2.0.0 workout plan format');
      expect(() => convertV2ToInternal({ formatVersion: '2.0.0' })).toThrow();
    });
  });

  describe('loadWorkoutPlan', () => {
    it('should load v2.0.0 plan with full metadata', () => {
      const result = loadWorkoutPlan(v2Data);

      expect(Array.isArray(result.schedule)).toBe(true);
      expect(result.schedule.length).toBe(3);

      expect(result.metadata.version).toBe('2.0.0');
      expect(result.metadata.id).toBe('test-plan');
      expect(result.metadata.name).toBe('Test Workout Plan');
      expect(result.metadata.description).toBe('A test plan');
      expect(result.metadata.author).toBe('Test Author');
      expect(result.metadata.durationWeeks).toBe(1);
      expect(result.metadata.goals).toEqual(['strength']);
      expect(result.metadata.targetLevel).toBe('beginner');
      expect(result.metadata.equipment).toEqual(['bar']);

      expect(Array.isArray(result.metadata.phases)).toBe(true);
      expect(result.metadata.phases.length).toBe(1);
      expect(result.metadata.phases[0].name).toBe('Test Phase');
    });

    it('should throw error for unsupported format', () => {
      expect(() => loadWorkoutPlan({})).toThrow();
      expect(() => loadWorkoutPlan(null)).toThrow();
      // v1 format should now throw
      expect(() => loadWorkoutPlan([{ w: 1, d: 1, ex: 'Test', s: 3, r: '8' }])).toThrow();
    });
  });

  describe('getPhaseForWeek', () => {
    it('should return correct phase for given week', () => {
      const metadata = {
        phases: [
          { number: 1, startWeek: 1, endWeek: 4, name: 'Phase 1' },
          { number: 2, startWeek: 5, endWeek: 8, name: 'Phase 2' }
        ]
      };

      expect(getPhaseForWeek(metadata, 1)).toEqual(metadata.phases[0]);
      expect(getPhaseForWeek(metadata, 4)).toEqual(metadata.phases[0]);
      expect(getPhaseForWeek(metadata, 5)).toEqual(metadata.phases[1]);
      expect(getPhaseForWeek(metadata, 8)).toEqual(metadata.phases[1]);
    });

    it('should return null if week is outside phase ranges', () => {
      const metadata = {
        phases: [
          { number: 1, startWeek: 1, endWeek: 4, name: 'Phase 1' }
        ]
      };

      expect(getPhaseForWeek(metadata, 5)).toBeNull();
      expect(getPhaseForWeek(metadata, 0)).toBeNull();
    });

    it('should return null if no phases available', () => {
      expect(getPhaseForWeek({}, 1)).toBeNull();
      expect(getPhaseForWeek({ phases: null }, 1)).toBeNull();
    });
  });

  describe('isV2Format', () => {
    it('should return true for v2 format', () => {
      expect(isV2Format(v2Data)).toBe(true);
    });

    it('should return false for array format (legacy v1)', () => {
      const v1Data = [{ w: 1, d: 1, ex: 'Test', s: 3, r: '8' }];
      expect(isV2Format(v1Data)).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(isV2Format({})).toBe(false);
      expect(isV2Format(null)).toBe(false);
      expect(isV2Format('invalid')).toBe(false);
    });
  });

  describe('getPlanSummary', () => {
    it('should return summary for v2 metadata', () => {
      const metadata = {
        version: '2.0.0',
        name: 'Advanced Plan',
        durationWeeks: 12,
        phases: [{ name: 'Phase 1' }, { name: 'Phase 2' }],
        goals: ['strength', 'hypertrophy'],
        targetLevel: 'advanced',
        equipment: ['bar', 'rings']
      };

      const summary = getPlanSummary(metadata);
      expect(summary.name).toBe('Advanced Plan');
      expect(summary.version).toBe('2.0.0');
      expect(summary.weeks).toBe(12);
      expect(summary.phases).toBe(2);
      expect(summary.goals).toEqual(['strength', 'hypertrophy']);
      expect(summary.level).toBe('advanced');
      expect(summary.equipment).toEqual(['bar', 'rings']);
    });

    it('should handle missing fields gracefully', () => {
      const summary = getPlanSummary({});
      expect(summary.name).toBe('Workout Plan');
      expect(summary.version).toBeUndefined();
      expect(summary.weeks).toBeUndefined();
      expect(summary.phases).toBe(0);
    });
  });

  describe('Integration - Round-trip conversion', () => {
    it('should preserve exercise data through v2 → internal conversion', () => {
      const { schedule } = loadWorkoutPlan(v2Data);

      // Check that essential data is preserved
      expect(schedule[0].w).toBe(1);
      expect(schedule[0].d).toBe(1);
      expect(schedule[0].ex).toBe('Pull-Ups');
      expect(schedule[0].s).toBe(3);
      expect(schedule[0].r).toBe('8');
    });
  });

  describe('parseLoadRange', () => {
    it('should return null for null/undefined input', () => {
      expect(parseLoadRange(null)).toBeNull();
      expect(parseLoadRange(undefined)).toBeNull();
      expect(parseLoadRange('')).toBeNull();
    });

    it('should parse bodyweight', () => {
      const result = parseLoadRange('bodyweight');
      expect(result).toEqual({
        min: 0,
        max: 0,
        unit: 'bodyweight',
        raw: 'bodyweight'
      });
    });

    it('should parse single kg values', () => {
      expect(parseLoadRange('10kg')).toEqual({
        min: 10,
        max: 10,
        unit: 'kg',
        raw: '10kg',
        perHand: false
      });

      expect(parseLoadRange('17.5kg')).toEqual({
        min: 17.5,
        max: 17.5,
        unit: 'kg',
        raw: '17.5kg',
        perHand: false
      });
    });

    it('should parse kg ranges', () => {
      expect(parseLoadRange('5-10kg')).toEqual({
        min: 5,
        max: 10,
        unit: 'kg',
        raw: '5-10kg',
        perHand: false
      });

      expect(parseLoadRange('8-12kg per hand')).toEqual({
        min: 8,
        max: 12,
        unit: 'kg',
        raw: '8-12kg per hand',
        perHand: true
      });
    });

    it('should parse additional weight markers', () => {
      expect(parseLoadRange('+2kg')).toEqual({
        min: 2,
        max: 2,
        unit: 'kg',
        raw: '+2kg',
        perHand: false
      });

      expect(parseLoadRange('~85kg')).toEqual({
        min: 85,
        max: 85,
        unit: 'kg',
        raw: '~85kg',
        perHand: false
      });
    });

    it('should parse band resistance', () => {
      expect(parseLoadRange('light band')).toEqual({
        min: 1,
        max: 1,
        unit: 'band',
        raw: 'light band'
      });

      expect(parseLoadRange('light-medium band')).toEqual({
        min: 2,
        max: 2,
        unit: 'band',
        raw: 'light-medium band'
      });
    });

    it('should parse percentage loads', () => {
      expect(parseLoadRange('60%')).toEqual({
        min: 60,
        max: 60,
        unit: 'percent',
        raw: '60%'
      });
    });
  });
});
