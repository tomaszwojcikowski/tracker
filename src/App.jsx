import React, { useState, useEffect, useMemo, useRef } from 'react';
import './main.css';
import * as FirebaseService from './firebase-service';
import { NavigationBar, TabContent } from './components/navigation';
import { ConfirmDialog } from './components/modals';
import {
    ExerciseCardSkeleton,
    HistoryEntrySkeleton,
    SkeletonList
} from './components/skeletons';
import {
    EmptyWorkoutHistory,
    EmptyExerciseHistory,
    EmptySearchResults,
} from './components/feedback';
import { TopAppBar } from './components/TopAppBar';
import { LoadingScreen, ErrorScreen } from './components/screens';
import { Dashboard, HistoryView, SettingsView, ExerciseLibraryView, WorkoutPlayer } from './components/views';
import { useTheme } from './hooks/useTheme';
import { PROGRAM_DATA } from './data/programData';

// Import from TypeScript utilities
import { safeGetJSON, safeSetJSON, safeRemove } from './utils/storage';
import {
    buildCompleteSchedule as buildSchedule,
    getCompleteSchedule,
    setRawSchedule,
    getWorkout,
    getBlockForWeek,
} from './utils/schedule';
import { getAllLocalData, mergeCloudData } from './utils/firebaseSync';
import {
    getUrlParams,
    saveAppState,
    loadAppState,
    buildUrl,
    DEFAULT_WEEK,
    DEFAULT_DAY,
    VALID_DAYS,
    VALID_TABS,
    VALID_VIEW_MODES,
} from './utils/urlState';
import { FETCH_TIMEOUT_MS } from './constants';

// Import hooks from TypeScript module

