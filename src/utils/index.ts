// Re-export all utilities for convenient imports
export * from './storage';
export * from './exerciseHistory';
export * from './time';
export * from './audio';
export * from './schedule';
export * from './firebaseSync';
export * from './urlState';
export * from './automergeSync';
export * from './oauth';
export * from './theme';
// Volume utilities - note: calculateWorkoutVolume also exists in exerciseHistory
// Import from ./volume directly if you need the volume-specific version
export {
  calculateExerciseVolume,
  saveVolumeEntry,
  getVolumeHistory,
  calculateVolumeStats,
  formatVolume,
  type ExerciseVolumeInput,
  type VolumeBreakdownItem,
  type VolumeEntry,
  type WeeklyBreakdown,
  type VolumeTrend,
  type VolumeStats,
  type VolumeHistoryOptions,
} from './volume';
export * from './sanitize';
export * from './errorReporting';
export * from './programImportExport';

// Workout session utilities (extracted from WorkoutPlayer)
export {
  parseWeight,
  isExerciseLogEntry,
  getExerciseLogEntry,
  normalizeAddedExercises,
  getExerciseId,
  getAddedExerciseId,
} from './workoutSession';

// Performance optimization utilities
export * from './performanceOptimizations';
