import React, { useState, useEffect, useRef } from 'react';
import './main.css';
import { NavigationBar, TabContent } from './components/navigation';
import { TopAppBar } from './components/TopAppBar';
import { LoadingScreen, ErrorScreen } from './components/screens';
import { Dashboard, HistoryView, SettingsView, ExerciseLibraryView, WorkoutPlayer } from './components/views';
import { SkipLink } from './components/SkipLink';
import { Onboarding, hasCompletedOnboarding } from './components/Onboarding';
import { useLucideIcons } from './hooks';

// Import from TypeScript utilities
import {
    buildCompleteSchedule as buildSchedule,
    getCompleteSchedule,
    setRawSchedule,
} from './utils/schedule';
import {
    getUrlParams,
    saveAppState,
    loadAppState,
    buildUrl,
    VALID_TABS,
} from './utils/urlState';
import { FETCH_TIMEOUT_MS } from './constants';

// Import exercise history utilities from TypeScript module
import {
    getExerciseHistory,
    calculateExerciseStats,
    getAllExercisesWithHistory,
} from './utils/exerciseHistory';

// ============================================================================
// GLOBAL STATE & DATA STRUCTURES
// ============================================================================

// Global data arrays loaded from JSON files in main.jsx
let RAW_SCHEDULE = [];
let COMPLETE_SCHEDULE = [];
let EXERCISE_LIBRARY = [];

// Wrapper function for buildCompleteSchedule that also updates local COMPLETE_SCHEDULE
const buildCompleteSchedule = () => {
    buildSchedule();
    COMPLETE_SCHEDULE = getCompleteSchedule();
};

// ============================================================================
// URL & STATE MANAGEMENT UTILITIES
// ============================================================================

