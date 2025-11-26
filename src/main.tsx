/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App, buildCompleteSchedule, fetchWithTimeout, FETCH_TIMEOUT_MS, setRAW_SCHEDULE, setEXERCISE_LIBRARY } from './App';
import { loadWorkoutPlan, WorkoutPlanMetadata } from './workout-plan-utils';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen, ErrorScreen } from './components/screens';

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
    fetchWithTimeout(`${import.meta.env.BASE_URL}workout-plan-v2.json`, FETCH_TIMEOUT_MS).then(response => {
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
        // Load and convert workout plan (supports both v1.0.0 and v2.0.0 formats)
        let schedule;
        let metadata: WorkoutPlanMetadata;
        try {
            const result = loadWorkoutPlan(scheduleData);
            schedule = result.schedule;
            metadata = result.metadata;
            console.log(`Loaded workout plan: "${metadata.name}" (format v${metadata.version})`);
            console.log(`  Duration: ${metadata.durationWeeks} weeks`);
            if (metadata.phases && metadata.phases.length > 0) {
                console.log(`  Phases: ${metadata.phases.length}`);
                console.log(`  Goals: ${(metadata.goals || []).join(', ')}`);
            }
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

        console.log(`Loaded ${schedule.length} schedule items and ${exercisesData.length} exercises`);

        // Store metadata in a namespaced global for potential future use
        // This allows components to access plan metadata without prop drilling
        if (typeof window !== 'undefined') {
            if (!window.TRACKER_APP) {
                window.TRACKER_APP = {};
            }
            window.TRACKER_APP.workoutPlanMetadata = metadata;
        }

        // Re-render with the actual app wrapped in PWA provider and ErrorBoundary
        root.render(
            <React.Suspense fallback={<LoadingScreen />}>
                <ErrorBoundary>
                    <PWAApp>
                        <App />
                    </PWAApp>
                </ErrorBoundary>
            </React.Suspense>
        );
    })
    .catch((error: Error) => {
        console.error('Error loading data:', error);
        root.render(<ErrorScreen message={`Failed to load data: ${error.message}`} />);
    });
