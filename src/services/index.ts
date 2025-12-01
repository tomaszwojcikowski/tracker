/**
 * Services Module
 *
 * Exports all service modules for the tracker app.
 */

// Program Registry
export {
  getProgramRegistry,
  resetProgramRegistry,
  extractManifestFromPlan,
  initializeDefaultProgram,
  DEFAULT_PROGRAM_ID,
} from './programRegistry';

export type {
  ProgramManifest,
  ProgramRegistry,
  WorkoutPlanJson,
} from './programRegistry';
