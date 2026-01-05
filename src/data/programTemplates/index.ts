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
export const SAMPLE_PROGRAMS: SampleProgramInfo[] = [];

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
