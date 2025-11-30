/**
 * Program Context Provider
 *
 * Provides program state and switching functionality to all components.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ProgramManifest, WorkoutPlanJson } from '../services/programRegistry';
import { getProgramRegistry, initializeDefaultProgram } from '../services/programRegistry';

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
}

// ============================================================================
// CONTEXT
// ============================================================================

const ProgramContext = createContext<ProgramContextValue | undefined>(undefined);

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
 */
export function ProgramProvider({ children, initialProgramData }: ProgramProviderProps): React.ReactElement {
  const [currentProgram, setCurrentProgram] = useState<ProgramManifest | null>(null);
  const [programData, setProgramData] = useState<WorkoutPlan | null>(initialProgramData ?? null);
  const [availablePrograms, setAvailablePrograms] = useState<ProgramManifest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load program data from a URL
   */
  const loadProgramData = useCallback(async (dataPath: string): Promise<WorkoutPlan> => {
    const response = await fetch(dataPath);
    if (!response.ok) {
      throw new Error(`Failed to load program data: ${response.statusText}`);
    }
    return await response.json() as WorkoutPlan;
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

      // Load the program data
      const data = await loadProgramData(program.dataPath);
      
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
  }, [loadProgramData, refreshPrograms]);

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
        
        // If no active program, try to load the default
        if (!program && initialProgramData) {
          const manifest = registry.getAvailablePrograms().find(
            (p) => p.id === initialProgramData.plan.id
          );
          if (manifest) {
            registry.setActiveProgram(manifest.id);
            program = manifest;
          }
        }

        if (program) {
          // If we already have program data matching the active program, use it
          if (initialProgramData && initialProgramData.plan.id === program.id) {
            setProgramData(initialProgramData);
          } else {
            // Otherwise load it from the data path
            const data = await loadProgramData(program.dataPath);
            setProgramData(data);
          }
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
  }, [initialProgramData, loadProgramData, refreshPrograms]);

  /**
   * Context value
   */
  const value = useMemo<ProgramContextValue>(() => ({
    currentProgram,
    programData,
    availablePrograms,
    switchProgram,
    isLoading,
    error,
    refreshPrograms,
  }), [
    currentProgram,
    programData,
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
 * Hook to check if a program is loading
 */
export function useProgramLoading(): boolean {
  const { isLoading } = useProgram();
  return isLoading;
}
