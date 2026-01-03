/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App, buildCompleteSchedule, fetchWithTimeout, FETCH_TIMEOUT_MS, setRAW_SCHEDULE, setEXERCISE_LIBRARY } from './App.tsx';
import { loadWorkoutPlan, WorkoutPlanMetadata } from './workout-plan-utils';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen, ErrorScreen } from './components/screens';
import { initErrorReporting, captureError } from './utils/errorReporting';
import { autoMigrate, getMigrationStatus } from './services/storageMigration';
import { initializeDefaultProgram, getProgramRegistry } from './services/programRegistry';
import { ProgramProvider } from './context/ProgramContext';

// Initialize error reporting as early as possible
initErrorReporting();

// ============================================================================
// VISUAL ERROR TOAST FOR MOBILE DEBUGGING
// ============================================================================

/**
 * Shows a visual error toast on screen for mobile debugging
 * This helps debug issues when console is not accessible
 */
function showErrorToast(message: string, details?: string): void {
    // Create or reuse error container
    let container = document.getElementById('error-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'error-toast-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 99999;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        margin: 8px;
        padding: 12px 16px;
        background: rgba(220, 38, 38, 0.95);
        border: 1px solid rgba(248, 113, 113, 0.5);
        border-radius: 12px;
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        backdrop-filter: blur(8px);
        pointer-events: auto;
        animation: slideDown 0.3s ease-out;
    `;

    // Add animation style if not exists
    if (!document.getElementById('error-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'error-toast-styles';
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    toast.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 8px;">
            <div style="flex-shrink: 0; margin-top: 2px;">⚠️</div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
                <div style="opacity: 0.9; word-break: break-word;">${message}</div>
                ${details ? `<div style="opacity: 0.7; font-size: 10px; margin-top: 4px; word-break: break-all;">${details}</div>` : ''}
            </div>
            <button style="flex-shrink: 0; background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; line-height: 1;" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    container.appendChild(toast);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 10000);
}

// Set up global error handlers for uncaught errors
window.addEventListener('error', (event: ErrorEvent) => {
    const errorMessage = event.message || 'Unknown error';
    const errorDetails = event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined;

    // Show visual toast for mobile debugging
    showErrorToast(errorMessage, errorDetails);

    captureError(event.error || new Error(event.message), 'fatal', {
        component: 'global',
        action: 'unhandledError',
        extra: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
        },
    });
});

// Set up handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    const errorMessage = error.message || 'Unhandled promise rejection';
    const errorStack = error.stack?.split('\n')[1]?.trim();

    // Show visual toast for mobile debugging
    showErrorToast(errorMessage, errorStack);

    captureError(error, 'error', {
        component: 'global',
        action: 'unhandledRejection',
    });
});

// Extend Window interface for tracker app metadata
declare global {
    interface Window {
        TRACKER_APP?: {
            workoutPlanMetadata?: WorkoutPlanMetadata;
        };
    }
}

// PWA wrapper component for update prompts
const PWAApp = React.lazy(() => import('./components/PWAWrapper'));

// Initialize the app with loading state
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element not found');
}
const root = ReactDOM.createRoot(rootElement);
root.render(<LoadingScreen />);

// Load both schedule and exercise library data with timeout
Promise.all([
    fetchWithTimeout(`${import.meta.env.BASE_URL}workout-plan-v2.5.json`, FETCH_TIMEOUT_MS).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error loading schedule! status: ${response.status}`);
        }
        return response.json();
    }).catch((error: Error) => {
        if (error.message === 'Request timeout') {
            throw new Error('Network timeout - check your connection');
        }
        throw error;
    }),
    fetchWithTimeout(`${import.meta.env.BASE_URL}exercises.json`, FETCH_TIMEOUT_MS).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error loading exercises! status: ${response.status}`);
        }
        return response.json();
    }).catch((error: Error) => {
        if (error.message === 'Request timeout') {
            throw new Error('Network timeout - check your connection');
        }
        throw error;
    })
])
    .then(([scheduleData, exercisesData]) => {
        // Load and convert workout plan (v2.0.0 format only)
        let schedule;
        let metadata: WorkoutPlanMetadata;
        try {
            const result = loadWorkoutPlan(scheduleData);
            schedule = result.schedule;
            metadata = result.metadata;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Invalid workout plan format: ${errorMessage}`);
        }

        // Validate that we have schedule data
        if (!Array.isArray(schedule) || schedule.length === 0) {
            throw new Error('Invalid schedule data: expected non-empty array after conversion');
        }

        // Validate exercise library data
        if (!Array.isArray(exercisesData) || exercisesData.length === 0) {
            throw new Error('Invalid exercise library data: expected non-empty array');
        }

        // Validate first exercise has required properties
        const firstExercise = exercisesData[0];
        const requiredExerciseKeys = ['id', 'name', 'category', 'primaryMuscles', 'equipment', 'isBodyweight'];
        const hasRequiredExerciseKeys = requiredExerciseKeys.every(key => key in firstExercise);
        if (!hasRequiredExerciseKeys) {
            throw new Error('Invalid exercise library data: missing required properties');
        }

        // Assign the loaded data to global variables using setter functions
        setRAW_SCHEDULE(schedule);
        setEXERCISE_LIBRARY(exercisesData);

        // Build the complete schedule with standard warmups/cooldowns
        buildCompleteSchedule();


        // Store metadata in a namespaced global for potential future use
        // This allows components to access plan metadata without prop drilling
        if (typeof window !== 'undefined') {
            if (!window.TRACKER_APP) {
                window.TRACKER_APP = {};
            }
            window.TRACKER_APP.workoutPlanMetadata = metadata;
        }

        // Initialize program registry with the loaded workout plan
        // This registers the default program if not already registered
        initializeDefaultProgram(scheduleData);

        // Store program data in registry for access by other modules
        // ONLY if the loaded plan matches the active program ID
        const registry = getProgramRegistry();

        // DEBUG: Log registry state after initialization

        const activeProgram = registry.getActiveProgram();
        if (activeProgram && activeProgram.id === metadata.id) {
            registry.setProgramData(activeProgram.id, {
                schedule: schedule,
                metadata: metadata,
            });
        }

        // Run storage migration if needed (migrates legacy keys to program-scoped keys)
        // This is safe to call on every app start - it's a no-op if already migrated
        const migrationResult = autoMigrate();
        if (migrationResult) {
            const status = getMigrationStatus();
            if (status && status.keysMigrated > 0) {
            }
        } else {
            console.warn('Storage migration failed - some data may not be isolated per program');
        }

        // Re-render with the actual app wrapped in PWA provider and ErrorBoundary
        root.render(
            <React.Suspense fallback={<LoadingScreen />}>
                <ErrorBoundary>
                    <ProgramProvider>
                        <PWAApp>
                            <App />
                        </PWAApp>
                    </ProgramProvider>
                </ErrorBoundary>
            </React.Suspense>
        );
    })
    .catch((error: Error) => {
        console.error('Error loading data:', error);
        captureError(error, 'fatal', {
            component: 'main',
            action: 'loadData',
        });
        root.render(<ErrorScreen message={`Failed to load data: ${error.message}`} />);
    });
