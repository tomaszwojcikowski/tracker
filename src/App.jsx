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
import { PullToRefresh } from './components/PullToRefresh';
import { FloatingTimer } from './components/FloatingTimer';
import { SwipeIndicator } from './components/SwipeIndicator';
import { ThemeSelector } from './components/ThemeSelector';
import { useTheme } from './hooks/useTheme';

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
import {
    FETCH_TIMEOUT_MS,
    DEBOUNCE_DELAY_MS,
    MS_PER_MINUTE,
    MS_PER_HOUR,
    MS_PER_DAY,
} from './constants';

// Import hooks from TypeScript module
import {
    useHaptic,
    useSwipe,
    useSwipeNavigation,
    useDebounce,
    useLucideIcons,
} from './hooks';

// Import exercise history utilities from TypeScript module
import {
    updateExerciseHistory,
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

        const PROGRAM_DATA = {
            blocks: [
                { id: 1, name: "Foundation", weeks: [1, 2, 3, 4] },
                { id: 2, name: "Intensification", weeks: [5, 6, 7, 8] },
                { id: 3, name: "Neutral Grip", weeks: [9, 10, 11, 12] },
                { id: 4, name: "Accumulation", weeks: [13, 14, 15, 16] },
                { id: 5, name: "Peak & Taper", weeks: [17, 18, 19, 20] },
                { id: 6, name: "Reload", weeks: [21] }
            ],
            getWorkout: (week, day) => {
                const dayExercises = COMPLETE_SCHEDULE.filter(i => i.w === week && i.d === day);
                if (dayExercises.length === 0) return { title: "Rest Day", sections: [] };

                const sections = { prep: [], skill: [], main: [], access: [], cool: [] };

                dayExercises.forEach(item => {
                    const n = item.n.toLowerCase();
                    let type = 'main';
                    if (n.includes('warm-up')) type = 'prep';
                    else if (n.includes('cool-down')) type = 'cool';
                    else if (item.ex.toLowerCase().includes('skill') || n.includes('practice')) type = 'skill';
                    else if (n.includes('accessory') || n.includes('core')) type = 'access';

                    sections[type].push({
                        name: item.ex,
                        prescription: `${item.s} x ${item.r}`,
                        notes: item.n,
                        sets: item.s,
                        rest: 90,
                        isBodyweight: !item.n.includes('kg')
                    });
                });

                const finalSections = [];
                const map = { prep: "Warm Up", skill: "Skill", main: "Main Work", access: "Accessory", cool: "Cool Down" };
                Object.keys(sections).forEach(k => {
                    if (sections[k].length > 0) finalSections.push({ type: k, name: map[k], exercises: sections[k] });
                });

                return { title: `Week ${week} Day ${day}`, sections: finalSections };
            }
        };

        // ============================================================================
        // SECTION 6: UI COMPONENTS
        // ============================================================================

        // 1. OLED TOP BAR
        const TopAppBar = ({ title, subtitle, onBack, showBack }) => (
            <div className="bg-sys-black sticky top-0 z-40 safe-pt border-b border-white/10">
                <div className="h-16 flex items-center px-5 gap-4">
                    {showBack ? (
                        <button
                            onClick={onBack}
                            className="h-10 w-10 -ml-1 text-sys-onSurface rounded-xl hover:bg-sys-surfaceHigh transition-colors flex items-center justify-center active:scale-90"
                            aria-label="Go back"
                        >
                            <i data-lucide="arrow-left" width="24"></i>
                        </button>
                    ) : null}

                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-sys-onSurface tracking-tight truncate">{title}</h1>
                        {subtitle && <p className="text-xs text-sys-onSurfaceVar font-semibold mt-0.5">{subtitle}</p>}
                    </div>
                </div>
            </div>
        );

        // 2. ACTION BAR (Reachability Optimized)
        const ActionBar = ({ onFinish, timerState, setTimerActive, setTimerSeconds, emomState, setEmomActive, setEmomSeconds, setEmomInterval }) => {
            const haptic = useHaptic();
            const [showConfirm, setShowConfirm] = useState(false);

            // Keyboard shortcuts for dialog
            useEffect(() => {
                if (!showConfirm) return;

                const handleKeyDown = (e) => {
                    if (e.key === 'Escape') {
                        haptic.tick();
                        setShowConfirm(false);
                    } else if (e.key === 'Enter') {
                        haptic.success();
                        setShowConfirm(false);
                        onFinish();
                    }
                };

                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
            }, [showConfirm, onFinish, haptic]);

            return (
                <>
                    <div className="fixed bottom-0 left-0 right-0 bg-sys-black border-t border-white/10 z-50 safe-pb">
                        {/* EMOM Timer Display */}
                        {emomState?.active && (
                            <div className="px-4 pt-3 pb-2">
                                <div className="glass-panel px-5 py-4 rounded-2xl shadow-lg animate-slide-up">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-xs font-semibold text-sys-accent uppercase tracking-wider">EMOM Timer</span>
                                        <button
                                            onClick={() => { haptic.bump(); setEmomActive(false); setEmomSeconds(0); }}
                                            className="ml-auto h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
                                            aria-label="Stop EMOM timer"
                                        >
                                            <i data-lucide="x" width="16"></i>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-3xl font-mono font-bold min-w-[90px] transition-colors ${emomState.seconds <= 5 ? 'text-sys-error animate-pulse' : 'text-white'}`}>
                                            {Math.floor(emomState.seconds/60)}:{emomState.seconds%60 < 10 ? '0' : ''}{emomState.seconds%60}
                                        </span>
                                        <div className="h-6 w-[1px] bg-white/20"></div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { haptic.bump(); setEmomInterval(i => Math.max(10, i - 5)); }}
                                                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
                                                aria-label="Decrease interval by 5 seconds"
                                            >
                                                <i data-lucide="minus" width="18"></i>
                                            </button>
                                            <span className="text-sm text-sys-onSurfaceVar font-semibold min-w-[40px] text-center">
                                                {emomState.interval}s
                                            </span>
                                            <button
                                                onClick={() => { haptic.bump(); setEmomInterval(i => Math.min(180, i + 5)); }}
                                                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
                                                aria-label="Increase interval by 5 seconds"
                                            >
                                                <i data-lucide="plus" width="18"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rest Timer Display */}
                        {timerState.time > 0 && (
                            <div className="px-4 pt-3 pb-2">
                                <div className="glass-panel px-5 py-4 rounded-2xl flex items-center gap-4 shadow-lg animate-slide-up">
                                    <span className="text-2xl font-mono font-bold text-white min-w-[80px]">
                                        {Math.floor(timerState.time/60)}:{timerState.time%60 < 10 ? '0' : ''}{timerState.time%60}
                                    </span>
                                    <div className="h-6 w-[1px] bg-white/20"></div>
                                    <button
                                        onClick={() => { haptic.bump(); setTimerActive(false); setTimerSeconds(0); }}
                                        className="h-10 w-10 min-w-[40px] rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
                                        aria-label="Cancel timer"
                                    >
                                        <i data-lucide="x" width="20"></i>
                                    </button>
                                    <button
                                        onClick={() => { haptic.bump(); setTimerSeconds(s => s + 30); }}
                                        className="text-sys-accent font-bold text-base px-3 py-2 min-h-[44px]"
                                    >
                                        +30s
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="px-4 py-3">
                            <button
                                onClick={() => { haptic.bump(); setShowConfirm(true); }}
                                className="w-full h-16 min-h-[56px] px-8 rounded-2xl text-white font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform btn-gradient-success"
                            >
                                <i data-lucide="check-circle-2" width="22"></i>
                                <span className="text-base">FINISH</span>
                            </button>
                        </div>
                    </div>

                    {/* Confirmation Dialog */}
                    {showConfirm && (
                        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-slide-up safe-pb">
                            <div className="bg-sys-surface rounded-3xl p-6 w-full max-w-md border border-white/10">
                                <h3 className="text-xl font-bold text-white mb-2">Finish Workout?</h3>
                                <p className="text-sys-onSurfaceVar mb-6">Your progress will be saved and logged to history.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { haptic.tick(); setShowConfirm(false); }}
                                        className="flex-1 h-14 rounded-xl bg-sys-surfaceHigh text-white font-semibold active:scale-95 transition-transform hover-lift"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => { haptic.success(); setShowConfirm(false); onFinish(); }}
                                        className="flex-1 h-14 rounded-xl text-white font-semibold active:scale-95 transition-transform btn-gradient-success"
                                    >
                                        Finish
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            );
        };

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
        const WorkoutPlayer = ({ week, day, onComplete }) => {
            const workout = useMemo(() => PROGRAM_DATA.getWorkout(week, day), [week, day]);
            const [logs, setLogs] = useState({});
            const [timerSeconds, setTimerSeconds] = useState(0);
            const [timerActive, setTimerActive] = useState(false);
            const [emomSeconds, setEmomSeconds] = useState(0);
            const [emomActive, setEmomActive] = useState(false);
            const [emomInterval, setEmomInterval] = useState(() => safeGetJSON('emom_interval', 60));
            const [collapsedExercises, setCollapsedExercises] = useState({});
            const [showTimerToast, setShowTimerToast] = useState(false);
            const [addedExercises, setAddedExercises] = useState([]);
            const [showExerciseSelector, setShowExerciseSelector] = useState(false);
            const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
            const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('all');
            const [showExerciseHistory, setShowExerciseHistory] = useState(null); // null or exercise name
            const [workoutNotes, setWorkoutNotes] = useState(''); // Free-text notes for the entire workout
            const haptic = useHaptic();

            // Add swipe support for back navigation
            const swipeHandlers = useSwipe({
                onSwipeRight: () => {
                    haptic.tick();
                    onComplete();
                }
            });

            // Debounce exercise selector search term
            const debouncedExerciseSearch = useDebounce(exerciseSearchTerm, DEBOUNCE_DELAY_MS);

            // Generic Lucide icon refresh hook - ensures icons render after React updates
            // Runs when UI state changes that affect icon visibility
            useLucideIcons([collapsedExercises, showTimerToast, showExerciseSelector, showExerciseHistory, week, day, addedExercises, logs, timerSeconds, timerActive, emomSeconds, emomActive, emomInterval]);

            useEffect(() => {
                const parsedLogs = safeGetJSON(`session_w${week}d${day}`, {});

                // Validate and set logs
                if (parsedLogs && typeof parsedLogs === 'object') {
                    setLogs(parsedLogs);
                    // Load added exercises from storage
                    if (Array.isArray(parsedLogs.addedExercises)) {
                        setAddedExercises(parsedLogs.addedExercises);
                    }
                    // Load workout notes from storage
                    if (typeof parsedLogs.workoutNotes === 'string') {
                        setWorkoutNotes(parsedLogs.workoutNotes);
                    }
                } else {
                    setLogs({});
                    setAddedExercises([]);
                    setWorkoutNotes('');
                }
            }, [week, day]);

            useEffect(() => {
                let interval = null;
                if (timerActive && timerSeconds > 0) interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
                else if (timerSeconds === 0 && timerActive) {
                    setTimerActive(false);
                    haptic.timer();
                    setShowTimerToast(true);
                    // Toast will remain visible until user closes it
                }
                return () => clearInterval(interval);
            }, [timerActive, timerSeconds, haptic]);

            // EMOM timer effect - counts down and auto-resets
            useEffect(() => {
                let interval = null;
                if (emomActive && emomSeconds > 0) {
                    interval = setInterval(() => {
                        setEmomSeconds(s => {
                            const newValue = s - 1;
                            // Play tick sound for countdown (5, 4, 3, 2, 1)
                            if (newValue <= 5 && newValue >= 1) {
                                playTickSound();
                            }
                            return newValue;
                        });
                    }, 1000);
                } else if (emomSeconds === 0 && emomActive) {
                    // Auto-reset to interval when reaching 0
                    setEmomSeconds(emomInterval);
                    haptic.timer();
                    playBeepSound(); // Play beep for new interval start
                }
                return () => clearInterval(interval);
            }, [emomActive, emomSeconds, emomInterval, haptic]);

            // Save EMOM interval to localStorage when it changes
            useEffect(() => {
                safeSetJSON('emom_interval', emomInterval);
            }, [emomInterval]);


            // Keyboard shortcuts for toasts
            useEffect(() => {
                const handleKeyDown = (e) => {
                    // Escape key closes any visible toast
                    if (e.key === 'Escape') {
                        if (showTimerToast) {
                            setShowTimerToast(false);
                        }
                    }
                };

                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
            }, [showTimerToast]);

            const saveLog = (id, field, value) => {
                const updatedLogs = {
                    ...logs,
                    [id]: { ...logs[id], [field]: value },
                    lastModified: new Date().toISOString()
                };
                setLogs(updatedLogs);

                const success = safeSetJSON(`session_w${week}d${day}`, updatedLogs);
                if (!success) {
                    alert('Failed to save progress. Your storage might be full.');
                }
            };

            const toggleSet = (exId, setIndex, defaultSets, restTime) => {
                try {
                    haptic.tick();

                    // Validate inputs
                    if (!exId || setIndex < 0 || !Number.isInteger(setIndex)) {
                        console.error('Invalid set toggle parameters:', { exId, setIndex, defaultSets });
                        return;
                    }

                    const currentSets = logs[exId]?.sets || new Array(defaultSets).fill(false);
                    const newSets = [...currentSets];
                    while(newSets.length <= setIndex) newSets.push(false);
                    const wasCompleted = newSets[setIndex];
                    newSets[setIndex] = !newSets[setIndex];
                    saveLog(exId, 'sets', newSets);

                    // Clear RPE data when unmarking a set to prevent stale data
                    if (wasCompleted && !newSets[setIndex]) {
                        const currentRPEs = logs[exId]?.rpe || {};
                        if (currentRPEs[setIndex]) {
                            const updatedRPEs = { ...currentRPEs };
                            delete updatedRPEs[setIndex];
                            saveLog(exId, 'rpe', updatedRPEs);
                        }
                    }

                    // Auto-start timer when completing a set (not when uncompleting)
                    if (!wasCompleted && newSets[setIndex] && typeof restTime === 'number' && !isNaN(restTime) && restTime > 0) {
                        setTimerSeconds(restTime);
                        setTimerActive(true);
                    }
                } catch (error) {
                    console.error('Failed to toggle set:', error);
                }
            };

            // Save RPE (Rate of Perceived Exertion) for a specific set
            const saveRPE = (exId, setIndex, rpe) => {
                try {
                    const currentRPEs = logs[exId]?.rpe || {};
                    const updatedRPEs = { ...currentRPEs, [setIndex]: rpe };
                    saveLog(exId, 'rpe', updatedRPEs);
                } catch (error) {
                    console.error('Failed to save RPE:', error);
                }
            };

            const addSet = (exId, defaultSets) => {
                haptic.bump();
                const currentSets = logs[exId]?.sets || new Array(defaultSets).fill(false);
                saveLog(exId, 'sets', [...currentSets, false]);
            };

            const completeAllSets = (exId, defaultSets) => {
                haptic.success();
                const allCompleted = new Array(defaultSets).fill(true);
                saveLog(exId, 'sets', allCompleted);
            };

            const toggleExerciseCollapse = (exId) => {
                setCollapsedExercises(prev => ({ ...prev, [exId]: !prev[exId] }));
            };

            const scrollToNextIncompleteExercise = () => {
                haptic.bump();
                // Find first exercise with incomplete sets
                const allExercises = [];
                workout.sections.forEach(section => {
                    section.exercises.forEach(ex => {
                        const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                        const sets = logs[exId]?.sets || [];
                        const allComplete = sets.length > 0 && sets.every(s => s);
                        if (!allComplete) {
                            allExercises.push(exId);
                        }
                    });
                });

                if (allExercises.length > 0) {
                    const nextExId = allExercises[0];
                    const element = document.getElementById(nextExId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            };

            const addExerciseToWorkout = (exercise, sets = 3, weight = '') => {
                try {
                    // Validate exercise data
                    if (!exercise || !exercise.id || !exercise.name) {
                        console.error('Invalid exercise data:', exercise);
                        alert('Failed to add exercise: Invalid exercise data');
                        return;
                    }

                    // Validate sets
                    const validSets = Number.isInteger(sets) && sets > 0 && sets <= MAX_SETS ? sets : 3;

                    // Check for duplicates
                    const isDuplicate = addedExercises.some(ex => ex.id === exercise.id);
                    if (isDuplicate) {
                        alert('This exercise has already been added to the workout');
                        return;
                    }

                    haptic.success();
                    const newExercise = {
                        id: exercise.id,
                        name: exercise.name,
                        sets: validSets,
                        isBodyweight: exercise.isBodyweight || false,
                        equipment: exercise.equipment || [],
                        primaryMuscles: exercise.primaryMuscles || [],
                        weight: weight
                    };
                    const updatedAddedExercises = [...addedExercises, newExercise];
                    setAddedExercises(updatedAddedExercises);

                    // Save to storage with timestamp
                    const updatedLogs = {
                        ...logs,
                        addedExercises: updatedAddedExercises,
                        lastModified: new Date().toISOString()
                    };
                    setLogs(updatedLogs);
                    safeSetJSON(`session_w${week}d${day}`, updatedLogs);

                    setShowExerciseSelector(false);
                    setExerciseSearchTerm('');
                } catch (error) {
                    console.error('Failed to add exercise:', error);
                    alert('Failed to add exercise. Please try again.');
                }
            };

            const removeAddedExercise = (exerciseId) => {
                haptic.tick();
                const updatedAddedExercises = addedExercises.filter(ex => ex.id !== exerciseId);
                setAddedExercises(updatedAddedExercises);

                // Save to storage with timestamp
                const updatedLogs = {
                    ...logs,
                    addedExercises: updatedAddedExercises,
                    lastModified: new Date().toISOString()
                };
                setLogs(updatedLogs);
                safeSetJSON(`session_w${week}d${day}`, updatedLogs);
            };

            const handleFinish = async () => {
                try {
                    const timestamp = new Date().toISOString();
                    const updatedLogs = {
                        ...logs,
                        completed: true,
                        completedAt: timestamp,
                        lastModified: timestamp,
                        week,
                        day,
                        workoutNotes
                    };
                    setLogs(updatedLogs);
                    safeSetJSON(`session_w${week}d${day}`, updatedLogs);

                    const completionDate = new Date().toISOString();

                // Build exercise summary with completed/incomplete sets
                const exerciseSummary = [];
                workout.sections.forEach(section => {
                    section.exercises.forEach(ex => {
                        const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                        const exLog = updatedLogs[exId] || {};
                        const sets = exLog.sets || [];
                        const completedSets = sets.filter(s => s).length;
                        const totalSets = sets.length || ex.sets || 0;

                        exerciseSummary.push({
                            name: ex.name,
                            prescription: ex.prescription,
                            completedSets,
                            totalSets,
                            weight: exLog.weight || null,
                            rpe: exLog.rpe || null
                        });

                        // Update per-exercise history
                        if (completedSets > 0) {
                            updateExerciseHistory(ex.name, {
                                date: completionDate,
                                week,
                                day,
                                sets: completedSets,
                                totalSets,
                                weight: parseWeight(exLog.weight),
                                prescription: ex.prescription,
                                isBodyweight: ex.isBodyweight
                            });
                        }
                    });
                });

                // Add added exercises to the summary
                addedExercises.forEach(ex => {
                    const exId = `added_${ex.id}`;
                    const exLog = updatedLogs[exId] || {};
                    const sets = exLog.sets || [];
                    const completedSets = sets.filter(s => s).length;
                    const totalSets = sets.length || ex.sets || 0;

                    exerciseSummary.push({
                        name: `${ex.name} (Added)`,
                        prescription: `${ex.sets} sets`,
                        completedSets,
                        totalSets,
                        weight: ex.weight || exLog.weight || null
                    });

                    // Update per-exercise history for added exercises
                    if (completedSets > 0) {
                        updateExerciseHistory(ex.name, {
                            date: completionDate,
                            week,
                            day,
                            sets: completedSets,
                            totalSets,
                            weight: parseWeight(ex.weight || exLog.weight),
                            prescription: `${ex.sets} sets`,
                            isBodyweight: ex.isBodyweight
                        });
                    }
                });

                // Create history entry with exercise summary
                const historyEntry = {
                    week,
                    day,
                    date: completionDate,
                    title: workout.title,
                    exercises: exerciseSummary,
                    workoutNotes: workoutNotes || null
                };

                const history = safeGetJSON('global_history', []);
                const cleanHistory = history.filter(h => !(h.week === week && h.day === day));
                cleanHistory.push(historyEntry);
                safeSetJSON('global_history', cleanHistory);

                onComplete();
                } catch (error) {
                    console.error('Failed to complete workout:', error);
                    alert('Failed to save workout completion. Please try again.');
                }
            };

            // Check if there are any incomplete exercises
            const hasIncompleteExercises = workout.sections.some(section =>
                section.exercises.some(ex => {
                    const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                    const sets = logs[exId]?.sets || [];
                    return sets.length === 0 || !sets.every(s => s);
                })
            );

            return (
                <>
                    {/* Floating Rest Timer - visible while scrolling */}
                    <FloatingTimer
                        seconds={timerSeconds}
                        active={timerActive}
                        onStop={() => {
                            haptic.bump();
                            setTimerActive(false);
                            setTimerSeconds(0);
                        }}
                        onAddTime={() => {
                            haptic.bump();
                            setTimerSeconds(s => s + 30);
                        }}
                    />

                    <div {...swipeHandlers} className="px-5 pb-32 pt-6">
                        {/* Quick navigation button */}
                    {hasIncompleteExercises && (
                        <div className="mb-6">
                            <button
                                onClick={scrollToNextIncompleteExercise}
                                className="w-full h-12 px-6 rounded-xl border border-sys-accent/30 text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform btn-gradient-primary btn-dimmed"
                            >
                                <i data-lucide="arrow-down-circle" width="20"></i>
                                <span>Jump to Next Exercise</span>
                            </button>
                        </div>
                    )}

                    {/* Workout Notes Section */}
                    <div className="mb-6">
                        <div className="bg-sys-surface rounded-3xl border border-white/5 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <i data-lucide="file-text" width="18" className="text-sys-accent"></i>
                                <label className="text-sm font-bold text-white uppercase tracking-wider">Workout Notes</label>
                            </div>
                            <textarea
                                value={workoutNotes}
                                onChange={(e) => {
                                    setWorkoutNotes(e.target.value);
                                    // Auto-save notes to localStorage with timestamp
                                    const updatedLogs = {
                                        ...logs,
                                        workoutNotes: e.target.value,
                                        lastModified: new Date().toISOString()
                                    };
                                    setLogs(updatedLogs);
                                    safeSetJSON(`session_w${week}d${day}`, updatedLogs);
                                }}
                                placeholder="Add notes about today's workout (e.g., how you felt, form cues, adjustments)..."
                                className="w-full bg-sys-surfaceHigh rounded-xl px-4 py-3 text-white placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-accent transition-all resize-none"
                                rows="3"
                            ></textarea>
                        </div>
                    </div>

                    {workout.sections.map((section, sIdx) => {
                        // Helper function to check if exercise is EMOM
                        const isEMOM = (ex) => ex && ((ex.notes && ex.notes.toLowerCase().includes('emom')) || (ex.name && ex.name.toLowerCase().includes('emom')));

                        // Pre-process exercises to identify superset groups - O(n) complexity
                        const exercisesWithSuperset = [];
                        let currentSupersetStart = -1;

                        section.exercises.forEach((ex, idx) => {
                            const exIsEMOM = isEMOM(ex);
                            const prevIsEMOM = idx > 0 && isEMOM(section.exercises[idx - 1]);
                            const nextIsEMOM = idx < section.exercises.length - 1 && isEMOM(section.exercises[idx + 1]);

                            let supersetLabel = null;
                            let supersetPosition = null;

                            if (exIsEMOM) {
                                // Track start of superset group
                                if (!prevIsEMOM) {
                                    currentSupersetStart = idx;
                                }

                                // Only add labels if part of a group (has prev or next EMOM)
                                if (prevIsEMOM || nextIsEMOM) {
                                    const positionInSuperset = idx - currentSupersetStart;
                                    supersetLabel = `B${positionInSuperset + 1}`;

                                    // Determine position for visual rendering
                                    if (!prevIsEMOM && nextIsEMOM) {
                                        supersetPosition = 'first';
                                    } else if (prevIsEMOM && nextIsEMOM) {
                                        supersetPosition = 'middle';
                                    } else if (prevIsEMOM && !nextIsEMOM) {
                                        supersetPosition = 'last';
                                    }
                                }
                            }

                            exercisesWithSuperset.push({ ...ex, supersetLabel, supersetPosition });
                        });

                        // Calculate section progress
                        const sectionExercises = section.exercises.length;
                        let sectionCompletedExercises = 0;
                        section.exercises.forEach(ex => {
                            const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                            const sets = logs[exId]?.sets || [];
                            if (sets.length > 0 && sets.every(s => s)) {
                                sectionCompletedExercises++;
                            }
                        });
                        const sectionProgress = sectionExercises > 0 ? (sectionCompletedExercises / sectionExercises) * 100 : 0;

                        return (
                            <div key={sIdx} className="mb-10">
                                <div className="mb-5">
                                    <div className="flex items-center gap-3 mb-2 px-1">
                                        <div className="flex items-center gap-2">
                                            {/* Section icon based on type */}
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                                section.type === 'prep' ? 'bg-sys-accent/10' :
                                                section.type === 'main' ? 'bg-sys-success/10' :
                                                section.type === 'cool' ? 'bg-sys-accent/10' :
                                                'bg-sys-surfaceHigh'
                                            }`}>
                                                <i data-lucide={
                                                    section.type === 'prep' ? 'zap' :
                                                    section.type === 'main' ? 'dumbbell' :
                                                    section.type === 'cool' ? 'wind' :
                                                    'activity'
                                                } width="16" className={
                                                    section.type === 'prep' ? 'text-sys-accent' :
                                                    section.type === 'main' ? 'text-sys-success' :
                                                    section.type === 'cool' ? 'text-sys-accent' :
                                                    'text-white'
                                                }></i>
                                            </div>
                                            <span className="text-base font-bold text-white uppercase tracking-wide">{section.name}</span>
                                        </div>
                                        <div className="h-[2px] flex-1 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                                        {sectionProgress > 0 && (
                                            <span className="text-xs font-bold text-sys-onSurfaceVar">
                                                {sectionCompletedExercises}/{sectionExercises}
                                            </span>
                                        )}
                                    </div>
                                    {/* Section progress bar */}
                                    {sectionProgress > 0 && (
                                        <div className="h-1 bg-sys-surfaceHigh rounded-full overflow-hidden mx-1">
                                            <div
                                                className="h-full bg-gradient-to-r from-sys-accent to-sys-success transition-all duration-500"
                                                style={{ width: `${sectionProgress}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    {exercisesWithSuperset.map((ex, eIdx) => {
                                        const defaultSets = ex.sets || 3;
                                        const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                                        const currentSetArray = logs[exId]?.sets || new Array(defaultSets).fill(false);
                                        const completedSets = currentSetArray.filter(s => s).length;
                                        const totalSets = currentSetArray.length;
                                        const hasHistory = getExerciseHistory(ex.name).length > 0;

                                        return (
                                            <div key={eIdx} id={exId} className="relative scroll-mt-20">
                                                {/* Superset connecting line */}
                                                {ex.supersetPosition && ex.supersetPosition !== 'single' && (
                                                    <div className="absolute left-4 top-0 w-[3px] rounded-full z-0 gradient-vertical-primary"
                                                        style={{
                                                            height: ex.supersetPosition === 'first' ? 'calc(50% + 1.25rem)' :
                                                                   ex.supersetPosition === 'last' ? 'calc(50% + 1.25rem)' : 'calc(100% + 1.25rem)',
                                                            top: ex.supersetPosition === 'first' ? '50%' : '-1.25rem',
                                                        }}
                                                    ></div>
                                                )}

                                                <div className={`bg-sys-surface rounded-3xl p-6 border relative z-10 overflow-hidden ${
                                                    completedSets === totalSets ? 'border-sys-success/30 bg-sys-success/5' :
                                                    ex.supersetLabel ? 'border-sys-accent/20' : 'border-white/5'
                                                }`}>
                                                    {/* Progress bar at bottom */}
                                                    {completedSets > 0 && (
                                                        <div
                                                            className="progress-bar"
                                                            style={{ width: `${(completedSets / totalSets) * 100}%` }}
                                                        ></div>
                                                    )}

                                                    {/* Superset label badge */}
                                                    {ex.supersetLabel && (
                                                        <div className="absolute -left-2 top-6 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white z-20 btn-gradient-primary">
                                                            {ex.supersetLabel}
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className={`flex-1 pr-2 ${ex.supersetLabel ? 'pl-8' : ''}`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (hasHistory) {
                                                                            haptic.tick();
                                                                            setShowExerciseHistory(ex.name);
                                                                        }
                                                                    }}
                                                                    className={`text-left ${hasHistory ? 'cursor-pointer active:opacity-70 transition-opacity' : 'cursor-default'}`}
                                                                    aria-label={hasHistory ? `${ex.name} - tap to view history` : ex.name}
                                                                >
                                                                    <h3 className="text-lg font-semibold text-white leading-snug">{ex.name}</h3>
                                                                </button>
                                                                {completedSets > 0 && (
                                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${completedSets === totalSets ? 'bg-sys-success/20 text-sys-success' : 'bg-sys-accent/10 text-sys-accent'}`}>
                                                                        {completedSets}/{totalSets}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {collapsedExercises[exId] ? (
                                                                // Collapsed summary view
                                                                <div className="flex items-center gap-3 mt-2">
                                                                    <p className="text-sm text-sys-onSurfaceVar">{ex.prescription}</p>
                                                                    {logs[exId]?.weight && (
                                                                        <span className="text-xs font-semibold text-sys-accent">
                                                                            {logs[exId].weight}kg
                                                                        </span>
                                                                    )}
                                                                    {/* Mini progress bar */}
                                                                    <div className="flex-1 max-w-[80px] h-1 bg-sys-surfaceHigh rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-sys-success transition-all"
                                                                            style={{ width: `${(completedSets / totalSets) * 100}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // Expanded view
                                                                <>
                                                                    <p className="text-base text-sys-onSurfaceVar font-medium">{ex.prescription}</p>
                                                                    {ex.notes && <p className="text-sm text-sys-accent mt-2 leading-relaxed">{ex.notes}</p>}
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {hasHistory && !collapsedExercises[exId] && (
                                                                <button
                                                                    onClick={() => { haptic.tick(); setShowExerciseHistory(ex.name); }}
                                                                    className="h-10 w-10 min-w-[40px] rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar hover:text-sys-accent flex items-center justify-center active:scale-90 transition-all"
                                                                    aria-label="View exercise history"
                                                                >
                                                                    <i data-lucide="bar-chart-2" width="18"></i>
                                                                </button>
                                                            )}
                                                            {completedSets === totalSets && (
                                                                <button
                                                                    onClick={() => toggleExerciseCollapse(exId)}
                                                                    className="h-10 w-10 min-w-[40px] rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                                                                    aria-label={collapsedExercises[exId] ? "Expand exercise" : "Collapse exercise"}
                                                                >
                                                                    <i data-lucide={collapsedExercises[exId] ? "chevron-down" : "chevron-up"} width="20"></i>
                                                                </button>
                                                            )}
                                                            {ex.rest > 0 && !collapsedExercises[exId] && (
                                                                <button
                                                                    onClick={() => { haptic.bump(); setTimerSeconds(ex.rest); setTimerActive(true); }}
                                                                    className="h-12 min-h-[48px] px-4 rounded-xl bg-sys-surfaceHigh text-white text-sm font-bold flex items-center gap-2 active:bg-sys-onSurfaceVar transition-colors flex-shrink-0"
                                                                    aria-label={`Start ${ex.rest} second timer`}
                                                                >
                                                                    <i data-lucide="timer" width="16"></i> {ex.rest}s
                                                                </button>
                                                            )}
                                                            {isEMOM(ex) && !collapsedExercises[exId] && (
                                                                <button
                                                                    onClick={() => {
                                                                        haptic.bump();
                                                                        setEmomSeconds(emomInterval);
                                                                        setEmomActive(true);
                                                                    }}
                                                                    className="h-12 min-h-[48px] px-4 rounded-xl bg-sys-accent text-white text-sm font-bold flex items-center gap-2 active:bg-sys-accent/80 transition-colors flex-shrink-0"
                                                                    aria-label={`Start EMOM timer with ${emomInterval} second interval`}
                                                                >
                                                                    <i data-lucide="clock" width="16"></i> EMOM
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={`exercise-content ${collapsedExercises[exId] ? 'collapsed' : ''}`}>
                                                        <div>
                                                    <div className="flex flex-wrap gap-4 mb-5">
                                                        {currentSetArray.map((isDone, i) => {
                                                            const currentRPE = logs[exId]?.rpe?.[i];
                                                            return (
                                                                <div key={`${exId}-set-${i}`} className="flex flex-col items-center gap-2">
                                                                    <button
                                                                        onClick={() => toggleSet(exId, i, defaultSets, ex.rest)}
                                                                        className={`set-button h-14 w-14 min-w-[56px] min-h-[56px] rounded-2xl flex flex-col items-center justify-center text-base font-bold relative overflow-hidden ${isDone ? 'completed bg-sys-accent text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'}`}
                                                                        aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                                                    >
                                                                        {isDone ? (
                                                                            <div className="flex flex-col items-center">
                                                                                <i data-lucide="check" width="20" />
                                                                                <span className="text-xs mt-0.5">{i + 1}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col items-center">
                                                                                <div className="h-3 w-3 rounded-full border-2 border-current mb-1"></div>
                                                                                <span>{i + 1}</span>
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                    {isDone && (
                                                                        <select
                                                                            key={`${exId}-rpe-${i}`}
                                                                            value={currentRPE || ''}
                                                                            onChange={(e) => saveRPE(exId, i, e.target.value)}
                                                                            className="w-14 h-7 px-1 bg-sys-surfaceHigh rounded-lg text-white text-xs font-semibold text-center outline-none focus:ring-1 focus:ring-sys-accent"
                                                                            aria-label={`RPE for set ${i + 1}`}
                                                                        >
                                                                            <option value="">RPE</option>
                                                                            <option value="6">6</option>
                                                                            <option value="7">7</option>
                                                                            <option value="8">8</option>
                                                                            <option value="9">9</option>
                                                                            <option value="10">10</option>
                                                                        </select>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        <button
                                                            onClick={() => addSet(exId, defaultSets)}
                                                            className="h-14 w-14 min-w-[56px] min-h-[56px] rounded-2xl border-2 border-dashed border-white/20 text-white/30 flex items-center justify-center active:bg-white/5 transition-colors"
                                                            aria-label={`Add additional set to ${ex.name}`}
                                                        >
                                                            <i data-lucide="plus" width="22"></i>
                                                        </button>
                                                    </div>

                                                    {/* Quick Actions Row */}
                                                    {currentSetArray.some(s => !s) && (
                                                        <div className="flex gap-3 mb-5">
                                                            <button
                                                                onClick={() => completeAllSets(exId, defaultSets)}
                                                                className="flex-1 h-10 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar text-sm font-semibold flex items-center justify-center gap-2 active:bg-sys-accent/20 transition-colors"
                                                                aria-label="Complete all sets"
                                                            >
                                                                <i data-lucide="check-check" width="16"></i>
                                                                <span>Complete All</span>
                                                            </button>
                                                        </div>
                                                    )}

                                                    {!ex.isBodyweight && (
                                                        <div className="pt-4 border-t border-white/5">
                                                            <label htmlFor={`${exId}-weight`} className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">Load (kg)</label>
                                                            <div className="relative flex items-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        haptic.tick();
                                                                        const current = parseFloat(logs[exId]?.weight || '0');
                                                                        if (!isNaN(current)) {
                                                                            saveLog(exId, 'weight', Math.max(0, current - WEIGHT_INCREMENT_KG).toString());
                                                                        }
                                                                    }}
                                                                    className="h-14 w-12 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors"
                                                                    aria-label={`Decrease weight by ${WEIGHT_INCREMENT_KG}kg`}
                                                                >
                                                                    <i data-lucide="minus" width="18"></i>
                                                                </button>
                                                                <input
                                                                    id={`${exId}-weight`}
                                                                    type="number"
                                                                    inputMode="decimal"
                                                                    min="0"
                                                                    max={MAX_WEIGHT_KG}
                                                                    step={WEIGHT_STEP}
                                                                    className="bg-sys-surfaceHigh rounded-xl flex-1 min-w-0 h-14 px-3 text-white font-mono text-lg text-center outline-none focus:ring-2 focus:ring-sys-accent transition-all"
                                                                    value={logs[exId]?.weight || ''}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        // Allow empty string or valid positive numbers within range
                                                                        if (value === '' || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= MAX_WEIGHT_KG)) {
                                                                            saveLog(exId, 'weight', value);
                                                                        }
                                                                    }}
                                                                    placeholder="0"
                                                                    aria-label="Weight in kilograms"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        haptic.tick();
                                                                        const current = parseFloat(logs[exId]?.weight || '0');
                                                                        if (!isNaN(current) && current < MAX_WEIGHT_KG) {
                                                                            saveLog(exId, 'weight', Math.min(MAX_WEIGHT_KG, current + WEIGHT_INCREMENT_KG).toString());
                                                                        }
                                                                    }}
                                                                    className="h-14 w-12 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors"
                                                                    aria-label={`Increase weight by ${WEIGHT_INCREMENT_KG}kg`}
                                                                >
                                                                    <i data-lucide="plus" width="18"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Added Exercises Section */}
                    {addedExercises.length > 0 && (
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-5 px-1">
                                <span className="text-sm font-bold text-sys-success uppercase tracking-wider bg-sys-surfaceHigh px-4 py-2 rounded-xl">Added Exercises</span>
                                <div className="h-[2px] flex-1 bg-gradient-to-r from-sys-success/20 to-transparent rounded-full"></div>
                            </div>

                            <div className="space-y-5">
                                {addedExercises.map((ex) => {
                                    const exId = `added_${ex.id}`;
                                    const currentSetArray = logs[exId]?.sets || new Array(ex.sets).fill(false);
                                    const completedSets = currentSetArray.filter(s => s).length;
                                    const totalSets = currentSetArray.length;
                                    const hasHistory = getExerciseHistory(ex.name).length > 0;

                                    return (
                                        <div key={exId} id={exId} className="relative scroll-mt-20">
                                            <div className={`bg-sys-surface rounded-3xl p-6 border relative overflow-hidden ${
                                                completedSets === totalSets ? 'border-sys-success/30 bg-sys-success/5' : 'border-sys-success/20'
                                            }`}>
                                                {/* Progress bar at bottom */}
                                                {completedSets > 0 && (
                                                    <div
                                                        className="progress-bar"
                                                        style={{ width: `${(completedSets / totalSets) * 100}%` }}
                                                    ></div>
                                                )}

                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex-1 pr-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (hasHistory) {
                                                                        haptic.tick();
                                                                        setShowExerciseHistory(ex.name);
                                                                    }
                                                                }}
                                                                className={`text-left ${hasHistory ? 'cursor-pointer active:opacity-70 transition-opacity' : 'cursor-default'}`}
                                                                aria-label={hasHistory ? `${ex.name} - tap to view history` : ex.name}
                                                            >
                                                                <h3 className="text-lg font-semibold text-white leading-snug">{ex.name}</h3>
                                                            </button>
                                                            {completedSets > 0 && (
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${completedSets === totalSets ? 'bg-sys-success/20 text-sys-success' : 'bg-sys-accent/10 text-sys-accent'}`}>
                                                                    {completedSets}/{totalSets}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-sys-onSurfaceVar">
                                                            {ex.primaryMuscles.join(', ')} • {ex.equipment.join(', ')}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeAddedExercise(ex.id)}
                                                        className="h-10 w-10 min-w-[40px] rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center active:scale-90 transition-all"
                                                        aria-label="Remove exercise"
                                                    >
                                                        <i data-lucide="x" width="20"></i>
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap gap-4 mb-5">
                                                    {currentSetArray.map((isDone, i) => (
                                                        <button
                                                            key={`${exId}-set-${i}`}
                                                            onClick={() => toggleSet(exId, i, ex.sets, 90)}
                                                            className={`set-button h-14 w-14 min-w-[56px] min-h-[56px] rounded-2xl flex items-center justify-center text-base font-bold ${isDone ? 'completed bg-sys-accent text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'}`}
                                                            aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                                        >
                                                            {isDone ? <i data-lucide="check" width="24" /> : i + 1}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => addSet(exId, ex.sets)}
                                                        className="h-14 w-14 min-w-[56px] min-h-[56px] rounded-2xl border-2 border-dashed border-white/20 text-white/30 flex items-center justify-center active:bg-white/5 transition-colors"
                                                        aria-label="Add additional set"
                                                    >
                                                        <i data-lucide="plus" width="22"></i>
                                                    </button>
                                                </div>

                                                {currentSetArray.some(s => !s) && (
                                                    <div className="flex gap-3 mb-5">
                                                        <button
                                                            onClick={() => completeAllSets(exId, ex.sets)}
                                                            className="flex-1 h-10 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar text-sm font-semibold flex items-center justify-center gap-2 active:bg-sys-accent/20 transition-colors"
                                                            aria-label="Complete all sets"
                                                        >
                                                            <i data-lucide="check-check" width="16"></i>
                                                            <span>Complete All</span>
                                                        </button>
                                                    </div>
                                                )}

                                                {!ex.isBodyweight && (
                                                    <div className="pt-4 border-t border-white/5">
                                                        <label htmlFor={`${exId}-weight`} className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">Load (kg)</label>
                                                        <div className="relative flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    haptic.tick();
                                                                    const current = parseFloat(logs[exId]?.weight || ex.weight || '0');
                                                                    saveLog(exId, 'weight', Math.max(0, current - 2.5).toString());
                                                                }}
                                                                className="h-14 w-12 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors"
                                                                aria-label="Decrease weight by 2.5kg"
                                                            >
                                                                <i data-lucide="minus" width="18"></i>
                                                            </button>
                                                            <input
                                                                id={`${exId}-weight`}
                                                                type="number"
                                                                inputMode="decimal"
                                                                className="bg-sys-surfaceHigh rounded-xl flex-1 min-w-0 h-14 px-3 text-white font-mono text-lg text-center outline-none focus:ring-2 focus:ring-sys-accent transition-all"
                                                                value={logs[exId]?.weight || ex.weight || ''}
                                                                onChange={(e) => saveLog(exId, 'weight', e.target.value)}
                                                                placeholder="0"
                                                                aria-label="Weight in kilograms"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    haptic.tick();
                                                                    const current = parseFloat(logs[exId]?.weight || ex.weight || '0');
                                                                    saveLog(exId, 'weight', (current + 2.5).toString());
                                                                }}
                                                                className="h-14 w-12 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors"
                                                                aria-label="Increase weight by 2.5kg"
                                                            >
                                                                <i data-lucide="plus" width="18"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Add Exercise Button */}
                    {!logs.completed && (
                        <div className="mb-6">
                            <button
                                onClick={() => { haptic.bump(); setShowExerciseSelector(true); }}
                                className="w-full h-12 px-6 rounded-xl bg-sys-success/10 border border-sys-success/30 text-sys-success font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <i data-lucide="plus-circle" width="20"></i>
                                <span>Add Exercise</span>
                            </button>
                        </div>
                    )}

                    {/* Only show ActionBar if workout is not completed */}
                    {!logs.completed && (
                        <ActionBar
                            onFinish={handleFinish}
                            timerState={{time: timerSeconds}}
                            setTimerActive={setTimerActive}
                            setTimerSeconds={setTimerSeconds}
                            emomState={{active: emomActive, seconds: emomSeconds, interval: emomInterval}}
                            setEmomActive={setEmomActive}
                            setEmomSeconds={setEmomSeconds}
                            setEmomInterval={setEmomInterval}
                        />
                    )}

                    {/* Timer Completion Toast */}
                    {showTimerToast && (
                        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4 safe-pt animate-slide-up">
                            <div className="bg-sys-accent px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 max-w-md w-full border border-white/10">
                                <i data-lucide="check-circle-2" width="24" className="text-white flex-shrink-0"></i>
                                <span className="text-white font-bold text-base flex-1">Rest Complete!</span>
                                <button
                                    onClick={() => { haptic.tick(); setShowTimerToast(false); }}
                                    className="h-8 w-8 min-w-[32px] rounded-full hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
                                    aria-label="Close notification"
                                >
                                    <i data-lucide="x" width="18"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Exercise Selector Modal */}
                    {showExerciseSelector && EXERCISE_LIBRARY.length > 0 && (
                        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-slide-up">
                            <div className="bg-sys-surface rounded-t-3xl w-full max-h-[85vh] border-t border-white/10 flex flex-col">
                                {/* Header */}
                                <div className="p-6 border-b border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-white">Add Exercise</h3>
                                        <button
                                            onClick={() => { haptic.tick(); setShowExerciseSelector(false); setExerciseSearchTerm(''); }}
                                            className="h-10 w-10 rounded-xl bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all"
                                            aria-label="Close"
                                        >
                                            <i data-lucide="x" width="20"></i>
                                        </button>
                                    </div>

                                    {/* Search */}
                                    <input
                                        type="text"
                                        placeholder="Search exercises..."
                                        value={exerciseSearchTerm}
                                        onChange={(e) => setExerciseSearchTerm(e.target.value)}
                                        className="w-full h-12 px-4 bg-sys-surfaceHigh rounded-xl text-white placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-accent transition-all"
                                    />

                                    {/* Muscle Filter */}
                                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                        {['all', 'pull', 'push', 'legs', 'core', 'cardio', 'skill', 'arms', 'shoulders', 'olympic', 'functional', 'plyometric', 'mobility'].map(filter => (
                                            <button
                                                key={filter}
                                                onClick={() => setSelectedMuscleFilter(filter)}
                                                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                                    selectedMuscleFilter === filter
                                                        ? 'bg-sys-accent text-white'
                                                        : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                                }`}
                                            >
                                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Exercise List */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    <div className="space-y-3">
                                        {EXERCISE_LIBRARY
                                            .filter(ex => {
                                                const searchMatch = !debouncedExerciseSearch ||
                                                    ex.name.toLowerCase().includes(debouncedExerciseSearch.toLowerCase()) ||
                                                    ex.primaryMuscles.some(m => m.toLowerCase().includes(debouncedExerciseSearch.toLowerCase()));
                                                const categoryMatch = selectedMuscleFilter === 'all' || ex.category === selectedMuscleFilter;
                                                return searchMatch && categoryMatch;
                                            })
                                            .map((ex) => {
                                                return (
                                                    <ExerciseListItem key={ex.id} exercise={ex} onAdd={addExerciseToWorkout} haptic={haptic} />
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Exercise History Modal */}
                    {showExerciseHistory && (
                        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-slide-up">
                            <div className="bg-sys-surface rounded-t-3xl w-full max-h-[85vh] border-t border-white/10 flex flex-col">
                                {/* Header */}
                                <div className="p-6 border-b border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-white">{showExerciseHistory}</h3>
                                        <button
                                            onClick={() => { haptic.tick(); setShowExerciseHistory(null); }}
                                            className="h-10 w-10 rounded-xl bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all"
                                            aria-label="Close"
                                        >
                                            <i data-lucide="x" width="20"></i>
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {(() => {
                                        const history = getExerciseHistory(showExerciseHistory);
                                        const stats = calculateExerciseStats(showExerciseHistory);

                                        return (
                                            <>
                                                {/* Stats Summary */}
                                                <div className="grid grid-cols-2 gap-3 mb-6">
                                                    <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                        <div className="text-xs text-sys-onSurfaceVar mb-1">Workouts</div>
                                                        <div className="text-2xl font-bold text-white">{stats.totalWorkouts}</div>
                                                    </div>
                                                    {stats.maxWeight && (
                                                        <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                            <div className="text-xs text-sys-onSurfaceVar mb-1">Max Weight</div>
                                                            <div className="text-2xl font-bold text-sys-accent">{stats.maxWeight}kg</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Recent History */}
                                                <h4 className="text-sm font-bold text-white mb-3">Recent History</h4>
                                                <div className="space-y-2">
                                                    {history.slice(-5).reverse().map((entry, idx) => (
                                                        <div key={idx} className="bg-sys-surfaceHigh rounded-xl p-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-semibold text-white">
                                                                        {new Date(entry.date).toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </div>
                                                                    <div className="text-xs text-sys-onSurfaceVar">
                                                                        W{entry.week} D{entry.day}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm font-bold text-white">
                                                                        {entry.sets} sets
                                                                    </div>
                                                                    {entry.weight && (
                                                                        <div className="text-xs text-sys-accent font-semibold">
                                                                            {entry.weight}kg
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </>
            );
        };

        // Exercise List Item Component
        const ExerciseListItem = ({ exercise, onAdd, haptic }) => {
            const [showAddForm, setShowAddForm] = useState(false);
            const [sets, setSets] = useState(3);
            const [weight, setWeight] = useState('');

            return (
                <div className="bg-sys-surfaceHigh rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <h4 className="text-base font-semibold text-white mb-1">{exercise.name}</h4>
                            <p className="text-xs text-sys-onSurfaceVar mb-2">
                                {exercise.primaryMuscles.join(', ')}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {exercise.equipment.slice(0, 3).map((eq) => (
                                    <span key={eq} className="text-xs px-2 py-1 bg-sys-surface rounded-lg text-sys-onSurfaceVar">
                                        {eq}
                                    </span>
                                ))}
                                {!exercise.isBodyweight && (
                                    <span className="text-xs px-2 py-1 bg-sys-accent/10 rounded-lg text-sys-accent">
                                        Weighted
                                    </span>
                                )}
                            </div>
                        </div>

                        {!showAddForm ? (
                            <button
                                onClick={() => { haptic.tick(); setShowAddForm(true); }}
                                className="h-10 px-4 rounded-xl text-white font-semibold text-sm active:scale-95 transition-transform flex-shrink-0 btn-gradient-primary"
                            >
                                Add
                            </button>
                        ) : (
                            <button
                                onClick={() => { haptic.tick(); setShowAddForm(false); }}
                                className="h-10 w-10 rounded-xl bg-sys-surface text-sys-onSurfaceVar flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
                                aria-label="Collapse form"
                            >
                                <i data-lucide="chevron-up" width="20"></i>
                            </button>
                        )}
                    </div>

                    {showAddForm && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">Sets</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={sets}
                                        onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                                        className="w-full h-10 px-3 bg-sys-surface rounded-xl text-white text-center font-mono outline-none focus:ring-2 focus:ring-sys-accent"
                                    />
                                </div>
                                {!exercise.isBodyweight && (
                                    <div>
                                        <label className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">Weight (kg)</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            placeholder="0"
                                            className="w-full h-10 px-3 bg-sys-surface rounded-xl text-white text-center font-mono outline-none focus:ring-2 focus:ring-sys-accent"
                                        />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    haptic.success();
                                    onAdd(exercise, sets, weight);
                                    setShowAddForm(false);
                                    setSets(3);
                                    setWeight('');
                                }}
                                className="w-full h-10 rounded-xl text-white font-semibold active:scale-95 transition-transform btn-gradient-success"
                            >
                                Add to Workout
                            </button>
                        </div>
                    )}
                </div>
            );
        };

        // --- DASHBOARD ---
        const Dashboard = ({ currentWeek, setCurrentWeek, onStartWorkout }) => {
            const [progress, setProgress] = useState(0);
            const haptic = useHaptic();

            // Enhanced swipe navigation with visual feedback
            const {
                swipeDirection,
                swipeProgress,
                handlers: swipeHandlers
            } = useSwipeNavigation({
                onSwipeLeft: () => {
                    if (currentWeek < 21) {
                        haptic.swipe();
                        setCurrentWeek(currentWeek + 1);
                    }
                },
                onSwipeRight: () => {
                    if (currentWeek > 1) {
                        haptic.swipe();
                        setCurrentWeek(currentWeek - 1);
                    }
                }
            });

            useEffect(() => setProgress((currentWeek / 21) * 100), [currentWeek]);

            // Initialize Lucide icons when week changes (day completion status may update icons)
            useLucideIcons([currentWeek]);

            const isCompleted = (day) => {
                const session = safeGetJSON(`session_w${currentWeek}d${day}`, null);
                return session?.completed === true;
            };

            const currentBlock = PROGRAM_DATA.blocks.find(b => b.weeks.includes(currentWeek)) || { name: "Unknown" };

            return (
                <>
                    <SwipeIndicator
                        direction={swipeDirection}
                        progress={swipeProgress}
                        leftLabel={currentWeek < 21 ? `Week ${currentWeek + 1}` : null}
                        rightLabel={currentWeek > 1 ? `Week ${currentWeek - 1}` : null}
                    />
                    <div {...swipeHandlers} className="flex-1 overflow-y-auto px-5 pb-32 pt-6">
                        <div className="card-modern p-7 mb-8 relative overflow-hidden border border-white/5">
                            <div className="relative z-10">
                                <h2 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-2">Current Phase</h2>
                                <h1 className="text-3xl font-bold text-white mb-5 leading-tight">{currentBlock.name}</h1>
                                <div className="flex items-baseline gap-3 mb-6">
                                    <span className="text-5xl font-bold text-sys-accent tracking-tighter">W{currentWeek}</span>
                                    <span className="text-sys-onSurfaceVar font-mono text-xl">/ 21</span>
                                </div>
                                <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
                                    <div className="progress-bar-fill h-full transition-all duration-500 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-end mb-6 px-1">
                            <h3 className="text-2xl font-bold text-white">Weekly Plan</h3>
                            <span className="text-sm text-sys-onSurfaceVar font-medium">Week {currentWeek}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2, 3, 5].map((day) => {
                                const done = isCompleted(day);
                                return (
                                    <button
                                        key={day}
                                        onClick={() => { haptic.tick(); onStartWorkout(day); }}
                                        className={`relative min-h-[72px] rounded-3xl px-6 py-5 flex items-center justify-between transition-all active:scale-[0.97] ${done ? 'bg-sys-success/10 border-2 border-sys-success/30' : 'bg-sys-surface border-2 border-white/5'}`}
                                        aria-label={`${done ? 'Completed' : 'Start'} Day ${day} workout`}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className={`text-sm font-bold uppercase tracking-wider mb-1 ${done ? 'text-sys-success' : 'text-sys-onSurfaceVar'}`}>Day {day}</span>
                                            <span className={`text-xs ${done ? 'text-sys-success/70' : 'text-sys-onSurfaceVar/70'}`}>
                                                {done ? 'Completed' : 'Tap to start'}
                                            </span>
                                        </div>

                                        <div className={`h-12 w-12 min-w-[48px] rounded-2xl flex items-center justify-center ${done ? 'bg-sys-success text-sys-black' : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'}`}>
                                            {done ? <i data-lucide="check" width="24"></i> : <i data-lucide="chevron-right" width="24"></i>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-10 flex justify-center items-center gap-2">
                            <button
                                onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                                className="h-8 w-8 rounded-lg bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
                                disabled={currentWeek === 1}
                                aria-label="Previous week"
                            >
                                <i data-lucide="chevron-left" width="18"></i>
                        </button>
                        <div className="flex gap-2 px-4">
                            {[...Array(5)].map((_, i) => {
                                const dotWeek = currentWeek - 2 + i;
                                if (dotWeek < 1 || dotWeek > 21) return <div key={i} className="w-2 h-2" />;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentWeek(dotWeek)}
                                        className={`rounded-full transition-all ${dotWeek === currentWeek ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`}
                                        aria-label={`Week ${dotWeek}`}
                                    />
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentWeek(Math.min(21, currentWeek + 1))}
                            className="h-8 w-8 rounded-lg bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
                            disabled={currentWeek === 21}
                            aria-label="Next week"
                        >
                            <i data-lucide="chevron-right" width="18"></i>
                        </button>
                    </div>
                    </div>
                </>
            );
        };

        // Exercise Stats View - Shows statistics for all exercises with history
        const ExerciseStatsView = ({ onSelectExercise }) => {
            const [selectedExercise, setSelectedExercise] = useState(null);
            const haptic = useHaptic();

            const exercisesWithHistory = getAllExercisesWithHistory();

            // Calculate stats for all exercises
            const exerciseStats = exercisesWithHistory.map(exerciseName => ({
                name: exerciseName,
                ...calculateExerciseStats(exerciseName)
            }));

            // Sort by total workouts (most frequent first)
            exerciseStats.sort((a, b) => b.totalWorkouts - a.totalWorkouts);

            // Initialize Lucide icons when selected exercise changes
            useLucideIcons([selectedExercise]);

            const handleExerciseClick = (exerciseName) => {
                haptic.tick();
                setSelectedExercise(selectedExercise === exerciseName ? null : exerciseName);
            };

            if (exerciseStats.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-3xl border border-white/5 px-6">
                        <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-5">
                            <i data-lucide="bar-chart-2" width="40" className="text-sys-onSurfaceVar"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Exercise Data</h3>
                        <p className="text-sm text-sys-onSurfaceVar text-center max-w-[250px]">Complete workouts to see exercise statistics</p>
                    </div>
                );
            }

            return (
                <div className="space-y-4">
                    {exerciseStats.map((stat, idx) => {
                        const isExpanded = selectedExercise === stat.name;
                        const history = getExerciseHistory(stat.name);

                        return (
                            <div key={idx} className="bg-sys-surface border border-white/5 rounded-3xl overflow-hidden">
                                <button
                                    onClick={() => handleExerciseClick(stat.name)}
                                    className="w-full p-5 flex items-center gap-4 active:bg-sys-surfaceHigh transition-colors text-left"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-white mb-1 truncate">{stat.name}</h3>
                                        <div className="flex items-center gap-3 text-xs text-sys-onSurfaceVar">
                                            <span>{stat.totalWorkouts} workouts</span>
                                            {stat.maxWeight && <span>• Max: {stat.maxWeight}kg</span>}
                                            {stat.estimated1RM && <span>• Est 1RM: {stat.estimated1RM}kg</span>}
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-sys-accent/20 flex items-center justify-center flex-shrink-0">
                                        <i data-lucide={isExpanded ? "chevron-up" : "chevron-down"} width="20" className="text-sys-accent"></i>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-5 pb-5">
                                        {/* Stats Summary */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                <div className="text-xs text-sys-onSurfaceVar mb-1">Total Workouts</div>
                                                <div className="text-2xl font-bold text-white">{stat.totalWorkouts}</div>
                                            </div>
                                            <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                <div className="text-xs text-sys-onSurfaceVar mb-1">Max Sets</div>
                                                <div className="text-2xl font-bold text-white">{stat.maxSets || 'N/A'}</div>
                                            </div>
                                            {stat.maxWeight && (
                                                <>
                                                    <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                        <div className="text-xs text-sys-onSurfaceVar mb-1">Max Weight</div>
                                                        <div className="text-2xl font-bold text-sys-accent">{stat.maxWeight} kg</div>
                                                    </div>
                                                    {stat.estimated1RM && (
                                                        <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                            <div className="text-xs text-sys-onSurfaceVar mb-1">Est. 1RM</div>
                                                            <div className="text-2xl font-bold text-sys-success">{stat.estimated1RM} kg</div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Simple Progress Graph */}
                                        {stat.recentProgress && stat.recentProgress.length > 1 && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-bold text-white mb-3">Weight Progress (Last 10 Workouts)</h4>
                                                <SimpleWeightGraph data={stat.recentProgress} />
                                            </div>
                                        )}

                                        {/* Recent History */}
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-3">Recent History</h4>
                                            <div className="space-y-2">
                                                {history.slice(-5).reverse().map((entry, entryIdx) => (
                                                    <div key={entryIdx} className="bg-sys-surfaceHigh rounded-xl p-3">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <div className="flex-1">
                                                                <div className="text-sm font-semibold text-white">
                                                                    {new Date(entry.date).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                </div>
                                                                <div className="text-xs text-sys-onSurfaceVar">
                                                                    W{entry.week}D{entry.day}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-bold text-white">
                                                                    {entry.sets} sets
                                                                </div>
                                                                {entry.weight && (
                                                                    <div className="text-xs text-sys-accent font-semibold">
                                                                        {entry.weight} kg
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        };

        // Simple Weight Progress Graph Component (SVG-based)
        const SimpleWeightGraph = ({ data }) => {
            if (!data || data.length < 2) return null;

            // Filter out entries with no weight
            const weightData = data.filter(d => d.weight && d.weight > 0);
            if (weightData.length < 2) return null;

            const weights = weightData.map(d => d.weight);
            const maxWeight = Math.max(...weights);
            const minWeight = Math.min(...weights);
            const range = maxWeight - minWeight || 1; // Avoid division by zero

            const width = 100; // Use percentage-based width
            const height = 60;
            const padding = 5;

            // Calculate points for the line
            const points = weightData.map((d, i) => {
                const x = (i / (weightData.length - 1)) * (width - 2 * padding) + padding;
                const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
                return `${x},${y}`;
            }).join(' ');

            return (
                <div className="bg-sys-surfaceHigh rounded-xl p-4">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

                        {/* Weight line */}
                        <polyline
                            points={points}
                            fill="none"
                            stroke="var(--color-accent)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Data points */}
                        {weightData.map((d, i) => {
                            const x = (i / (weightData.length - 1)) * (width - 2 * padding) + padding;
                            const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
                            return (
                                <circle
                                    key={i}
                                    cx={x}
                                    cy={y}
                                    r="2"
                                    fill="var(--color-primary-500)"
                                    stroke="white"
                                    strokeWidth="1"
                                />
                            );
                        })}
                    </svg>
                    <div className="flex justify-between text-xs text-sys-onSurfaceVar mt-2">
                        <span>{minWeight}kg</span>
                        <span>{maxWeight}kg</span>
                    </div>
                </div>
            );
        };

        const HistoryView = () => {
            const [history, setHistory] = useState([]);
            const [isRefreshing, setIsRefreshing] = useState(false);
            const [expandedEntries, setExpandedEntries] = useState({});
            const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'stats'
            const [selectedExerciseForGraph, setSelectedExerciseForGraph] = useState(null);
            const haptic = useHaptic();

            const loadHistory = async () => {
                const h = safeGetJSON('global_history', []);

                // Validate that history is an array
                if (!Array.isArray(h)) {
                    console.warn('Invalid history format, resetting');
                    setHistory([]);
                    return;
                }

                // Filter out invalid entries and sort
                const validHistory = h.filter(entry =>
                    entry &&
                    typeof entry === 'object' &&
                    entry.week &&
                    entry.day &&
                    entry.date
                );

                setHistory(validHistory.sort((a, b) => new Date(b.date) - new Date(a.date)));
            };

            useEffect(() => {
                loadHistory();
            }, []);

            // Initialize Lucide icons when history or UI state changes
            useLucideIcons([history, expandedEntries, viewMode, selectedExerciseForGraph]);

            // Pull-to-refresh handler
            const handlePullRefresh = async () => {
                haptic.bump();
                setIsRefreshing(true);
                // Small delay for visual feedback
                await new Promise(resolve => setTimeout(resolve, 500));
                await loadHistory();
                setIsRefreshing(false);
                haptic.success();
            };

            const handleRefresh = () => {
                setIsRefreshing(true);
                setTimeout(() => {
                    loadHistory();
                    setIsRefreshing(false);
                }, 500);
            };

            const toggleExpanded = (idx) => {
                haptic.tick();
                setExpandedEntries(prev => ({ ...prev, [idx]: !prev[idx] }));
            };

            return (
                <PullToRefresh onRefresh={handlePullRefresh} className="h-full">
                    <div className="px-5 pb-32 pt-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">History</h2>
                            <div className="flex items-center gap-2">
                                <div className="flex bg-sys-surfaceHigh rounded-xl p-1">
                                    <button
                                        onClick={() => { haptic.tick(); setViewMode('timeline'); }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'timeline' ? 'bg-sys-accent text-white' : 'text-sys-onSurfaceVar'}`}
                                    >
                                        Timeline
                                    </button>
                                    <button
                                        onClick={() => { haptic.tick(); setViewMode('stats'); }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'stats' ? 'bg-sys-accent text-white' : 'text-sys-onSurfaceVar'}`}
                                    >
                                        Stats
                                    </button>
                                </div>
                                <button
                                    onClick={handleRefresh}
                                    className={`h-10 w-10 rounded-xl bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                                    aria-label="Refresh history"
                                >
                                    <i data-lucide="refresh-cw" width="18"></i>
                                </button>
                            </div>
                        </div>
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-3xl border border-white/5 px-6">
                                <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-5">
                                    <i data-lucide="history" width="40" className="text-sys-onSurfaceVar"></i>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No Workouts Yet</h3>
                                <p className="text-sm text-sys-onSurfaceVar text-center max-w-[250px]">Complete your first workout to see it here. Pull down to refresh.</p>
                            </div>
                        ) : viewMode === 'stats' ? (
                            <ExerciseStatsView onSelectExercise={setSelectedExerciseForGraph} />
                        ) : (
                            <div className="space-y-4">
                                {history.map((entry, idx) => {
                                const isExpanded = expandedEntries[idx];
                                const hasExercises = entry.exercises && entry.exercises.length > 0;

                                return (
                                    <div key={idx} className="bg-sys-surface border border-white/5 rounded-3xl overflow-hidden">
                                        <button
                                            onClick={() => toggleExpanded(idx)}
                                            className="w-full p-5 flex items-center gap-5 active:bg-sys-surfaceHigh transition-colors"
                                        >
                                            <div className="h-14 w-14 min-w-[56px] rounded-2xl bg-sys-accent/10 border border-sys-accent/20 flex items-center justify-center">
                                                <span className="text-sm font-bold text-sys-accent">W{entry.week}</span>
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <h3 className="text-base font-bold text-white mb-1 truncate">Day {entry.day} Complete</h3>
                                                <p className="text-sm text-sys-onSurfaceVar">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-10 w-10 rounded-full bg-sys-success/20 flex items-center justify-center flex-shrink-0">
                                                    <i data-lucide={isExpanded ? "chevron-up" : "chevron-down"} width="20" className="text-sys-success"></i>
                                                </div>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-5 pb-5">
                                                {/* Workout Notes */}
                                                {entry.workoutNotes && (
                                                    <div className="mb-4">
                                                        <div className="bg-sys-surfaceHigh rounded-xl p-4 border border-white/5">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <i data-lucide="file-text" width="14" className="text-sys-accent"></i>
                                                                <h4 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider">Workout Notes</h4>
                                                            </div>
                                                            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{entry.workoutNotes}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Exercise Details */}
                                                {hasExercises && (
                                                    <div className="mb-4">
                                                        <h4 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-3">Exercises</h4>
                                                        <div className="space-y-2">
                                                            {entry.exercises.map((ex, exIdx) => (
                                                                <div key={exIdx} className="bg-sys-surfaceHigh rounded-xl p-3">
                                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                                        <div className="flex-1 min-w-0">
                                                                            <h5 className="text-sm font-semibold text-white truncate">{ex.name}</h5>
                                                                            <p className="text-xs text-sys-onSurfaceVar">{ex.prescription}</p>
                                                                        </div>
                                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                                                                            ex.completedSets === ex.totalSets
                                                                                ? 'bg-sys-success/20 text-sys-success'
                                                                                : 'bg-sys-accent/10 text-sys-accent'
                                                                        }`}>
                                                                            <span>{ex.completedSets}/{ex.totalSets}</span>
                                                                        </div>
                                                                    </div>
                                                                    {ex.weight && (
                                                                        <p className="text-xs text-sys-onSurfaceVar mt-1">
                                                                            Weight: {ex.weight} kg
                                                                        </p>
                                                                    )}
                                                                    {ex.rpe && Object.keys(ex.rpe).length > 0 && (
                                                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                                            <span className="text-xs text-sys-onSurfaceVar">RPE:</span>
                                                                            {Object.entries(ex.rpe).map(([setIdx, rpe]) => (
                                                                                <span key={setIdx} className="text-xs px-2 py-0.5 bg-sys-accent/10 rounded-full text-sys-accent font-semibold">
                                                                                    S{parseInt(setIdx) + 1}: {rpe}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {!hasExercises && !entry.workoutNotes && (
                                                    <p className="text-sm text-sys-onSurfaceVar text-center py-4">
                                                        No detailed information available
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    </div>
                </PullToRefresh>
            );
        };

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

        const SettingsView = () => {
            // Firebase state
            const [firebaseUser, setFirebaseUser] = useState(null);
            const [firebaseSyncEnabled, setFirebaseSyncEnabled] = useState(true); // Default enabled
            const [firebaseMessage, setFirebaseMessage] = useState('');

            // Theme state
            const { theme, setTheme, themes } = useTheme();

            const haptic = useHaptic();

            useEffect(() => {
                // Load Firebase sync setting
                const savedSyncEnabled = localStorage.getItem(FIREBASE_SYNC_ENABLED_KEY) !== 'false'; // Default true
                setFirebaseSyncEnabled(savedSyncEnabled);

                // Setup Firebase auth state listener (Firebase is auto-initialized from env vars)
                if (FirebaseService.isFirebaseInitialized()) {
                    FirebaseService.initSync(
                        (cloudData) => {
                            // Data received from cloud
                            if (cloudData) {
                                mergeCloudData(cloudData);
                                setFirebaseMessage('✓ Data synced from cloud');
                                setTimeout(() => setFirebaseMessage(''), 3000);
                            }
                        },
                        (user) => {
                            // Auth state changed
                            setFirebaseUser(user);
                            if (user && savedSyncEnabled) {
                                // User logged in - upload local data
                                const localData = getAllLocalData();
                                FirebaseService.saveToCloud(localData)
                                    .then(() => {
                                        setFirebaseMessage('✓ Local data synced to cloud');
                                        setTimeout(() => setFirebaseMessage(''), 3000);
                                    })
                                    .catch(err => {
                                        console.error('Failed to sync local data:', err);
                                    });
                            }
                        }
                    );
                }
            }, []);

            // Initialize Lucide icons when settings change
            useLucideIcons([firebaseMessage, firebaseUser]);

            // Firebase handlers
            const handleFirebaseLogin = async () => {
                haptic.bump();
                try {
                    await FirebaseService.handleLogin();
                    setFirebaseMessage('✓ Logged in successfully');
                    setTimeout(() => setFirebaseMessage(''), 3000);
                } catch (error) {
                    setFirebaseMessage('✗ Login failed: ' + error.message);
                    setTimeout(() => setFirebaseMessage(''), 5000);
                }
            };

            const handleFirebaseLogout = async () => {
                haptic.bump();
                try {
                    await FirebaseService.handleLogout();
                    setFirebaseMessage('✓ Logged out successfully');
                    setTimeout(() => setFirebaseMessage(''), 3000);
                } catch (error) {
                    setFirebaseMessage('✗ Logout failed: ' + error.message);
                    setTimeout(() => setFirebaseMessage(''), 5000);
                }
            };

            const handleManualSync = async () => {
                haptic.bump();
                try {
                    const localData = getAllLocalData();
                    await FirebaseService.saveToCloud(localData);
                    setFirebaseMessage('✓ Data synced to cloud successfully');
                    setTimeout(() => setFirebaseMessage(''), 3000);
                } catch (error) {
                    setFirebaseMessage('✗ Sync failed: ' + error.message);
                    setTimeout(() => setFirebaseMessage(''), 5000);
                }
            };

            const handleSyncToggle = () => {
                haptic.tick();
                const newValue = !firebaseSyncEnabled;
                setFirebaseSyncEnabled(newValue);
                localStorage.setItem(FIREBASE_SYNC_ENABLED_KEY, newValue.toString());
            };

            return (
                <div className="px-5 pb-32 pt-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

                    {/* Theme Selection */}
                    <ThemeSelector
                        theme={theme}
                        setTheme={(newTheme) => {
                            haptic.bump();
                            setTheme(newTheme);
                        }}
                        themes={themes}
                    />

                    {/* Firebase Sync Section - Only shown if Firebase is configured at build time */}
                    {FirebaseService.isFirebaseInitialized() && (
                        <div className="bg-sys-surface rounded-3xl border border-white/5 p-6 mb-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-xl bg-sys-accent/10 flex items-center justify-center">
                                    <i data-lucide="cloud" width="24" className="text-sys-accent"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Cloud Sync</h3>
                                    <p className="text-xs text-sys-onSurfaceVar">Sync data across devices with Google Auth</p>
                                </div>
                            </div>

                            {firebaseUser ? (
                                <>
                                    <div className="mb-4 p-4 bg-sys-surfaceHigh rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            {firebaseUser.photoURL && (
                                                <img src={firebaseUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
                                            )}
                                            <div>
                                                <div className="text-sm font-semibold text-white">{firebaseUser.displayName || 'User'}</div>
                                                <div className="text-xs text-sys-onSurfaceVar">{firebaseUser.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-sys-success mb-2">
                                            <i data-lucide="check-circle" width="14"></i>
                                            <span>Signed in with Google</span>
                                        </div>
                                        {(() => {
                                            const lastSync = FirebaseService.getLastSyncTime();
                                            const timeAgo = formatRelativeTime(lastSync);
                                            if (timeAgo) {
                                                return (
                                                    <div className="flex items-center gap-2 text-xs text-sys-onSurfaceVar">
                                                        <i data-lucide="clock" width="14"></i>
                                                        <span>Last synced {timeAgo}</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    {/* Auto-sync toggle */}
                                    <div className="mb-4 p-4 bg-sys-surfaceHigh rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <button
                                                onClick={handleSyncToggle}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${firebaseSyncEnabled ? 'bg-sys-success' : 'bg-sys-onSurfaceVar'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${firebaseSyncEnabled ? 'translate-x-6' : 'translate-x-1'}`}></span>
                                            </button>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-white mb-1">Automatic Sync</h4>
                                                <p className="text-xs text-sys-onSurfaceVar leading-relaxed">
                                                    Automatically sync data to cloud when changes are made
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleManualSync}
                                            className="flex-1 h-12 rounded-xl bg-sys-surfaceHigh text-white font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform border border-white/5"
                                        >
                                            <i data-lucide="refresh-cw" width="18"></i>
                                            <span>Sync Now</span>
                                        </button>

                                        <button
                                            onClick={handleFirebaseLogout}
                                            className="flex-1 h-12 rounded-xl bg-sys-surfaceHigh text-white font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform border border-white/5"
                                        >
                                            <i data-lucide="log-out" width="18"></i>
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-sys-onSurfaceVar mb-4">
                                        Sign in with your Google account to sync your workout data across all your devices. Your data is stored securely and privately.
                                    </p>

                                    <button
                                        onClick={handleFirebaseLogin}
                                        className="w-full h-14 rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform btn-gradient-primary"
                                    >
                                        <i data-lucide="log-in" width="20"></i>
                                        <span>Sign In with Google</span>
                                    </button>
                                </>
                            )}

                            {firebaseMessage && (
                                <div className={`mt-4 p-3 rounded-xl text-sm text-center ${
                                    firebaseMessage.startsWith('✓')
                                        ? 'bg-sys-success/10 border border-sys-success/30 text-sys-success'
                                        : 'bg-red-500/10 border border-red-500/30 text-red-500'
                                }`}>
                                    {firebaseMessage}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        };

        // --- EXERCISE LIBRARY & HISTORY VIEW ---
        const ExerciseLibraryView = () => {
            const [selectedExercise, setSelectedExercise] = useState(null);
            const [searchTerm, setSearchTerm] = useState('');
            const [categoryFilter, setCategoryFilter] = useState('all');
            const [showOnlyTracked, setShowOnlyTracked] = useState(false);
            const haptic = useHaptic();

            // Debounce search term to improve performance
            const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY_MS);

            const trackedExercises = getAllExercisesWithHistory();

            // Get all exercises to display
            const exercisesToShow = useMemo(() => {
                let exercises = [...EXERCISE_LIBRARY];

                // Filter by search term (using debounced value)
                if (debouncedSearchTerm) {
                    exercises = exercises.filter(ex =>
                        ex.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                        ex.primaryMuscles.some(m => m.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
                    );
                }

                // Filter by category
                if (categoryFilter !== 'all') {
                    exercises = exercises.filter(ex => ex.category === categoryFilter);
                }

                // Filter to show only tracked exercises
                if (showOnlyTracked) {
                    exercises = exercises.filter(ex => trackedExercises.includes(ex.name));
                }

                return exercises;
            }, [debouncedSearchTerm, categoryFilter, showOnlyTracked, trackedExercises]);

            // Initialize Lucide icons when library view or filters change
            useLucideIcons([selectedExercise, exercisesToShow, categoryFilter, showOnlyTracked]);

            const handleExerciseClick = (exercise) => {
                haptic.tick();
                setSelectedExercise(exercise);
            };

            const handleBack = () => {
                haptic.tick();
                setSelectedExercise(null);
            };

            if (selectedExercise) {
                return <ExerciseDetailView exercise={selectedExercise} onBack={handleBack} />;
            }

            return (
                <div className="px-5 pb-32 pt-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Exercise Library</h2>

                    {/* Search and Filters */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search exercises..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 px-4 bg-sys-surfaceHigh rounded-xl text-white placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-accent transition-all mb-3"
                        />

                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                            {['all', 'pull', 'push', 'legs', 'core', 'cardio', 'skill', 'arms', 'shoulders'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setCategoryFilter(filter)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                        categoryFilter === filter
                                            ? 'bg-sys-accent text-white'
                                            : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                    }`}
                                >
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Show tracked only toggle */}
                        <button
                            onClick={() => setShowOnlyTracked(!showOnlyTracked)}
                            className={`w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                                showOnlyTracked
                                    ? 'bg-sys-success/20 text-sys-success border border-sys-success/30'
                                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar border border-white/5'
                            }`}
                        >
                            <i data-lucide={showOnlyTracked ? "check-square" : "square"} width="18"></i>
                            <span>Show Only Tracked ({trackedExercises.length})</span>
                        </button>
                    </div>

                    {/* Exercise List */}
                    {exercisesToShow.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-3xl border border-white/5 px-6">
                            <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-5">
                                <i data-lucide="search" width="40" className="text-sys-onSurfaceVar"></i>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No Exercises Found</h3>
                            <p className="text-sm text-sys-onSurfaceVar text-center">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {exercisesToShow.map(exercise => {
                                const isTracked = trackedExercises.includes(exercise.name);
                                const stats = isTracked ? calculateExerciseStats(exercise.name) : null;

                                return (
                                    <button
                                        key={exercise.id}
                                        onClick={() => handleExerciseClick(exercise)}
                                        className="w-full bg-sys-surface rounded-2xl p-4 border border-white/5 hover:border-sys-accent/30 transition-all active:scale-[0.98] text-left"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-base font-semibold text-white">{exercise.name}</h4>
                                                    {isTracked && (
                                                        <span className="text-xs px-2 py-0.5 bg-sys-success/20 rounded-full text-sys-success font-bold">
                                                            {stats.totalWorkouts}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-sys-onSurfaceVar mb-2">
                                                    {exercise.primaryMuscles.join(', ')}
                                                </p>
                                                {isTracked && stats && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {stats.maxWeight && (
                                                            <span className="text-xs px-2 py-1 bg-sys-accent/10 rounded-lg text-sys-accent">
                                                                Max: {stats.maxWeight}kg
                                                            </span>
                                                        )}
                                                        {stats.estimated1RM && (
                                                            <span className="text-xs px-2 py-1 bg-sys-accent/10 rounded-lg text-sys-accent">
                                                                Est 1RM: {stats.estimated1RM}kg
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0">
                                                <i data-lucide="chevron-right" width="20" className="text-sys-onSurfaceVar"></i>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        };

        // --- EXERCISE DETAIL VIEW ---
        const ExerciseDetailView = ({ exercise, onBack }) => {
            const [showFullHistory, setShowFullHistory] = useState(false);
            const haptic = useHaptic();
            const history = getExerciseHistory(exercise.name);
            const stats = calculateExerciseStats(exercise.name);

            // Initialize Lucide icons when exercise detail view changes
            useLucideIcons([showFullHistory, history]);

            const displayHistory = showFullHistory ? history : history.slice(-5);

            return (
                <div className="px-5 pb-32 pt-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={onBack}
                            className="h-10 w-10 rounded-xl bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all"
                            aria-label="Go back"
                        >
                            <i data-lucide="arrow-left" width="20"></i>
                        </button>
                        <h2 className="text-2xl font-bold text-white flex-1">{exercise.name}</h2>
                    </div>

                    {/* Exercise Info */}
                    <div className="bg-sys-surface rounded-3xl border border-white/5 p-6 mb-6">
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-2">Primary Muscles</h3>
                            <p className="text-base text-white">{exercise.primaryMuscles.join(', ')}</p>
                        </div>
                        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-2">Secondary Muscles</h3>
                                <p className="text-base text-white">{exercise.secondaryMuscles.join(', ')}</p>
                            </div>
                        )}
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-2">Equipment</h3>
                            <p className="text-base text-white">{exercise.equipment.join(', ')}</p>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-2">Category</h3>
                            <p className="text-base text-white capitalize">{exercise.category}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    {history.length > 0 ? (
                        <>
                            <div className="bg-sys-surface rounded-3xl border border-white/5 p-6 mb-6">
                                <h3 className="text-lg font-bold text-white mb-4">Statistics</h3>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                        <div className="text-xs text-sys-onSurfaceVar mb-1">Total Workouts</div>
                                        <div className="text-2xl font-bold text-white">{stats.totalWorkouts}</div>
                                    </div>
                                    <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                        <div className="text-xs text-sys-onSurfaceVar mb-1">Max Sets</div>
                                        <div className="text-2xl font-bold text-white">{stats.maxSets || 'N/A'}</div>
                                    </div>
                                </div>

                                {stats.maxWeight && (
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                            <div className="text-xs text-sys-onSurfaceVar mb-1">Max Weight</div>
                                            <div className="text-2xl font-bold text-sys-accent">{stats.maxWeight} kg</div>
                                        </div>
                                        {stats.estimated1RM && (
                                            <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                <div className="text-xs text-sys-onSurfaceVar mb-1">Est. 1RM</div>
                                                <div className="text-2xl font-bold text-sys-success">{stats.estimated1RM} kg</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Max Weight by Set Count */}
                                {Object.keys(stats.maxWeightBySets).length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-3">Max Weight by Sets</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {Object.entries(stats.maxWeightBySets)
                                                .sort(([a], [b]) => +a - +b)
                                                .map(([sets, weight]) => (
                                                    <div key={sets} className="bg-sys-surfaceHigh rounded-lg p-3 text-center">
                                                        <div className="text-xs text-sys-onSurfaceVar mb-1">{sets} sets</div>
                                                        <div className="text-base font-bold text-white">{weight}kg</div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* History */}
                            <div className="bg-sys-surface rounded-3xl border border-white/5 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white">History</h3>
                                    {history.length > 5 && (
                                        <button
                                            onClick={() => { haptic.tick(); setShowFullHistory(!showFullHistory); }}
                                            className="text-sm text-sys-accent font-semibold"
                                        >
                                            {showFullHistory ? 'Show Less' : `Show All (${history.length})`}
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {displayHistory.slice().reverse().map((entry, idx) => (
                                        <div key={idx} className="bg-sys-surfaceHigh rounded-xl p-4">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-white">
                                                        {new Date(entry.date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                    <div className="text-xs text-sys-onSurfaceVar">
                                                        Week {entry.week}, Day {entry.day}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-white">
                                                        {entry.sets} sets
                                                    </div>
                                                    {entry.weight && (
                                                        <div className="text-xs text-sys-accent font-semibold">
                                                            {entry.weight} kg
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {entry.prescription && (
                                                <div className="text-xs text-sys-onSurfaceVar">
                                                    {entry.prescription}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-3xl border border-white/5 px-6">
                            <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-5">
                                <i data-lucide="bar-chart-2" width="40" className="text-sys-onSurfaceVar"></i>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No History Yet</h3>
                            <p className="text-sm text-sys-onSurfaceVar text-center max-w-[250px]">
                                Complete workouts with this exercise to see your progress
                            </p>
                        </div>
                    )}
                </div>
            );
        };

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
                            <WorkoutPlayer week={currentWeek} day={activeDay} onComplete={goBack} />
                        </div>
                    ) : (
                        <>
                            <TabContent activeTab={activeTab}>
                                {activeTab === 'train' && <Dashboard currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} onStartWorkout={startWorkout} />}
                                {activeTab === 'library' && <ExerciseLibraryView />}
                                {activeTab === 'history' && <HistoryView />}
                                {activeTab === 'profile' && <SettingsView />}
                            </TabContent>
                            <NavigationBar activeTab={activeTab} onTabChange={handleTabChange} />
                        </>
                    )}
                </div>
            );
        };

        // Loading component to show while fetching data
        const LoadingScreen = () => (
            <div className="min-h-screen bg-sys-black text-white flex items-center justify-center p-5">
                <div className="text-center max-w-md">
                    <div className="mb-6">
                        <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <svg className="w-10 h-10 text-sys-accent animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <div className="text-2xl font-bold mb-2 text-white">Loading...</div>
                        <div className="text-sm text-sys-onSurfaceVar">Loading workout schedule and exercises</div>
                    </div>
                </div>
            </div>
        );

        // Error component for loading failures
        const ErrorScreen = ({ message }) => {
            const handleRetry = () => {
                window.location.reload();
            };

            return (
                <div className="min-h-screen bg-sys-black text-white flex items-center justify-center p-5">
                    <div className="text-center max-w-md">
                        <div className="mb-6">
                            <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div className="text-2xl font-bold mb-2 text-red-500">Failed to Load</div>
                            <div className="text-sm text-sys-onSurfaceVar mb-6">{message}</div>
                            <button
                                onClick={handleRetry}
                                className="h-12 px-6 rounded-xl bg-sys-accent text-white font-semibold active:scale-95 transition-transform"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

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