// Local updateUrl wrapper that returns the URL string
const updateUrl = (state) => {
    return buildUrl(state);
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

        const App = () => {
            const [activeTab, setActiveTab] = useState('train');
            const [viewMode, setViewMode] = useState('tab');
            const [currentWeek, setCurrentWeek] = useState(1);
            const [activeDay, setActiveDay] = useState(1);
            const [isInitialized, setIsInitialized] = useState(false);
            // Initialize onboarding state directly to avoid flash of content
            const [showOnboarding, setShowOnboarding] = useState(() => !hasCompletedOnboarding());

            // Track the initial history length to know if we can go back
            const initialHistoryLength = useRef(window.history.length);

            // Initialize state from URL or localStorage on mount
            useEffect(() => {
                const urlParams = getUrlParams();
                const savedState = loadAppState();

                // Priority: URL params > saved state > defaults
                if (urlParams.view === 'workout' && urlParams.week !== null && urlParams.day !== null) {
                    // Load from URL - workout view
                    setViewMode('workout');
                    setCurrentWeek(urlParams.week);
                    setActiveDay(urlParams.day);
                } else if (urlParams.tab && VALID_TABS.includes(urlParams.tab)) {
                    // Load from URL - tab view (validate tab name)
                    setViewMode('tab');
                    setActiveTab(urlParams.tab);
                    if (urlParams.week !== null) {
                        setCurrentWeek(urlParams.week);
                    }
                } else if (savedState) {
                    // Load from saved state
                    setViewMode(savedState.viewMode);
                    setActiveTab(savedState.activeTab);
                    setCurrentWeek(savedState.currentWeek);
                    setActiveDay(savedState.activeDay);
                } else {
                    // Use defaults - already set
                }

                setIsInitialized(true);
            }, []);

            // Update URL and save state whenever it changes
            useEffect(() => {
                if (!isInitialized) return;

                const state = { viewMode, activeTab, currentWeek, activeDay };

                // Save to localStorage (always sync localStorage)
                saveAppState(state);

                // Keep backward compatibility with old tracker_week key
                localStorage.setItem('tracker_week', currentWeek);

                // Update URL only via replaceState to avoid polluting history
                // pushState is called explicitly in navigation functions
                const newUrl = updateUrl(state);
                window.history.replaceState(state, '', newUrl);
            }, [viewMode, activeTab, currentWeek, activeDay, isInitialized]);

            // Initialize Lucide icons when view or tab changes
            useLucideIcons([viewMode, activeTab, isInitialized]);

            // Handle browser back/forward button
            useEffect(() => {
                const handlePopState = (event) => {
                    if (event.state) {
                        // State exists in history, use it
                        if (event.state.viewMode !== undefined) setViewMode(event.state.viewMode);
                        if (event.state.activeTab !== undefined) setActiveTab(event.state.activeTab);
                        if (event.state.currentWeek !== undefined) setCurrentWeek(event.state.currentWeek);
                        if (event.state.activeDay !== undefined) setActiveDay(event.state.activeDay);
                    } else {
                        // No state in history (e.g., initial page load), parse from URL
                        const urlParams = getUrlParams();

                        if (urlParams.view === 'workout' && urlParams.week !== null && urlParams.day !== null) {
                            // Navigating back to a workout view
                            // Week and day are required for workout view, validated by condition above
                            setViewMode('workout');
                            setCurrentWeek(urlParams.week);
                            setActiveDay(urlParams.day);
                        } else {
                            // Navigating back to tab view (or default)
                            // Week is optional in tab view, only set if present
                            setViewMode('tab');
                            if (urlParams.tab && VALID_TABS.includes(urlParams.tab)) {
                                setActiveTab(urlParams.tab);
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

            const startWorkout = (day) => {
                setActiveDay(day);
                setViewMode('workout');

                // Push new entry to history
                const state = { viewMode: 'workout', activeTab, currentWeek, activeDay: day };
                const newUrl = updateUrl(state);
                window.history.pushState(state, '', newUrl);
            };

            const goBack = () => {
                // Check if there's history to go back to
                // If the current history length is greater than the initial length, we have navigated within the app
                const hasHistory = window.history.length > initialHistoryLength.current;

                if (hasHistory) {
                    // Go back in browser history
                    window.history.back();
                } else {
                    // No history available (e.g., direct URL access), fallback to main view
                    setViewMode('tab');
                    setActiveTab('train');

                    // Update URL to reflect the main view
                    const state = { viewMode: 'tab', activeTab: 'train', currentWeek, activeDay };
                    const newUrl = updateUrl(state);
                    window.history.replaceState(state, '', newUrl);
                }
            };

            const handleTabChange = (newTab) => {
                setActiveTab(newTab);

                // Push new entry to history for tab changes so users can navigate back
                // This is intentional - each tab navigation should be a distinct history entry
                const state = { viewMode: 'tab', activeTab: newTab, currentWeek, activeDay };
                const newUrl = updateUrl(state);
                window.history.pushState(state, '', newUrl);
            };

            return (
                <>
                    {showOnboarding && (
                        <Onboarding onComplete={() => setShowOnboarding(false)} />
                    )}
                    <div className="min-h-screen bg-sys-black text-white font-sans flex flex-col max-w-md mx-auto relative">
                        <SkipLink targetId="main-content" />
                        <TopAppBar
                            title={viewMode === 'workout' ? `Day ${activeDay}` : (activeTab === 'train' ? 'Dashboard' : activeTab === 'library' ? 'Exercise Library' : activeTab === 'history' ? 'History' : 'Settings')}
                            subtitle={viewMode === 'workout' ? `Week ${currentWeek}` : (activeTab === 'train' ? 'OnePlus Strength' : '')}
                            showBack={viewMode === 'workout'}
                            onBack={goBack}
                        />

                        {!isInitialized ? (
                            <div className="flex items-center justify-center h-screen">
                                <div className="text-center">
                                    <div className="text-lg text-sys-onSurfaceVar">Loading...</div>
                                </div>
                            </div>
                        ) : viewMode === 'workout' ? (
                            <main id="main-content" className="animate-fade-in">
                                <WorkoutPlayer
                                    week={currentWeek}
                                    day={activeDay}
                                    onComplete={goBack}
                                    exerciseLibrary={EXERCISE_LIBRARY}
                                />
                            </main>
                        ) : (
                            <>
                                <TabContent activeTab={activeTab} id="main-content">
                                    {activeTab === 'train' && <Dashboard currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} onStartWorkout={startWorkout} />}
                                    {activeTab === 'library' && <ExerciseLibraryView
                                        exerciseLibrary={EXERCISE_LIBRARY}
                                        getAllExercisesWithHistory={getAllExercisesWithHistory}
                                        calculateExerciseStats={calculateExerciseStats}
                                        getExerciseHistory={getExerciseHistory}
                                    />}
                                    {activeTab === 'history' && <HistoryView
                                        calculateExerciseStats={calculateExerciseStats}
                                        getExerciseHistory={getExerciseHistory}
                                        getAllExercisesWithHistory={getAllExercisesWithHistory}
                                    />}
                                    {activeTab === 'profile' && <SettingsView />}
                                </TabContent>
                                <NavigationBar activeTab={activeTab} onTabChange={handleTabChange} />
                            </>
                        )}
                    </div>
                </>
            );
        };

        // LoadingScreen and ErrorScreen are now imported from ./components/screens

// Setter functions to update the global data
export function setRAW_SCHEDULE(data) {
    RAW_SCHEDULE.length = 0;
    RAW_SCHEDULE.push(...data);
    // Also update the schedule module
    setRawSchedule(data);
}

export function setEXERCISE_LIBRARY(data) {
    EXERCISE_LIBRARY.length = 0;
    EXERCISE_LIBRARY.push(...data);
}

// Utility function for fetching with timeout
export function fetchWithTimeout(url, timeout = FETCH_TIMEOUT_MS) {
    return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

// Export the App and utility functions for use in main.jsx
export { App, LoadingScreen, ErrorScreen, buildCompleteSchedule, FETCH_TIMEOUT_MS };
