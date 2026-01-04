/**
 * Program Context Provider
 *
 * Provides program state and switching functionality to all components.
 * Syncs program data with schedule utilities for multi-program support.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ProgramManifest, WorkoutPlanJson, ProgramData } from '../services/programRegistry';
import { getProgramRegistry, initializeDefaultProgram } from '../services/programRegistry';
import { loadWorkoutPlan, type WorkoutPlanMetadata, type InternalSchedule } from '../workout-plan-utils';
import { setRawSchedule, buildCompleteSchedule, setActiveScheduleProgram } from '../utils/schedule';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Program data structure (the full workout plan)
 */
export interface WorkoutPlan extends WorkoutPlanJson {
  // Additional runtime properties can be added here
}

/**
 * Context value provided by ProgramContext
 */
export interface ProgramContextValue {
  /** Currently active program manifest */
  currentProgram: ProgramManifest | null;
  /** Full workout plan data for the current program */
  programData: WorkoutPlan | null;
  /** Parsed schedule in internal format for the current program */
  schedule: InternalSchedule | null;
  /** Parsed metadata for the current program */
  metadata: WorkoutPlanMetadata | null;
  /** List of all available programs */
  availablePrograms: ProgramManifest[];
  /** Switch to a different program by ID */
  switchProgram: (programId: string) => Promise<void>;
  /** Whether the program is currently loading */
  isLoading: boolean;
  /** Any error that occurred during loading */
  error: Error | null;
  /** Refresh the list of available programs */
  refreshPrograms: () => void;
  /** Get the current program ID */
  currentProgramId: string | null;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ProgramContext = createContext<ProgramContextValue | undefined>(undefined);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a minimal WorkoutPlan object from a ProgramManifest
 * Used when program data is already stored in the registry
 */
function createMinimalWorkoutPlan(program: ProgramManifest): WorkoutPlan {
  return {
    formatVersion: '2.3.0',
    plan: {
      id: program.id,
      name: program.name,
      version: program.version,
      durationWeeks: program.durationWeeks,
      description: program.description,
      author: program.author,
      targetLevel: program.targetLevel,
      goals: program.goals,
      equipment: program.equipment,
      phases: [], // Not needed - schedule is already available in registry
    },
  } as WorkoutPlan;
}

// ============================================================================
// PROVIDER PROPS
// ============================================================================

export interface ProgramProviderProps {
  children: React.ReactNode;
  /** Initial program data (optional, for SSR or preloaded data) */
  initialProgramData?: WorkoutPlan;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * ProgramProvider component
 *
 * Wraps the app and provides program state to all components.
 * Syncs program schedule data with schedule utilities when program changes.
 */
export function ProgramProvider({ children, initialProgramData }: ProgramProviderProps): React.ReactElement {
  const [currentProgram, setCurrentProgram] = useState<ProgramManifest | null>(null);
  const [programData, setProgramData] = useState<WorkoutPlan | null>(initialProgramData ?? null);
  const [schedule, setSchedule] = useState<InternalSchedule | null>(null);
  const [metadata, setMetadata] = useState<WorkoutPlanMetadata | null>(null);
  const [availablePrograms, setAvailablePrograms] = useState<ProgramManifest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Process and sync program data with schedule utilities
   */
  const syncProgramData = useCallback((programId: string, data: WorkoutPlan) => {
    try {
      // Load and convert the workout plan
      const result = loadWorkoutPlan(data);

      // Store in registry
      const registry = getProgramRegistry();
      const programDataToStore: ProgramData = {
        schedule: result.schedule,
        metadata: result.metadata,
      };
      registry.setProgramData(programId, programDataToStore);

      // Sync with schedule utilities
      setActiveScheduleProgram(programId);
      setRawSchedule(result.schedule, programId);
      buildCompleteSchedule(programId);

      // Update local state
      setSchedule(result.schedule);
      setMetadata(result.metadata);

      return result;
    } catch (err) {
      console.error(`Failed to sync program data for ${programId}:`, err);
      throw err;
    }
  }, []);

  /**
   * Load program data from a URL
   */
  const loadProgramData = useCallback(async (dataPath: string): Promise<WorkoutPlan> => {
    if (!dataPath) {
      throw new Error('Program data path is not specified');
    }

    const response = await fetch(dataPath);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Program data not found at ${dataPath}`);
      }
      throw new Error(`Failed to load program data: ${response.status} ${response.statusText}`);
    }

    try {
      return await response.json() as WorkoutPlan;
    } catch {
      throw new Error('Failed to parse program data: invalid JSON format');
    }
  }, []);

  /**
   * Refresh the list of available programs
   */
  const refreshPrograms = useCallback(() => {
    const registry = getProgramRegistry();
    setAvailablePrograms(registry.getAvailablePrograms());
  }, []);

  /**
   * Switch to a different program
   */
  const switchProgram = useCallback(async (programId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const registry = getProgramRegistry();
      registry.setActiveProgram(programId);

      const program = registry.getActiveProgram();
      if (!program) {
        throw new Error(`Program with ID "${programId}" not found`);
      }

      // Check if program data is already stored in registry
      let data: WorkoutPlan;
      const storedData = registry.getProgramData(programId);

      if (storedData) {
        // Use stored data - construct a minimal WorkoutPlan
        data = createMinimalWorkoutPlan(program);

        // Sync with schedule utilities using stored schedule
        setActiveScheduleProgram(programId);
        setRawSchedule(storedData.schedule, programId);
        buildCompleteSchedule(programId);

        setSchedule(storedData.schedule);
        setMetadata(storedData.metadata);
      } else if (program.dataPath) {
        // Load the program data from URL
        data = await loadProgramData(program.dataPath);

        // Sync program data with schedule utilities
        syncProgramData(programId, data);
      } else {
        throw new Error('Program data is not available');
      }

      setCurrentProgram(program);
      setProgramData(data);
      refreshPrograms();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error('Failed to switch program:', errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [loadProgramData, refreshPrograms, syncProgramData]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const registry = getProgramRegistry();

        // If we have initial program data, use it to initialize the default program
        if (initialProgramData) {
          initializeDefaultProgram(initialProgramData);
        }

        // Get the current active program
        let program = registry.getActiveProgram();

        if (program) {
          let data: WorkoutPlan;
          let shouldSyncProgramData = false;

          // If we already have program data matching the active program, use it
          if (initialProgramData && initialProgramData.plan.id === program.id) {
            data = initialProgramData;
            shouldSyncProgramData = true;
          } else {
            // Check if program data is already stored in registry
            const storedData = registry.getProgramData(program.id);

            if (storedData) {
              // Use stored data - construct a minimal WorkoutPlan
              data = createMinimalWorkoutPlan(program);

              // Sync with schedule utilities using stored schedule
              setActiveScheduleProgram(program.id);
              setRawSchedule(storedData.schedule, program.id);
              buildCompleteSchedule(program.id);

              setSchedule(storedData.schedule);
              setMetadata(storedData.metadata);
            } else if (program.dataPath) {
              // Otherwise load it from the data path
              data = await loadProgramData(program.dataPath);

              // We loaded the full plan JSON, so we should parse + sync it.
              shouldSyncProgramData = true;
            } else {
              throw new Error('Program data is not available');
            }
          }

          // Only sync when we have full plan JSON.
          // If we used stored schedule + minimal plan, syncing would overwrite schedule with an empty one.
          if (shouldSyncProgramData) {
            syncProgramData(program.id, data);
          }

          setProgramData(data);
          setCurrentProgram(program);
        }

        refreshPrograms();
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        console.error('Failed to initialize program context:', errorObj);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [initialProgramData, loadProgramData, refreshPrograms, syncProgramData]);

  /**
   * Context value
   */
  const value = useMemo<ProgramContextValue>(() => ({
    currentProgram,
    programData,
    schedule,
    metadata,
    availablePrograms,
    switchProgram,
    isLoading,
    error,
    refreshPrograms,
    currentProgramId: currentProgram?.id ?? null,
  }), [
    currentProgram,
    programData,
    schedule,
    metadata,
    availablePrograms,
    switchProgram,
    isLoading,
    error,
    refreshPrograms,
  ]);

  return (
    <ProgramContext.Provider value={value}>
      {children}
    </ProgramContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access the program context
 *
 * @throws Error if used outside of ProgramProvider
 */
export function useProgram(): ProgramContextValue {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error('useProgram must be used within a ProgramProvider');
  }
  return context;
}

/**
 * Hook to access just the current program (for simpler use cases)
 */
export function useCurrentProgram(): ProgramManifest | null {
  const { currentProgram } = useProgram();
  return currentProgram;
}

/**
 * Hook to get the current program ID
 */
export function useCurrentProgramId(): string | null {
  const { currentProgramId } = useProgram();
  return currentProgramId;
}

/**
 * Hook to check if a program is loading
 */
export function useProgramLoading(): boolean {
  const { isLoading } = useProgram();
  return isLoading;
}

/**
 * Hook to access program schedule and metadata
 */
export function useProgramSchedule(): { schedule: InternalSchedule | null; metadata: WorkoutPlanMetadata | null } {
  const { schedule, metadata } = useProgram();
  return { schedule, metadata };
}
