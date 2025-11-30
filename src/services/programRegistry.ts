/**
 * Program Registry Service
 *
 * Manages multiple workout programs, allowing the tracker app to support
 * different workout programs instead of just a single hardcoded program.
 */

import { safeGetJSON, safeSetJSON } from '../utils/storage';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Program manifest containing metadata about a workout program
 */
export interface ProgramManifest {
  /** Unique identifier for the program */
  id: string;
  /** Display name of the program */
  name: string;
  /** Version string (e.g., "1.0.0") */
  version: string;
  /** Description of the program */
  description: string;
  /** Author/creator of the program */
  author: string;
  /** Total duration in weeks */
  durationWeeks: number;
  /** Target fitness level (e.g., "beginner", "intermediate", "advanced") */
  targetLevel: string;
  /** Program goals (e.g., ["strength", "muscle-building"]) */
  goals: string[];
  /** Required equipment */
  equipment: string[];
  /** Path to the program data file (relative URL) */
  dataPath: string;
  /** Whether this is the currently active program */
  isActive: boolean;
  /** When the program was installed */
  installedAt: Date;
}

/**
 * Serialized version of ProgramManifest for storage
 */
interface StoredProgramManifest extends Omit<ProgramManifest, 'installedAt'> {
  installedAt: string; // ISO date string
}

/**
 * Interface for the Program Registry
 */
export interface ProgramRegistry {
  /** Get all available programs */
  getAvailablePrograms(): ProgramManifest[];
  /** Get the currently active program */
  getActiveProgram(): ProgramManifest | null;
  /** Set the active program by ID */
  setActiveProgram(programId: string): void;
  /** Get a program by its ID */
  getProgramById(programId: string): ProgramManifest | undefined;
  /** Register a new program */
  registerProgram(manifest: ProgramManifest): void;
  /** Import a program from workout plan JSON */
  importProgram(planJson: WorkoutPlanJson): Promise<ProgramManifest>;
  /** Unregister a program by ID */
  unregisterProgram(programId: string): boolean;
}

/**
 * Workout plan JSON structure (subset of fields needed for manifest extraction)
 */
export interface WorkoutPlanJson {
  formatVersion?: string;
  plan: {
    id: string;
    name: string;
    version: string;
    description?: string;
    author?: string;
    durationWeeks: number;
    targetLevel?: string;
    goals?: string[];
    equipment?: string[];
  };
  // The plan can contain additional fields we don't need for the manifest
  [key: string]: unknown;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** localStorage key for the program registry */
const REGISTRY_STORAGE_KEY = 'tracker_program_registry';

/** localStorage key for the active program ID */
const ACTIVE_PROGRAM_STORAGE_KEY = 'tracker_active_program';

/** Default program ID (the built-in program) */
export const DEFAULT_PROGRAM_ID = 'oneplus-12-pro-tracker-v1';

// ============================================================================
// SINGLETON REGISTRY INSTANCE
// ============================================================================

let registryInstance: ProgramRegistryImpl | null = null;

/**
 * Get the singleton program registry instance
 */
export function getProgramRegistry(): ProgramRegistry {
  if (!registryInstance) {
    registryInstance = new ProgramRegistryImpl();
  }
  return registryInstance;
}

/**
 * Reset the registry instance (useful for testing)
 */
export function resetProgramRegistry(): void {
  registryInstance = null;
}

// ============================================================================
// REGISTRY IMPLEMENTATION
// ============================================================================

/**
 * Program Registry implementation
 */
class ProgramRegistryImpl implements ProgramRegistry {
  private programs: Map<string, ProgramManifest>;
  private activeProgramId: string | null;

  constructor() {
    this.programs = new Map();
    this.activeProgramId = null;
    this.loadFromStorage();
  }

  /**
   * Load registry state from localStorage
   */
  private loadFromStorage(): void {
    // Load programs
    const storedPrograms = safeGetJSON<StoredProgramManifest[]>(REGISTRY_STORAGE_KEY, []);
    for (const stored of storedPrograms) {
      const manifest: ProgramManifest = {
        ...stored,
        installedAt: new Date(stored.installedAt),
      };
      this.programs.set(manifest.id, manifest);
    }

    // Load active program ID
    this.activeProgramId = safeGetJSON<string | null>(ACTIVE_PROGRAM_STORAGE_KEY, null);
  }