// Import exercise history utilities from TypeScript module
import {
    getExerciseHistory,
    calculateExerciseStats,
    getAllExercisesWithHistory,
} from './utils/exerciseHistory';
import { formatRelativeTime } from './utils/time';

        // ============================================================================
        // SECTION 1: GLOBAL STATE & DATA STRUCTURES
        // ============================================================================

        // --- RAW SCHEDULE (loaded from JSON) ---
        let RAW_SCHEDULE = [];
        let COMPLETE_SCHEDULE = [];
        let EXERCISE_LIBRARY = [];

        // Note: localStorage utilities (safeGetJSON, safeSetJSON, safeRemove) are imported from ./utils/storage
        // Note: Schedule utilities (buildCompleteSchedule, getWorkout, etc.) are imported from ./utils/schedule
        // Note: Firebase sync utilities (getAllLocalData, mergeCloudData) are imported from ./utils/firebaseSync
        // Note: URL/state utilities (getUrlParams, saveAppState, loadAppState, etc.) are imported from ./utils/urlState

        // Wrapper function for buildCompleteSchedule that also updates local COMPLETE_SCHEDULE
        const buildCompleteSchedule = () => {
            buildSchedule();
            COMPLETE_SCHEDULE = getCompleteSchedule();
        };

        // Note: Custom hooks (useHaptic, useSwipe, useSwipeNavigation, useDebounce, useLucideIcons)
        // are now imported from ./hooks

        // ============================================================================
        // SECTION 5: APPLICATION CONSTANTS & PROGRAM DATA
        // ============================================================================

        // --- APPLICATION CONSTANTS ---
        // Note: Many constants are now imported from ./constants.ts
        // (FETCH_TIMEOUT_MS, DEBOUNCE_DELAY_MS, MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY)
        const MAX_SETS = 20; // Maximum number of sets per exercise
        const MAX_WEIGHT_KG = 999; // Maximum weight in kilograms
        const WEIGHT_INCREMENT_KG = 2.5; // Standard weight increment/decrement
        const WEIGHT_STEP = 0.5; // Minimum weight step for input

        // PROGRAM_DATA is now imported from ./data/programData

        // ============================================================================
        // SECTION 6: UI COMPONENTS
        // ============================================================================

        // TopAppBar and ActionBar are now imported from ./components

        // NavigationBar and TabContent are now imported from ./components/navigation

        // Note: Firebase sync utilities (getAllLocalData, mergeCloudData) are imported from ./utils/firebaseSync

        // Keys for Firebase sync settings (re-exported for backward compatibility)
        const FIREBASE_SYNC_ENABLED_KEY = 'firebase_sync_enabled';

        // Note: Exercise history utilities (updateExerciseHistory, getExerciseHistory, calculateExerciseStats, getAllExercisesWithHistory)
        // are now imported from ./utils/exerciseHistory
        // Note: formatRelativeTime is now imported from ./utils/time
        // Note: Time constants (MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY) are now imported from ./constants

        // Storage key constant (for backward compatibility)
        const EXERCISE_HISTORY_KEY = 'exercise_history';

        // Helper function to safely parse weight
        const parseWeight = (weight) => {
            return weight ? parseFloat(weight) : null;
        };

        // ============================================================================
        // SECTION 9: MAIN APPLICATION COMPONENTS
        // ============================================================================

        // --- AUDIO UTILITIES ---
        /**
         * Play a tick sound for countdown
         */
        const playTickSound = () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800; // High frequency for tick
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (error) {
                console.warn('Failed to play tick sound:', error);
            }
        };

        /**
         * Play a beep sound for new interval
         */
        const playBeepSound = () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 1200; // Higher frequency for beep
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            } catch (error) {
                console.warn('Failed to play beep sound:', error);
            }
        };

        // --- WORKOUT PLAYER ---
        // Extracted to src/components/views/WorkoutPlayer.tsx

        // Dashboard is now imported from ./components/views
        // HistoryView, ExerciseStatsView, and SimpleWeightGraph are now imported from ./components/views/HistoryView

        // Simple markdown to HTML converter with sanitization
        const markdownToHtml = (text) => {
            if (!text) return '';

            // Sanitize input - escape HTML entities
            const escapeHtml = (unsafe) => {
                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            };

            let html = escapeHtml(text);

            // Code blocks first (to protect them from other processing)
            html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-sys-surfaceHigh rounded-lg p-3 my-3 overflow-x-auto"><code class="text-sm font-mono text-sys-accent">$1</code></pre>');

            // Inline code (protect from other processing)
            html = html.replace(/`([^`]+)`/g, '<code class="bg-sys-surfaceHigh px-1.5 py-0.5 rounded text-sm font-mono text-sys-accent">$1</code>');

            // Headers (# ## ###)
            html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-white mt-4 mb-2">$1</h3>');
            html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-white mt-5 mb-3">$1</h2>');
            html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-white mt-6 mb-4">$1</h1>');

            // Bold text first (**text** or __text__) - process before italic
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
            html = html.replace(/__(.+?)__/g, '<strong class="font-bold text-white">$1</strong>');

            // Italic text (*text* or _text_) - matches single * or _ that aren't part of bold
            // This works because bold is already replaced, so remaining single * are italic
            html = html.replace(/\*([^*]+?)\*/g, '<em class="italic">$1</em>');
            html = html.replace(/_([^_]+?)_/g, '<em class="italic">$1</em>');

            // Process lists - find consecutive list items and wrap in ul
            const lines = html.split('\n');
            const processed = [];
            let inList = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const isListItem = /^\s*[-*]\s+(.+)$/.test(line);

                if (isListItem) {
                    if (!inList) {
                        processed.push('<ul class="my-3 space-y-1">');
                        inList = true;
                    }
                    processed.push(line.replace(/^\s*[-*]\s+(.+)$/, '<li class="ml-4 mb-1">• $1</li>'));
                } else {
                    if (inList) {
                        processed.push('</ul>');
                        inList = false;
                    }
                    processed.push(line);
                }
            }
            if (inList) processed.push('</ul>');
            html = processed.join('\n');

            // Convert double newlines to paragraph breaks (but not for existing HTML tags)
            const paragraphs = html.split('\n\n');
            html = paragraphs.map(para => {
                const trimmed = para.trim();
                // Only wrap in <p> if it's not already an HTML block element
                if (trimmed && !/^<(h[123]|ul|pre|div)/.test(trimmed)) {
                    return `<p class="mb-3">${trimmed}</p>`;
                }
                return trimmed;
            }).join('\n');

            // Single line breaks become <br /> (but not within block elements)
            html = html.replace(/\n/g, '<br />');

            return html;
        };

        // SettingsView is now imported from ./components/views

        // ExerciseLibraryView and ExerciseDetailView are now imported from ./components/views

        // ============================================================================
        // SECTION 10: URL & STATE MANAGEMENT UTILITIES
        // ============================================================================

        // Note: URL/state utilities (getUrlParams, saveAppState, loadAppState, buildUrl) are imported from ./utils/urlState
        // Note: Constants (DEFAULT_WEEK, DEFAULT_DAY, VALID_DAYS, VALID_TABS, VALID_VIEW_MODES) are imported from ./utils/urlState

        // Local updateUrl wrapper that returns the URL string (for backward compatibility)
        const updateUrl = (state) => {
            return buildUrl(state);
        };

        const App = () => {
            const [activeTab, setActiveTab] = useState('train');
            const [viewMode, setViewMode] = useState('tab');
            const [currentWeek, setCurrentWeek] = useState(1);
            const [activeDay, setActiveDay] = useState(1);
            const [isInitialized, setIsInitialized] = useState(false);

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
                <div className="min-h-screen bg-sys-black text-white font-sans flex flex-col max-w-md mx-auto relative">
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
                        <div className="animate-fade-in">
                            <WorkoutPlayer
                                week={currentWeek}
                                day={activeDay}
                                onComplete={goBack}
                                exerciseLibrary={EXERCISE_LIBRARY}
                            />
                        </div>
                    ) : (
                        <>
                            <TabContent activeTab={activeTab}>
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
