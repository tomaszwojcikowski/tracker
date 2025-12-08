/**
 * Comprehensive tests for schedule utilities
 * Tests the actual schedule.ts module exports
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setActiveScheduleProgram,
  getActiveScheduleProgram,
  setRawSchedule,
  getRawSchedule,
  getCompleteSchedule,
  buildCompleteSchedule,
  clearScheduleForProgram,
  clearAllSchedules,
  type RawScheduleItem,
} from '../utils/schedule';

describe('Schedule Utilities Comprehensive Tests', () => {
  const testProgramId = 'test-program';
  const defaultProgramId = 'default';

  const sampleScheduleItems: RawScheduleItem[] = [
    { w: 1, d: 1, ex: 'Push-Ups', s: 3, r: '10', category: 'main' },
    { w: 1, d: 1, ex: 'Squats', s: 4, r: '8-10', category: 'main' },
    { w: 1, d: 2, ex: 'Pull-Ups', s: 3, r: '8', category: 'main', isUnilateral: false },
    { w: 2, d: 1, ex: 'Lunges', s: 3, r: '12', category: 'accessory', isUnilateral: true },
  ];

  beforeEach(() => {
    // Clear all schedules before each test
    clearAllSchedules();
    // Reset to default program
    setActiveScheduleProgram(defaultProgramId);
  });

  afterEach(() => {
    clearAllSchedules();
  });

  describe('Active Schedule Program', () => {
    it('should get default program ID', () => {
      expect(getActiveScheduleProgram()).toBe(defaultProgramId);
    });

    it('should set and get active program', () => {
      setActiveScheduleProgram(testProgramId);

      expect(getActiveScheduleProgram()).toBe(testProgramId);
    });

    it('should switch between programs', () => {
      setActiveScheduleProgram('program-1');
      expect(getActiveScheduleProgram()).toBe('program-1');

      setActiveScheduleProgram('program-2');
      expect(getActiveScheduleProgram()).toBe('program-2');
    });
  });

  describe('setRawSchedule', () => {
    it('should set schedule for current program', () => {
      setRawSchedule(sampleScheduleItems);

      const schedule = getRawSchedule();
      expect(schedule).toHaveLength(4);
      expect(schedule[0].ex).toBe('Push-Ups');
    });

    it('should set schedule for specific program', () => {
      setRawSchedule(sampleScheduleItems, testProgramId);

      const schedule = getRawSchedule(testProgramId);
      expect(schedule).toHaveLength(4);
    });

    it('should not affect other programs', () => {
      setRawSchedule(sampleScheduleItems, 'program-a');
      setRawSchedule([{ w: 1, d: 1, ex: 'Other', s: 2, r: '5' }], 'program-b');

      expect(getRawSchedule('program-a')).toHaveLength(4);
      expect(getRawSchedule('program-b')).toHaveLength(1);
    });

    it('should overwrite existing schedule', () => {
      setRawSchedule(sampleScheduleItems);
      setRawSchedule([{ w: 1, d: 1, ex: 'New Exercise', s: 1, r: '1' }]);

      const schedule = getRawSchedule();
      expect(schedule).toHaveLength(1);
      expect(schedule[0].ex).toBe('New Exercise');
    });
  });

  describe('getRawSchedule', () => {
    it('should return empty array for non-existent program', () => {
      expect(getRawSchedule('non-existent')).toEqual([]);
    });

    it('should return schedule for current program by default', () => {
      setActiveScheduleProgram(testProgramId);
      setRawSchedule(sampleScheduleItems, testProgramId);

      expect(getRawSchedule()).toHaveLength(4);
    });

    it('should return schedule for specified program', () => {
      setRawSchedule(sampleScheduleItems, testProgramId);
      setRawSchedule([], defaultProgramId);

      expect(getRawSchedule(testProgramId)).toHaveLength(4);
      expect(getRawSchedule(defaultProgramId)).toHaveLength(0);
    });
  });

  describe('buildCompleteSchedule', () => {
    it('should copy raw schedule to complete schedule', () => {
      setRawSchedule(sampleScheduleItems);
      buildCompleteSchedule();

      const complete = getCompleteSchedule();
      expect(complete).toHaveLength(4);
      expect(complete).toEqual(sampleScheduleItems);
    });

    it('should build schedule for specific program', () => {
      setRawSchedule(sampleScheduleItems, testProgramId);
      buildCompleteSchedule(testProgramId);

      const complete = getCompleteSchedule(testProgramId);
      expect(complete).toHaveLength(4);
    });

    it('should create independent copy (not mutate raw)', () => {
      setRawSchedule(sampleScheduleItems);
      buildCompleteSchedule();

      const complete = getCompleteSchedule();
      const raw = getRawSchedule();

      // They should have same content
      expect(complete).toEqual(raw);

      // But not be the same array reference
      expect(complete).not.toBe(raw);
    });
  });

  describe('getCompleteSchedule', () => {
    it('should return empty array before buildCompleteSchedule is called', () => {
      setRawSchedule(sampleScheduleItems);

      // Complete schedule not built yet
      expect(getCompleteSchedule()).toEqual([]);
    });

    it('should return schedule for current program by default', () => {
      setActiveScheduleProgram(testProgramId);
      setRawSchedule(sampleScheduleItems, testProgramId);
      buildCompleteSchedule(testProgramId);

      expect(getCompleteSchedule()).toHaveLength(4);
    });
  });

  describe('clearScheduleForProgram', () => {
    it('should clear specific program schedule', () => {
      setRawSchedule(sampleScheduleItems, testProgramId);
      buildCompleteSchedule(testProgramId);

      clearScheduleForProgram(testProgramId);

      expect(getRawSchedule(testProgramId)).toEqual([]);
      expect(getCompleteSchedule(testProgramId)).toEqual([]);
    });

    it('should not affect other programs', () => {
      setRawSchedule(sampleScheduleItems, 'program-a');
      setRawSchedule(sampleScheduleItems, 'program-b');

      clearScheduleForProgram('program-a');

      expect(getRawSchedule('program-a')).toEqual([]);
      expect(getRawSchedule('program-b')).toHaveLength(4);
    });
  });

  describe('clearAllSchedules', () => {
    it('should clear all program schedules', () => {
      setRawSchedule(sampleScheduleItems, 'program-a');
      setRawSchedule(sampleScheduleItems, 'program-b');
      setRawSchedule(sampleScheduleItems, 'program-c');

      clearAllSchedules();

      expect(getRawSchedule('program-a')).toEqual([]);
      expect(getRawSchedule('program-b')).toEqual([]);
      expect(getRawSchedule('program-c')).toEqual([]);
    });
  });

  describe('Schedule Item Properties', () => {
    it('should preserve all exercise properties', () => {
      const itemWithOptions: RawScheduleItem = {
        w: 1,
        d: 1,
        ex: 'Test Exercise',
        s: 3,
        r: '8-12',
        n: 'Strength',
        category: 'main',
        load: '50kg',
        loadRange: { min: 45, max: 55, unit: 'kg', raw: '45-55kg' },
        repsRange: { type: 'reps', min: 8, max: 12, raw: '8-12' },
        isEmom: true,
        isUnilateral: true,
        supersetGroup: 1,
        restSeconds: 90,
        alternatives: ['Alt 1', 'Alt 2'],
        exerciseOptions: [
          { optionName: 'Option 1' },
        ],
        isFlow: false,
      };

      setRawSchedule([itemWithOptions]);
      buildCompleteSchedule();

      const schedule = getCompleteSchedule();
      expect(schedule[0]).toEqual(itemWithOptions);
    });

    it('should handle optional properties being undefined', () => {
      const minimalItem: RawScheduleItem = {
        w: 1,
        d: 1,
        ex: 'Minimal',
        s: 1,
        r: '1',
      };

      setRawSchedule([minimalItem]);
      buildCompleteSchedule();

      const schedule = getCompleteSchedule();
      expect(schedule[0].n).toBeUndefined();
      expect(schedule[0].isEmom).toBeUndefined();
      expect(schedule[0].alternatives).toBeUndefined();
    });
  });

  describe('Multi-Program Scenarios', () => {
    it('should maintain separate schedules for multiple programs', () => {
      const programASchedule: RawScheduleItem[] = [
        { w: 1, d: 1, ex: 'Exercise A', s: 3, r: '10' },
      ];
      const programBSchedule: RawScheduleItem[] = [
        { w: 1, d: 1, ex: 'Exercise B', s: 4, r: '8' },
        { w: 1, d: 2, ex: 'Exercise C', s: 2, r: '15' },
      ];

      setRawSchedule(programASchedule, 'program-a');
      setRawSchedule(programBSchedule, 'program-b');
      buildCompleteSchedule('program-a');
      buildCompleteSchedule('program-b');

      expect(getRawSchedule('program-a')).toHaveLength(1);
      expect(getCompleteSchedule('program-a')[0].ex).toBe('Exercise A');

      expect(getRawSchedule('program-b')).toHaveLength(2);
      expect(getCompleteSchedule('program-b')[0].ex).toBe('Exercise B');
    });

    it('should handle switching active program', () => {
      setRawSchedule([{ w: 1, d: 1, ex: 'A', s: 1, r: '1' }], 'program-a');
      setRawSchedule([{ w: 1, d: 1, ex: 'B', s: 1, r: '1' }], 'program-b');
      buildCompleteSchedule('program-a');
      buildCompleteSchedule('program-b');

      setActiveScheduleProgram('program-a');
      expect(getCompleteSchedule()[0].ex).toBe('A');

      setActiveScheduleProgram('program-b');
      expect(getCompleteSchedule()[0].ex).toBe('B');
    });
  });
});
