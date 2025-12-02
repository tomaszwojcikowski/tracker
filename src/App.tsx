/**
 * App.tsx - Main Application Component
 *
 * Root component handling routing, state management, and view switching.
 * Migrated from App.jsx as part of TypeScript migration.
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './main.css';
import { NavigationBar } from './components/navigation';
import { TopAppBar } from './components/TopAppBar';
import { LoadingScreen, ErrorScreen } from './components/screens';
import { Dashboard, HistoryView, SettingsView, ExerciseLibraryView, WorkoutPlayer } from './components/views';
import { SkipLink } from './components/SkipLink';
import { Onboarding, hasCompletedOnboarding } from './components/Onboarding';
import { useWorkoutTimer } from './hooks';

// Import from TypeScript utilities
import {
    buildCompleteSchedule as buildSchedule,
    setRawSchedule,
    type RawScheduleItem,
} from './utils/schedule';
import {
    getUrlParams,
    saveAppState,
    loadAppState,
    buildUrl,
    VALID_TABS,
} from './utils/urlState';
import { FETCH_TIMEOUT_MS } from './constants';

// Import exercise history utilities
import {
    getExerciseHistory,
    calculateExerciseStats,
    getAllExercisesWithHistory,
} from './utils/exerciseHistory';

import type { Exercise } from './types';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'tab' | 'workout' | 'empty-workout';
type TabId = 'train' | 'library' | 'history' | 'coach' | 'profile';
type ValidDay = 1 | 2 | 3 | 5;

interface AppStateLocal {
    viewMode: ViewMode;
    activeTab: TabId;
    currentWeek: number;
    activeDay: ValidDay;
    programId?: string;
}

// ============================================================================
// GLOBAL STATE & DATA STRUCTURES
// ============================================================================

// Global data arrays loaded from JSON files in main.jsx
let RAW_SCHEDULE: RawScheduleItem[] = [];
let EXERCISE_LIBRARY: Exercise[] = [];

// Wrapper function for buildCompleteSchedule
const buildCompleteSchedule = (): void => {
    buildSchedule();
    // The complete schedule is maintained internally by the schedule module
    // and accessed via getCompleteSchedule() when needed
};

// ============================================================================
// URL & STATE MANAGEMENT UTILITIES
// ============================================================================

// Local updateUrl wrapper that returns the URL string
const updateUrl = (state: AppStateLocal): string => {
    return buildUrl(state as Parameters<typeof buildUrl>[0]);
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('train');
    const [viewMode, setViewMode] = useState<ViewMode>('tab');
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [activeDay, setActiveDay] = useState<ValidDay>(1);
    const [programId, setProgramId] = useState<string | undefined>(undefined);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    // Initialize onboarding state directly to avoid flash of content
    const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !hasCompletedOnboarding());

    // Track the initial history length to know if we can go back
    const initialHistoryLength = useRef<number>(window.history.length);

    // Workout timer - only active when in workout mode
    const workoutTimer = useWorkoutTimer(currentWeek, activeDay, viewMode === 'workout');

    // Initialize state from URL or localStorage on mount
    useEffect(() => {
        const urlParams = getUrlParams();
        const savedState = loadAppState();

        // Priority: URL params > saved state > defaults
        if (urlParams.view === 'workout' && urlParams.week !== null && urlParams.day !== null) {
            // Load from URL - workout view
            setViewMode('workout');
            setCurrentWeek(urlParams.week);
            setActiveDay(urlParams.day as ValidDay);
        } else if (urlParams.tab && VALID_TABS.includes(urlParams.tab)) {
            // Load from URL - tab view (validate tab name)
            setViewMode('tab');
            setActiveTab(urlParams.tab as TabId);
            if (urlParams.week !== null) {
                setCurrentWeek(urlParams.week);
            }
        } else if (savedState) {
            // Load from saved state
            setViewMode(savedState.viewMode as ViewMode);
            setActiveTab(savedState.activeTab as TabId);
            setCurrentWeek(savedState.currentWeek);
            setActiveDay(savedState.activeDay as ValidDay);
        }

        // Load program ID from URL or saved state
        if (urlParams.programId) {
            setProgramId(urlParams.programId);
        } else if (savedState?.programId) {
            setProgramId(savedState.programId);
        }
        // Use defaults if nothing else matches - already set

        setIsInitialized(true);
    }, []);

    // Update URL and save state whenever it changes
    useEffect(() => {
        if (!isInitialized) return;

        const state: AppStateLocal = { viewMode, activeTab, currentWeek, activeDay, programId };

        // Save to localStorage (always sync localStorage)
        saveAppState(state as Parameters<typeof saveAppState>[0]);

        // Keep backward compatibility with old tracker_week key
        localStorage.setItem('tracker_week', String(currentWeek));

        // Update URL only via replaceState to avoid polluting history
        // pushState is called explicitly in navigation functions
        const newUrl = updateUrl(state);
        window.history.replaceState(state, '', newUrl);
    }, [viewMode, activeTab, currentWeek, activeDay, programId, isInitialized]);

    // Handle browser back/forward button
    useEffect(() => {
        const handlePopState = (event: PopStateEvent): void => {
            if (event.state) {
                // State exists in history, use it
                const state = event.state as Partial<AppStateLocal>;
                if (state.viewMode !== undefined) setViewMode(state.viewMode);
                if (state.activeTab !== undefined) setActiveTab(state.activeTab);
                if (state.currentWeek !== undefined) setCurrentWeek(state.currentWeek);
                if (state.activeDay !== undefined) setActiveDay(state.activeDay);
            } else {
                // No state in history (e.g., initial page load), parse from URL
                const urlParams = getUrlParams();

                if (urlParams.view === 'workout' && urlParams.week !== null && urlParams.day !== null) {
                    // Navigating back to a workout view
                    setViewMode('workout');
                    setCurrentWeek(urlParams.week);
                    setActiveDay(urlParams.day as ValidDay);
                } else {
                    // Navigating back to tab view (or default)
                    setViewMode('tab');
                    if (urlParams.tab && VALID_TABS.includes(urlParams.tab)) {
                        setActiveTab(urlParams.tab as TabId);
                    } else {
                        setActiveTab('train'); // Default tab
                    }
                    if (urlParams.week !== null) {
                        setCurrentWeek(urlParams.week);
                    }
                }
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const startWorkout = (day: number): void => {
        setActiveDay(day as ValidDay);
        setViewMode('workout');

        // Push new entry to history
        const state: AppStateLocal = { viewMode: 'workout', activeTab, currentWeek, activeDay: day as ValidDay, programId };
        const newUrl = updateUrl(state);
        window.history.pushState(state, '', newUrl);
    };

    const startEmptyWorkout = (): void => {
        setViewMode('empty-workout');

        // Push new entry to history for empty workout
        const state: AppStateLocal = { viewMode: 'empty-workout', activeTab, currentWeek, activeDay, programId };
        const newUrl = buildUrl({ ...state, viewMode: 'tab', activeTab: 'train' } as Parameters<typeof buildUrl>[0]) + '&emptyWorkout=true';
        window.history.pushState(state, '', newUrl);
    };

    const goBack = (): void => {
        // Check if there's history to go back to
        const hasHistory = window.history.length > initialHistoryLength.current;

        if (hasHistory) {
            // Go back in browser history
            window.history.back();
        } else {
            // No history available (e.g., direct URL access), fallback to main view
            setViewMode('tab');
            setActiveTab('train');

            // Update URL to reflect the main view
            const state: AppStateLocal = { viewMode: 'tab', activeTab: 'train', currentWeek, activeDay, programId };
            const newUrl = updateUrl(state);
            window.history.replaceState(state, '', newUrl);
        }
    };

    const handleTabChange = (newTab: TabId): void => {
        setActiveTab(newTab);

        // Push new entry to history for tab changes
        const state: AppStateLocal = { viewMode: 'tab', activeTab: newTab, currentWeek, activeDay, programId };
        const newUrl = updateUrl(state);
        window.history.pushState(state, '', newUrl);
    };

    /**
     * Handle program change from Dashboard or Settings
     * Updates URL with new program ID
     */
    const handleProgramChange = (newProgramId: string): void => {
        setProgramId(newProgramId);

        // Reset week to 1 when switching programs
        setCurrentWeek(1);

        // Update URL with new program
        const state: AppStateLocal = { viewMode, activeTab, currentWeek: 1, activeDay, programId: newProgramId };
        const newUrl = updateUrl(state);
        window.history.replaceState(state, '', newUrl);
    };

    const getTitle = (): string => {
        if (viewMode === 'empty-workout') return 'Custom Workout';
        if (viewMode === 'workout') return `Day ${activeDay}`;
        switch (activeTab) {
            case 'train': return 'Dashboard';
            case 'library': return 'Exercise Library';
            case 'history': return 'History';
            case 'profile': return 'Settings';
            default: return 'Dashboard';
        }
    };

    const getSubtitle = (): string => {
        if (viewMode === 'empty-workout') return 'Add exercises to get started';
        if (viewMode === 'workout') return `Week ${currentWeek}`;
        if (activeTab === 'train') return 'OnePlus Strength';
        return '';
    };

    return (
        <>
            {showOnboarding && (
                <Onboarding onComplete={() => setShowOnboarding(false)} />
            )}
            <div className="min-h-screen min-h-[100dvh] bg-sys-black text-white font-sans flex flex-col max-w-md mx-auto relative">
                <SkipLink targetId="main-content" />
                <TopAppBar
                    title={getTitle()}
                    subtitle={getSubtitle()}
                    showBack={viewMode === 'workout' || viewMode === 'empty-workout'}
                    onBack={goBack}
                    workoutTimer={(viewMode === 'workout' || viewMode === 'empty-workout') ? {
                        elapsedSeconds: workoutTimer.elapsedSeconds,
                        isRunning: workoutTimer.isRunning,
                        onToggle: workoutTimer.toggle,
                    } : undefined}
                />

                {!isInitialized ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-lg text-sys-onSurfaceVar">Loading...</div>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {viewMode === 'workout' ? (
                            <motion.main
                                key="workout"
                                id="main-content"
                                className="flex-1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <WorkoutPlayer
                                    week={currentWeek}
                                    day={activeDay}
                                    onComplete={goBack}
                                    exerciseLibrary={EXERCISE_LIBRARY}
                                    onWorkoutFinish={workoutTimer.stop}
                                />
                            </motion.main>
                        ) : viewMode === 'empty-workout' ? (
                            <motion.main
                                key="empty-workout"
                                id="main-content"
                                className="flex-1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <WorkoutPlayer
                                    week={0}
                                    day={0}
                                    onComplete={goBack}
                                    exerciseLibrary={EXERCISE_LIBRARY}
                                    isEmptyWorkout={true}
                                    onWorkoutFinish={workoutTimer.stop}
                                />
                            </motion.main>
                        ) : (
                            <React.Fragment key="tab-content">
                                <motion.div
                                    key={activeTab}
                                    id="main-content"
                                    className="flex-1 flex flex-col"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === 'train' && (
                                        <Dashboard
                                            currentWeek={currentWeek}
                                            setCurrentWeek={setCurrentWeek}
                                            onStartWorkout={startWorkout}
                                            onStartEmptyWorkout={startEmptyWorkout}
                                            onProgramChange={handleProgramChange}
                                        />
                                    )}
                                    {activeTab === 'library' && (
                                        <ExerciseLibraryView
                                            exerciseLibrary={EXERCISE_LIBRARY}
                                            getAllExercisesWithHistory={getAllExercisesWithHistory}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            calculateExerciseStats={calculateExerciseStats as any}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            getExerciseHistory={getExerciseHistory as any}
                                        />
                                    )}
                                    {activeTab === 'history' && (
                                        <HistoryView
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            calculateExerciseStats={calculateExerciseStats as any}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            getExerciseHistory={getExerciseHistory as any}
                                            getAllExercisesWithHistory={getAllExercisesWithHistory}
                                        />
                                    )}
                                    {activeTab === 'profile' && <SettingsView />}
                                </motion.div>
                                <NavigationBar activeTab={activeTab} onTabChange={handleTabChange} />
                            </React.Fragment>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </>
    );
};

// ============================================================================
// EXPORTS
// ============================================================================

// Setter functions to update the global data
export function setRAW_SCHEDULE(data: RawScheduleItem[]): void {
    RAW_SCHEDULE.length = 0;
    RAW_SCHEDULE.push(...data);
    // Also update the schedule module
    setRawSchedule(data);
}

export function setEXERCISE_LIBRARY(data: Exercise[]): void {
    EXERCISE_LIBRARY.length = 0;
    EXERCISE_LIBRARY.push(...data);
}

// Utility function for fetching with timeout
export function fetchWithTimeout(
    url: string,
    timeout: number = FETCH_TIMEOUT_MS
): Promise<Response> {
    return Promise.race([
        fetch(url),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        ),
    ]);
}

// Export the App and utility functions for use in main.jsx
export { App, LoadingScreen, ErrorScreen, buildCompleteSchedule, FETCH_TIMEOUT_MS };
