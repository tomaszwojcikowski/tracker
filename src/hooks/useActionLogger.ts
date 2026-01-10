/**
 * useActionLogger Hook
 *
 * React hook for easy integration of action logging throughout the app.
 * Provides a simple API for logging user actions with automatic context capture.
 */

import { useCallback, useRef, useEffect } from 'react';
import type { ActionCategory, ActionType, ActionMetadata } from '../types';
import { logAction, getSessionId } from '../utils/actionLogger';

/**
 * Hook options for configuring automatic context
 */
export interface UseActionLoggerOptions {
  /** Component name for automatic context */
  component?: string;
  /** Whether to log mount/unmount events (default: false) */
  logLifecycle?: boolean;
}

/**
 * Return type for useActionLogger hook
 */
export interface UseActionLoggerReturn {
  /** Log an action with automatic context enrichment */
  log: (
    category: ActionCategory,
    type: ActionType,
    description?: string,
    metadata?: ActionMetadata
  ) => void;
  /** Log a navigation action */
  logNavigation: (type: ActionType, description?: string, metadata?: ActionMetadata) => void;
  /** Log a workout action */
  logWorkout: (type: ActionType, description?: string, metadata?: ActionMetadata) => void;
  /** Log an exercise action */
  logExercise: (type: ActionType, description?: string, metadata?: ActionMetadata) => void;
  /** Log a timer action */
  logTimer: (type: ActionType, description?: string, metadata?: ActionMetadata) => void;
  /** Log a settings action */
  logSettings: (type: ActionType, description?: string, metadata?: ActionMetadata) => void;
  /** Log a data action */
  logData: (type: ActionType, description?: string, metadata?: ActionMetadata) => void;
  /** Log a UI action */
  logUI: (type: ActionType, description?: string, metadata?: ActionMetadata) => void;
  /** Log an error action */
  logError: (type: ActionType, description?: string, metadata?: ActionMetadata) => void;
  /** Get current session ID */
  sessionId: string;
}

/**
 * Hook for logging user actions with automatic context
 *
 * @param options - Configuration options
 * @returns Action logger interface with convenience methods
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const logger = useActionLogger({ component: 'MyComponent' });
 *
 *   const handleClick = () => {
 *     logger.logUI('button_click', 'User clicked submit');
 *   };
 *
 *   return <button onClick={handleClick}>Submit</button>;
 * }
 * ```
 */
export function useActionLogger(options: UseActionLoggerOptions = {}): UseActionLoggerReturn {
  const { component, logLifecycle = false } = options;
  const sessionId = getSessionId();

  // Use ref to avoid creating new functions on every render
  const componentRef = useRef(component);
  componentRef.current = component;

  // Log lifecycle events if enabled
  useEffect(() => {
    if (logLifecycle && component) {
      logAction('ui', 'component_render', `${component} mounted`, {
        uiContext: { component },
      });

      return () => {
        logAction('ui', 'component_render', `${component} unmounted`, {
          uiContext: { component },
        });
      };
    }
  }, [logLifecycle, component]);

  // Main log function with context enrichment
  const log = useCallback(
    (
      category: ActionCategory,
      type: ActionType,
      description?: string,
      metadata?: ActionMetadata
    ) => {
      // Enrich metadata with component context if available
      const enrichedMetadata: ActionMetadata = {
        ...metadata,
        uiContext: {
          ...metadata?.uiContext,
          component: componentRef.current || metadata?.uiContext?.component,
        },
      };

      logAction(category, type, description, enrichedMetadata);
    },
    []
  );

  // Convenience methods for specific categories
  const logNavigation = useCallback(
    (type: ActionType, description?: string, metadata?: ActionMetadata) => {
      log('navigation', type, description, metadata);
    },
    [log]
  );

  const logWorkout = useCallback(
    (type: ActionType, description?: string, metadata?: ActionMetadata) => {
      log('workout', type, description, metadata);
    },
    [log]
  );

  const logExercise = useCallback(
    (type: ActionType, description?: string, metadata?: ActionMetadata) => {
      log('exercise', type, description, metadata);
    },
    [log]
  );

  const logTimer = useCallback(
    (type: ActionType, description?: string, metadata?: ActionMetadata) => {
      log('timer', type, description, metadata);
    },
    [log]
  );

  const logSettings = useCallback(
    (type: ActionType, description?: string, metadata?: ActionMetadata) => {
      log('settings', type, description, metadata);
    },
    [log]
  );

  const logData = useCallback(
    (type: ActionType, description?: string, metadata?: ActionMetadata) => {
      log('data', type, description, metadata);
    },
    [log]
  );

  const logUI = useCallback(
    (type: ActionType, description?: string, metadata?: ActionMetadata) => {
      log('ui', type, description, metadata);
    },
    [log]
  );

  const logError = useCallback(
    (type: ActionType, description?: string, metadata?: ActionMetadata) => {
      log('error', type, description, metadata);
    },
    [log]
  );

  return {
    log,
    logNavigation,
    logWorkout,
    logExercise,
    logTimer,
    logSettings,
    logData,
    logUI,
    logError,
    sessionId,
  };
}
