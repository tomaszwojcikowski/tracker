/**
 * Sample Programs Index
 * 
 * This file provides metadata about available sample programs that can be imported.
 * The actual program files are stored in /public/programs/ and loaded on demand.
 */

import type { ProgramManifest } from '../../services/programRegistry';

/**
 * Sample program manifest without runtime-added fields
 */
type SampleProgramManifest = Omit<ProgramManifest, 'installedAt' | 'isActive' | 'dataPath'>;

/**
 * Sample program definition with load path
 */
export interface SampleProgramInfo {
  /** Program manifest with metadata (dataPath is added from the outer dataPath) */
  manifest: SampleProgramManifest;
  /** Path to load the program JSON from */
  dataPath: string;
}

/**
 * Get full manifest with dataPath included
 */
export function getFullManifest(info: SampleProgramInfo): Omit<ProgramManifest, 'installedAt' | 'isActive'> {
  return {
    ...info.manifest,
    dataPath: info.dataPath,
  };
}

/**
 * Available sample programs
 * 
 * These programs are bundled with the app and can be imported by users.
 * They provide different workout styles and durations.
 */
export const SAMPLE_PROGRAMS: SampleProgramInfo[] = [
  {
    manifest: {
      id: 'beginner-bodyweight-4week',
      name: '4-Week Beginner Bodyweight',
      version: '1.0.0',
      description: 'A beginner-friendly bodyweight program designed to build foundational strength and movement patterns. Perfect for those new to calisthenics.',
      author: 'Tracker App',
      durationWeeks: 4,
      targetLevel: 'beginner',
      goals: ['foundational-strength', 'movement-patterns', 'bodyweight-basics', 'consistency'],
      equipment: ['pull-up-bar', 'resistance-bands'],
    },
    dataPath: '/programs/beginner-bodyweight-4week.json',
  },
  {
    manifest: {
      id: 'strength-fundamentals-6week',
      name: '6-Week Strength Fundamentals',
      version: '1.0.0',
      description: 'A focused 6-week program to build core strength using compound movements. Features progressive overload with barbell and dumbbell exercises.',
      author: 'Tracker App',
      durationWeeks: 6,
      targetLevel: 'intermediate',
      goals: ['strength-building', 'compound-movements', 'progressive-overload', 'muscle-development'],
      equipment: ['barbell', 'dumbbells', 'bench', 'squat-rack', 'pull-up-bar'],
    },
    dataPath: '/programs/strength-fundamentals-6week.json',
  },
  {
    manifest: {
      id: 'mobility-flexibility-2week',
      name: '2-Week Mobility & Flexibility',
      version: '1.0.0',
      description: 'A focused 2-week program to improve mobility and flexibility. Perfect as a standalone program for recovery, or as a supplement to strength training.',
      author: 'Tracker App',
      durationWeeks: 2,
      targetLevel: 'beginner',
      goals: ['improved-flexibility', 'joint-mobility', 'injury-prevention', 'recovery'],
      equipment: ['yoga-mat', 'resistance-bands'],
    },
    dataPath: '/programs/mobility-flexibility-2week.json',
  },
];

/**
 * Get a sample program by ID
 */
export function getSampleProgramById(id: string): SampleProgramInfo | undefined {
  return SAMPLE_PROGRAMS.find(p => p.manifest.id === id);
}

/**
 * Get all sample programs filtered by target level
 */
export function getSampleProgramsByLevel(level: string): SampleProgramInfo[] {
  return SAMPLE_PROGRAMS.filter(p => p.manifest.targetLevel === level);
}

/**
 * Get all sample programs sorted by duration
 */
export function getSampleProgramsByDuration(): SampleProgramInfo[] {
  return [...SAMPLE_PROGRAMS].sort((a, b) => a.manifest.durationWeeks - b.manifest.durationWeeks);
}
