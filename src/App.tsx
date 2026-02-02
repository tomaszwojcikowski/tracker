/**
 * App.tsx - Main Application Component
 *
 * Root component handling routing, state management, and view switching.
 * Migrated from App.jsx as part of TypeScript migration.
 */

import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './main.css';
import { NavigationBar } from './components/navigation';
import { SideRail } from './components/SideRail';
import { TopAppBar } from './components/TopAppBar';
import { LoadingScreen, ErrorScreen } from './components/screens';
import { SkipLink } from './components/SkipLink';
import { Onboarding, hasCompletedOnboarding } from './components/Onboarding';
import { UnifiedFloatingTimerButton } from './components/UnifiedFloatingTimerButton';
import { useWorkoutTimer, useTheme } from './hooks';
import { useProgram } from './context/ProgramContext';

// Lazy load heavy view components for code splitting
// Import named exports and re-export as default for lazy loading
const Dashboard = lazy(() => import('./components/views/Dashboard').then(module => ({ default: module.Dashboard })));
const HistoryView = lazy(() => import('./components/views/HistoryView').then(module => ({ default: module.HistoryView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(module => ({ default: module.SettingsView })));
const ExerciseLibraryView = lazy(() => import('./components/views/ExerciseLibraryView').then(module => ({ default: module.ExerciseLibraryView })));
const WorkoutPlayer = lazy(() => import('./components/views/WorkoutPlayer').then(module => ({ default: module.WorkoutPlayer })));

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

import type { Exercise, WorkoutProgressData, TrainingDay } from './types';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'tab' | 'workout' | 'empty-workout';
type TabId = 'train' | 'library' | 'history' | 'profile';
type ValidDay = TrainingDay;

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
    // Initialize theme globally
    useTheme();

    const [activeTab, setActiveTab] = useState<TabId>('train');
    const [viewMode, setViewMode] = useState<ViewMode>('tab');
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [activeDay, setActiveDay] = useState<ValidDay>(1);
    const { currentProgramId, switchProgram, isLoading: programLoading } = useProgram();
    // Keep track of the *requested* programId (URL/localStorage context), even if the program
    // isn't installed/loaded yet. This enables stable URL routing and persistence.
    const [requestedProgramId, setRequestedProgramId] = useState<string | undefined>(undefined);
    const prevProgramIdRef = useRef<string | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    // Initialize onboarding state directly to avoid flash of content
    const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !hasCompletedOnboarding());

    // Workout timer
    // Intentionally does NOT auto-start on entering workout mode.
    // It starts only when the user taps the timer, or when they complete a set.
    const workoutTimer = useWorkoutTimer(currentWeek, activeDay, false);

    // Keep timer scoped to workout mode: pause when leaving workout views.
    useEffect(() => {
        if (viewMode !== 'workout' && viewMode !== 'empty-workout') {
            workoutTimer.pause();
        }
    }, [viewMode, workoutTimer.pause]);

    // Workout progress state for TopAppBar progress bar
    const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgressData | null>(null);

    // Handle workout progress updates from WorkoutPlayer
    const handleProgressChange = useCallback((progress: WorkoutProgressData) => {
        setWorkoutProgress(progress);
    }, []);

    // Clear workout progress when leaving workout mode
    useEffect(() => {
        if (viewMode !== 'workout' && viewMode !== 'empty-workout') {
            setWorkoutProgress(null);
        }
    }, [viewMode]);

    // Initialize state from URL or localStorage on mount
    useEffect(() => {
        if (isInitialized) return;

        let cancelled = false;
        const initialize = async () => {
            const urlParams = getUrlParams();
            const savedState = loadAppState();

            // Priority: URL params > saved state > defaults
            if (urlParams.view === 'workout' && urlParams.week !== null && urlParams.day !== null) {
                setViewMode('workout');
                setCurrentWeek(urlParams.week);
                setActiveDay(urlParams.day as ValidDay);
            } else if (urlParams.view === 'empty-workout') {
                setViewMode('empty-workout');
            } else if (urlParams.tab && VALID_TABS.includes(urlParams.tab)) {
                setViewMode('tab');
                setActiveTab(urlParams.tab as TabId);
                if (urlParams.week !== null) {
                    setCurrentWeek(urlParams.week);
                }
            } else if (savedState) {
                setViewMode(savedState.viewMode as ViewMode);
                setActiveTab(savedState.activeTab as TabId);
                setCurrentWeek(savedState.currentWeek);
                setActiveDay(savedState.activeDay as ValidDay);
            }

            const desiredProgramId = urlParams.programId ?? savedState?.programId;
            setRequestedProgramId(desiredProgramId ?? undefined);

            // Only the URL explicitly controls program switching on initialization.
            // The ProgramRegistry already persists the active program for normal reloads.
            if (urlParams.programId && urlParams.programId !== currentProgramId) {
                try {
                    await switchProgram(urlParams.programId);
                } catch (error) {
                    console.warn('Failed to switch program from initial URL params:', error);
                }
            }

            if (!cancelled) {
                setIsInitialized(true);
            }
        };

        void initialize();

        return () => {
            cancelled = true;
        };
    }, [currentProgramId, isInitialized, switchProgram]);

    // Keep URL/localStorage programId aligned with real program switches (e.g. via Settings),
    // but avoid overwriting an explicit URL/localStorage programId that couldn't be loaded.
    useEffect(() => {
        const prevProgramId = prevProgramIdRef.current;
        prevProgramIdRef.current = currentProgramId;

        if (!isInitialized) return;
        if (!currentProgramId) return;

        // If we're following along with the active program (no explicit request, or we were
        // previously aligned), keep the requestedProgramId in sync.
        if (requestedProgramId === undefined || requestedProgramId === prevProgramId) {
            setRequestedProgramId(currentProgramId);
        }
    }, [currentProgramId, isInitialized, requestedProgramId]);

    // Update URL and save state whenever it changes
    useEffect(() => {
        if (!isInitialized) return;

        const effectiveProgramId = requestedProgramId ?? (currentProgramId ?? undefined);
        const state: AppStateLocal = { viewMode, activeTab, currentWeek, activeDay, programId: effectiveProgramId };

        // Save to localStorage (always sync localStorage)
        saveAppState(state as Parameters<typeof saveAppState>[0]);

        // Keep backward compatibility with old tracker_week key
        localStorage.setItem('tracker_week', String(currentWeek));

        // Update URL only via replaceState to avoid polluting history
        // pushState is called explicitly in navigation functions
        const newUrl = updateUrl(state);
        window.history.replaceState(state, '', newUrl);
    }, [viewMode, activeTab, currentWeek, activeDay, currentProgramId, isInitialized]);

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
                if (state.programId) {
                    setRequestedProgramId(state.programId);
                    if (state.programId !== currentProgramId) {
                        void switchProgram(state.programId).catch((error) => {
                            console.warn('Failed to switch program from history state:', error);
                        });
                    }
                }
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

                if (urlParams.programId) {
                    setRequestedProgramId(urlParams.programId);
                    if (urlParams.programId !== currentProgramId) {
                        void switchProgram(urlParams.programId).catch((error) => {
                            console.warn('Failed to switch program from URL popstate:', error);
                        });
                    }
                }
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [currentProgramId, switchProgram]);

    const startWorkout = (day: number): void => {
        setActiveDay(day as ValidDay);
        setViewMode('workout');

        // Push new entry to history
        const effectiveProgramId = requestedProgramId ?? (currentProgramId ?? undefined);
        const state: AppStateLocal = { viewMode: 'workout', activeTab, currentWeek, activeDay: day as ValidDay, programId: effectiveProgramId };
        const newUrl = updateUrl(state);
        window.history.pushState(state, '', newUrl);
    };

    const startEmptyWorkout = (): void => {
        workoutTimer.reset();

        setViewMode('empty-workout');

        const effectiveProgramId = requestedProgramId ?? (currentProgramId ?? undefined);
        const state: AppStateLocal = { viewMode: 'empty-workout', activeTab, currentWeek, activeDay, programId: effectiveProgramId };
        const newUrl = buildUrl(state as Parameters<typeof buildUrl>[0]);
        window.history.pushState(state, '', newUrl);
    };

    const goBack = (): void => {
        // Always return to main tab without leaving the app/origin
        setViewMode('tab');
        setActiveTab('train');

        const effectiveProgramId = requestedProgramId ?? (currentProgramId ?? undefined);
        const state: AppStateLocal = { viewMode: 'tab', activeTab: 'train', currentWeek, activeDay, programId: effectiveProgramId };
        const newUrl = updateUrl(state);
        window.history.replaceState(state, '', newUrl);
    };

    const handleTabChange = (newTab: TabId): void => {
        setActiveTab(newTab);

        // Push new entry to history for tab changes
        const effectiveProgramId = requestedProgramId ?? (currentProgramId ?? undefined);
        const state: AppStateLocal = { viewMode: 'tab', activeTab: newTab, currentWeek, activeDay, programId: effectiveProgramId };
        const newUrl = updateUrl(state);
        window.history.pushState(state, '', newUrl);
    };

    /**
     * Handle program change from Dashboard or Settings
     * Updates URL with new program ID
     */
    const handleProgramChange = (newProgramId: string): void => {
        // Reset week to 1 when switching programs
        setCurrentWeek(1);

        setRequestedProgramId(newProgramId);

        void switchProgram(newProgramId).catch((error) => {
            console.warn('Failed to switch program from UI:', error);
        });

        // Update URL with new program
        const state: AppStateLocal = { viewMode, activeTab, currentWeek: 1, activeDay, programId: newProgramId };
        const newUrl = updateUrl(state);
        window.history.replaceState(state, '', newUrl);
    };

    const getTitle = (): string => {
        if (viewMode === 'empty-workout') return 'Custom Workout';
        if (viewMode === 'workout') return `Day ${activeDay}`;
        switch (activeTab) {
            case 'train': return `Week ${currentWeek}`;
            case 'library': return 'Exercise Library';
            case 'history': return 'History';
            case 'profile': return 'Settings';
            default: return 'Dashboard';
        }
    };

    const getSubtitle = (): string => {
        if (viewMode === 'empty-workout') return 'Add exercises to get started';
        if (viewMode === 'workout') return `Week ${currentWeek}`;
        if (activeTab === 'train') return '';
        return '';
    };

    return (
        <>
            {showOnboarding && (
                <Onboarding onComplete={() => setShowOnboarding(false)} />
            )}
            {/* Desktop Side Rail (Phase 3) - Hidden on mobile, visible on desktop >= 900px */}
            {viewMode === 'tab' && (
                <SideRail
                    activeTab={activeTab as 'train' | 'library' | 'history' | 'profile'}
                    onTabChange={handleTabChange}
                />
            )}
            <div className="min-h-screen min-h-[100dvh] bg-sys-surface text-sys-onSurface font-sans flex flex-col max-w-md mx-auto relative app-container">
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
                    progressBar={workoutProgress && workoutProgress.totalSets > 0 ? {
                        progress: workoutProgress.progress,
                        completedSets: workoutProgress.completedSets,
                        totalSets: workoutProgress.totalSets,
                    } : undefined}
                />

                {!isInitialized || programLoading ? (
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
                                <Suspense fallback={<LoadingScreen />}>
                                    <WorkoutPlayer
                                        week={currentWeek}
                                        day={activeDay}
                                        onComplete={goBack}
                                        exerciseLibrary={EXERCISE_LIBRARY}
                                        onWorkoutFinish={workoutTimer.stop}
                                        onWorkoutTimerStart={workoutTimer.start}
                                        onProgressChange={handleProgressChange}
                                    />
                                </Suspense>
                                <UnifiedFloatingTimerButton week={currentWeek} day={activeDay} />
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
                                <Suspense fallback={<LoadingScreen />}>
                                    <WorkoutPlayer
                                        week={0}
                                        day={0}
                                        onComplete={goBack}
                                        exerciseLibrary={EXERCISE_LIBRARY}
                                        isEmptyWorkout={true}
                                        onWorkoutFinish={workoutTimer.stop}
                                        onWorkoutTimerStart={workoutTimer.start}
                                        onProgressChange={handleProgressChange}
                                    />
                                </Suspense>
                                <UnifiedFloatingTimerButton week={0} day={0} />
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
                                    <Suspense fallback={<LoadingScreen />}>
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
                                    </Suspense>
                                </motion.div>
                                {/* Show unified timer on dashboard (train tab) */}
                                {activeTab === 'train' && <UnifiedFloatingTimerButton week={currentWeek} day={0} />}
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