  /**
   * Save registry state to localStorage
   */
  private saveToStorage(): void {
    const storedPrograms: StoredProgramManifest[] = Array.from(this.programs.values()).map(
      (manifest) => ({
        ...manifest,
        installedAt: manifest.installedAt.toISOString(),
      })
    );
    safeSetJSON(REGISTRY_STORAGE_KEY, storedPrograms);
    safeSetJSON(ACTIVE_PROGRAM_STORAGE_KEY, this.activeProgramId);
  }

  /**
   * Update the isActive flag on all programs
   */
  private updateActiveFlags(): void {
    for (const [id, manifest] of this.programs) {
      manifest.isActive = id === this.activeProgramId;
    }
  }

  getAvailablePrograms(): ProgramManifest[] {
    return Array.from(this.programs.values());
  }

  getActiveProgram(): ProgramManifest | null {
    if (!this.activeProgramId) {
      return null;
    }
    return this.programs.get(this.activeProgramId) ?? null;
  }

  setActiveProgram(programId: string): void {
    if (!this.programs.has(programId)) {
      throw new Error(`Program with ID "${programId}" not found in registry`);
    }
    this.activeProgramId = programId;
    this.updateActiveFlags();
    this.saveToStorage();
  }

  getProgramById(programId: string): ProgramManifest | undefined {
    return this.programs.get(programId);
  }

  registerProgram(manifest: ProgramManifest): void {
    this.programs.set(manifest.id, manifest);
    
    // If this is the first program, set it as active
    if (this.programs.size === 1 && !this.activeProgramId) {
      this.activeProgramId = manifest.id;
    }
    
    this.updateActiveFlags();
    this.saveToStorage();
  }

  async importProgram(planJson: WorkoutPlanJson): Promise<ProgramManifest> {
    const plan = planJson.plan;
    
    // Validate required fields
    // Note: durationWeeks must be > 0 (a program with 0 weeks is invalid)
    if (!plan.id || !plan.name || !plan.version || typeof plan.durationWeeks !== 'number' || plan.durationWeeks <= 0) {
      throw new Error('Invalid workout plan: missing required fields (id, name, version, durationWeeks > 0)');
    }

    const manifest: ProgramManifest = {
      id: plan.id,
      name: plan.name,
      version: plan.version,
      description: plan.description ?? '',
      author: plan.author ?? 'Unknown',
      durationWeeks: plan.durationWeeks,
      targetLevel: plan.targetLevel ?? 'all-levels',
      goals: plan.goals ?? [],
      equipment: plan.equipment ?? [],
      dataPath: '', // Will be set when the data is stored
      isActive: false,
      installedAt: new Date(),
    };

    this.registerProgram(manifest);
    return manifest;
  }

  unregisterProgram(programId: string): boolean {
    if (!this.programs.has(programId)) {
      return false;
    }

    // Cannot unregister the active program if it's the only one
    if (programId === this.activeProgramId) {
      const otherPrograms = Array.from(this.programs.keys()).filter((id) => id !== programId);
      if (otherPrograms.length === 0) {
        throw new Error('Cannot unregister the only active program');
      }
      // Switch to another program
      this.activeProgramId = otherPrograms[0];
    }

    this.programs.delete(programId);
    this.updateActiveFlags();
    this.saveToStorage();
    return true;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract a program manifest from a workout plan JSON object
 */
export function extractManifestFromPlan(planJson: WorkoutPlanJson): ProgramManifest {
  const plan = planJson.plan;
  
  return {
    id: plan.id,
    name: plan.name,
    version: plan.version,
    description: plan.description ?? '',
    author: plan.author ?? 'Unknown',
    durationWeeks: plan.durationWeeks,
    targetLevel: plan.targetLevel ?? 'all-levels',
    goals: plan.goals ?? [],
    equipment: plan.equipment ?? [],
    dataPath: '',
    isActive: false,
    installedAt: new Date(),
  };
}

/**
 * Initialize the registry with the default program if empty
 */
export function initializeDefaultProgram(defaultPlanJson: WorkoutPlanJson): void {
  const registry = getProgramRegistry();
  const programs = registry.getAvailablePrograms();
  
  // If registry is empty, register the default program
  if (programs.length === 0) {
    const manifest = extractManifestFromPlan(defaultPlanJson);
    manifest.dataPath = '/workout-plan-v2.1.json';
    registry.registerProgram(manifest);
    registry.setActiveProgram(manifest.id);
  }
}
