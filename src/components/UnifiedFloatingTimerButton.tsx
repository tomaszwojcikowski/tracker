/**
 * UnifiedFloatingTimerButton Component
 *
 * A floating action button that provides quick access to multiple timer types:
 * - Rest timer (countdown)
 * - EMOM timer (repeating intervals)
 * - Density timer (countdown for density exercises)
 * - Workout timer (stopwatch for overall workout duration)
 *
 * Features:
 * - Independent timer management (doesn't interfere with workout timers)
 * - Quick access from any view
 * - Visual indicator of active timer type
 * - Fullscreen timer views for each type
 */

import React, { useState, useCallback, useRef } from 'react';
import { Timer, X, Plus, Minus, Clock, Repeat, Zap, Activity } from './icons';
import { useHaptic, useRestTimer, useEmomTimer, useDensityTimer, useWorkoutTimer } from '../hooks';
import { FullscreenTimer } from './FullscreenTimer';
import { BottomSheet } from './BottomSheet';
import { formatSecondsShort } from './TimeBadge';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type TimerType = 'rest' | 'emom' | 'density' | 'workout' | null;

/** Default rest time options in seconds */
const REST_TIMER_PRESETS = [30, 60, 90, 120, 180];
const DEFAULT_REST_TIME = 90;

/** EMOM interval presets in seconds */
const EMOM_INTERVAL_PRESETS = [30, 45, 60, 90, 120];
const DEFAULT_EMOM_INTERVAL = 60;

/** Density time presets in minutes */
const DENSITY_TIME_PRESETS = [5, 8, 10, 12, 15];
const DEFAULT_DENSITY_TIME = 10;

export interface UnifiedFloatingTimerButtonProps {
    /** Additional CSS classes */
    className?: string;
    /** Optional week/day for workout timer (0 means no specific workout) */
    week?: number;
    day?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * UnifiedFloatingTimerButton - Multi-purpose floating timer
 *
 * Provides access to:
 * - Rest timer (countdown)
 * - EMOM timer (interval-based)
 * - Density timer (countdown for reps in time)
 * - Workout timer (stopwatch)
 */
export const UnifiedFloatingTimerButton: React.FC<UnifiedFloatingTimerButtonProps> = ({
    className = '',
    week = 0,
    day = 0,
}) => {
    const haptic = useHaptic();

    // Initialize all timer hooks
    const restTimer = useRestTimer({ haptic });
    const emomTimer = useEmomTimer({ haptic });
    const densityTimer = useDensityTimer({ haptic });
    const workoutTimer = useWorkoutTimer(week, day, false); // Don't auto-start

    // UI state
    const [showTimerSelector, setShowTimerSelector] = useState(false);
    const [isExtended, setIsExtended] = useState(false);
    const [selectorTimerType, setSelectorTimerType] = useState<TimerType>(null);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [activeTimerType, setActiveTimerType] = useState<TimerType>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Custom input states for each timer type
    const [customRestTime, setCustomRestTime] = useState(DEFAULT_REST_TIME);
    const [customEmomInterval, setCustomEmomInterval] = useState(DEFAULT_EMOM_INTERVAL);
    const [customDensityTime, setCustomDensityTime] = useState(DEFAULT_DENSITY_TIME);

    // Density rep tracking state (for standalone timer)
    const [densityRepChunks, setDensityRepChunks] = useState<number[]>([]);
    const [densityTargetReps, setDensityTargetReps] = useState(30);
    const [isDensityComplete, setIsDensityComplete] = useState(false);

    // Track total seconds for progress calculation
    const totalSecondsRef = useRef(0);

    // ========================================================================
    // TIMER TYPE DETECTION
    // ========================================================================

    /**
     * Determine which timer is currently active
     */
    const detectActiveTimer = useCallback((): TimerType => {
        if (restTimer.active && restTimer.seconds > 0) return 'rest';
        if (emomTimer.active) return 'emom';
        if (densityTimer.active) return 'density';
        if (workoutTimer.isRunning) return 'workout';
        return null;
    }, [restTimer.active, restTimer.seconds, emomTimer.active, densityTimer.active, workoutTimer.isRunning]);

    // ========================================================================
    // REST TIMER HANDLERS
    // ========================================================================

    const handleStartRestTimer = useCallback((seconds: number) => {
        haptic.bump();
        totalSecondsRef.current = seconds;
        restTimer.start(seconds);
        setActiveTimerType('rest');
        setShowTimerSelector(false);
        setSelectorTimerType(null);
        setShowFullscreen(true);
    }, [haptic, restTimer]);

    const decreaseRestTime = useCallback(() => {
        haptic.tick();
        setCustomRestTime(prev => Math.max(10, prev - 10));
    }, [haptic]);

    const increaseRestTime = useCallback(() => {
        haptic.tick();
        setCustomRestTime(prev => Math.min(600, prev + 10));
    }, [haptic]);

    // ========================================================================
    // EMOM TIMER HANDLERS
    // ========================================================================

    const handleStartEmomTimer = useCallback(() => {
        haptic.bump();
        emomTimer.start();
        setActiveTimerType('emom');
        setShowTimerSelector(false);
        setSelectorTimerType(null);
        setShowFullscreen(true);
    }, [haptic, emomTimer]);

    const decreaseEmomInterval = useCallback(() => {
        haptic.tick();
        setCustomEmomInterval(prev => Math.max(15, prev - 5));
    }, [haptic]);

    const increaseEmomInterval = useCallback(() => {
        haptic.tick();
        setCustomEmomInterval(prev => Math.min(180, prev + 5));
    }, [haptic]);

    // ========================================================================
    // DENSITY TIMER HANDLERS
    // ========================================================================

    const handleStartDensityTimer = useCallback((minutes: number) => {
        haptic.bump();
        densityTimer.start(minutes);
        totalSecondsRef.current = minutes * 60;
        setActiveTimerType('density');
        setShowTimerSelector(false);
        setSelectorTimerType(null);
        setShowFullscreen(true);

        // Reset reps for a new session
        setDensityRepChunks([]);
        setIsDensityComplete(false);
    }, [haptic, densityTimer]);

    const handleUpdateDensityReps = useCallback((chunks: number[]) => {
        setDensityRepChunks(chunks);
    }, []);

    const handleMarkDensityComplete = useCallback((complete: boolean) => {
        setIsDensityComplete(complete);
    }, []);

    const decreaseDensityTime = useCallback(() => {
        haptic.tick();
        setCustomDensityTime(prev => Math.max(3, prev - 1));
    }, [haptic]);

    const increaseDensityTime = useCallback(() => {
        haptic.tick();
        setCustomDensityTime(prev => Math.min(30, prev + 1));
    }, [haptic]);

    const decreaseDensityReps = useCallback(() => {
        haptic.tick();
        setDensityTargetReps(prev => Math.max(5, prev - 1));
    }, [haptic]);

    const increaseDensityReps = useCallback(() => {
        haptic.tick();
        setDensityTargetReps(prev => Math.min(200, prev + 1));
    }, [haptic]);

    // ========================================================================
    // WORKOUT TIMER HANDLERS
    // ========================================================================

    const handleToggleWorkoutTimer = useCallback(() => {
        haptic.bump();
        if (workoutTimer.isRunning) {
            workoutTimer.pause();
        } else {
            workoutTimer.start();
            setActiveTimerType('workout');
            setShowFullscreen(true);
        }
        setShowTimerSelector(false);
        setSelectorTimerType(null);
    }, [haptic, workoutTimer]);

    // ========================================================================
    // FAB & FULLSCREEN HANDLERS
    // ========================================================================

    const handleFabClick = useCallback(() => {
        haptic.tick();
        const currentlyActive = detectActiveTimer();

        if (currentlyActive) {
            // If a timer is active, expand to fullscreen
            setActiveTimerType(currentlyActive);
            setShowFullscreen(true);
            setIsExtended(false);
        } else {
            // If no timer is active, toggle the extended bar
            setIsExtended(prev => !prev);
        }
    }, [haptic, detectActiveTimer]);

    const handleSelectTimerType = useCallback((type: TimerType) => {
        haptic.bump();
        setSelectorTimerType(type);
        setShowTimerSelector(true);
        setIsExtended(false);
    }, [haptic]);

    const handleCloseSelector = useCallback(() => {
        haptic.tick();
        setShowTimerSelector(false);
        setSelectorTimerType(null);
    }, [haptic]);

    const handleMinimize = useCallback(() => {
        setShowFullscreen(false);
    }, []);

    const handleStopTimer = useCallback(() => {
        haptic.bump();

        // Stop the appropriate timer based on active type
        switch (activeTimerType) {
            case 'rest':
                restTimer.stop();
                restTimer.setSeconds(0);
                totalSecondsRef.current = 0;
                break;
            case 'emom':
                emomTimer.stop();
                break;
            case 'density':
                densityTimer.stop();
                totalSecondsRef.current = 0;
                break;
            case 'workout':
                workoutTimer.stop();
                break;
        }

        setActiveTimerType(null);
        setShowFullscreen(false);
    }, [haptic, activeTimerType, restTimer, emomTimer, densityTimer, workoutTimer]);

    const handleAddTime = useCallback((amount: number) => {
        if (activeTimerType === 'rest') {
            restTimer.setSeconds(prev => Math.max(0, prev + amount));
            totalSecondsRef.current = Math.max(0, totalSecondsRef.current + amount);
        } else if (activeTimerType === 'density') {
            densityTimer.setSeconds(prev => Math.max(0, prev + amount));
            totalSecondsRef.current = Math.max(0, totalSecondsRef.current + amount);
        }
    }, [activeTimerType, restTimer, densityTimer]);

    const handleAdjustInterval = useCallback((amount: number) => {
        if (activeTimerType === 'emom') {
            emomTimer.setIntervalState(prev => Math.max(10, Math.min(180, prev + amount)));
        }
    }, [activeTimerType, emomTimer]);

    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => !prev);
    }, []);

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    /**
     * Get the current active timer's display info
     */
    const getActiveTimerInfo = () => {
        const type = detectActiveTimer();

        switch (type) {
            case 'rest':
                return {
                    seconds: restTimer.seconds,
                    label: formatSecondsShort(restTimer.seconds),
                    isUrgent: restTimer.seconds <= 10,
                    isWarning: restTimer.seconds <= 30 && restTimer.seconds > 10,
                };
            case 'emom':
                return {
                    seconds: emomTimer.seconds,
                    label: `R${emomTimer.round}`,
                    isUrgent: false,
                    isWarning: emomTimer.seconds <= 10,
                };
            case 'density':
                return {
                    seconds: densityTimer.seconds,
                    label: formatSecondsShort(densityTimer.seconds),
                    isUrgent: densityTimer.seconds <= 10,
                    isWarning: densityTimer.seconds <= 30 && densityTimer.seconds > 10,
                };
            case 'workout':
                return {
                    seconds: workoutTimer.elapsedSeconds,
                    label: workoutTimer.formattedTime,
                    isUrgent: false,
                    isWarning: false,
                };
            default:
                return null;
        }
    };

    const activeInfo = getActiveTimerInfo();

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <>
            {/* Fullscreen Timer Modal */}
            {showFullscreen && activeTimerType && (
                <FullscreenTimer
                    mode={activeTimerType === 'workout' ? 'rest' : activeTimerType} // workout timer uses rest mode display
                    seconds={
                        activeTimerType === 'rest' ? restTimer.seconds :
                        activeTimerType === 'emom' ? emomTimer.seconds :
                        activeTimerType === 'density' ? densityTimer.seconds :
                        workoutTimer.elapsedSeconds
                    }
                    totalSeconds={
                        activeTimerType === 'rest' ? totalSecondsRef.current :
                        activeTimerType === 'emom' ? emomTimer.interval :
                        activeTimerType === 'density' ? totalSecondsRef.current :
                        workoutTimer.elapsedSeconds
                    }
                    round={activeTimerType === 'emom' ? emomTimer.round : undefined}
                    onStop={handleStopTimer}
                    onAddTime={handleAddTime}
                    onMinimize={handleMinimize}
                    onAdjustInterval={activeTimerType === 'emom' ? handleAdjustInterval : undefined}
                    isPaused={
                        activeTimerType === 'rest' ? !restTimer.active :
                        activeTimerType === 'emom' ? !emomTimer.active :
                        activeTimerType === 'density' ? !densityTimer.active :
                        !workoutTimer.isRunning
                    }
                    onTogglePause={
                        activeTimerType === 'rest' ? () => restTimer.setActive(prev => !prev) :
                        activeTimerType === 'emom' ? () => emomTimer.setActive(prev => !prev) :
                        activeTimerType === 'density' ? () => densityTimer.setActive(prev => !prev) :
                        workoutTimer.toggle
                    }
                    soundEnabled={soundEnabled}
                    onToggleSound={toggleSound}
                    densityRepControls={
                        activeTimerType === 'density' ? {
                            targetReps: densityTargetReps,
                            repChunks: densityRepChunks,
                            isComplete: isDensityComplete,
                            onUpdateRepChunks: handleUpdateDensityReps,
                            onMarkComplete: handleMarkDensityComplete,
                        } : undefined
                    }
                />
            )}

            {/* Timer Selector Bottom Sheet */}
            <BottomSheet
                isOpen={showTimerSelector}
                onClose={handleCloseSelector}
                ariaLabel="Select Timer Type"
                maxHeight={85}
                showHandle={true}
            >
                <div className="px-6 pt-2 pb-4 space-y-3">
                    <div className="divider divider-full-width" aria-hidden="true" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-sys-primary/20 flex items-center justify-center">
                                <Timer size={20} className="text-sys-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-sys-onSurface">
                                {selectorTimerType === 'rest' ? 'Rest Timer' :
                                 selectorTimerType === 'emom' ? 'EMOM Timer' :
                                 selectorTimerType === 'density' ? 'Density Timer' :
                                 selectorTimerType === 'workout' ? 'Workout Timer' :
                                 'Select Timer'}
                            </h3>
                        </div>
                        <button
                            onClick={handleCloseSelector}
                            className="btn-icon h-12 w-12 bg-sys-surfaceContainerHigh"
                            aria-label="Close"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-6 safe-pb">
                    {/* Rest Timer Section */}
                    {(!selectorTimerType || selectorTimerType === 'rest') && (
                        <div className="space-y-3">
                            {!selectorTimerType && (
                                <div className="flex items-center gap-2">
                                    <Timer size={18} className="text-sys-primary" />
                                    <h4 className="text-base font-semibold text-sys-onSurface">Rest Timer</h4>
                                </div>
                            )}

                            {/* Quick presets */}
                            <div className="grid grid-cols-5 gap-2">
                                {REST_TIMER_PRESETS.map((seconds) => (
                                    <button
                                        key={seconds}
                                        onClick={() => handleStartRestTimer(seconds)}
                                        className="btn-md3 btn-tonal h-11 rounded-xl text-sm font-medium transition-all active:scale-95"
                                    >
                                        {formatSecondsShort(seconds)}
                                    </button>
                                ))}
                            </div>

                            {/* Custom time */}
                            <div className="flex items-center justify-between gap-3 p-3 bg-sys-surfaceContainerHigh rounded-xl">
                                <button
                                    onClick={decreaseRestTime}
                                    className="btn-icon h-10 w-10 bg-sys-surface border border-sys-outlineVariant"
                                    aria-label="Decrease time by 10 seconds"
                                >
                                    <Minus size={18} />
                                </button>
                                <div className="flex-1 text-center">
                                    <span className="font-mono text-2xl font-bold text-sys-onSurface">
                                        {formatSecondsShort(customRestTime)}
                                    </span>
                                </div>
                                <button
                                    onClick={increaseRestTime}
                                    className="btn-icon h-10 w-10 bg-sys-surface border border-sys-outlineVariant"
                                    aria-label="Increase time by 10 seconds"
                                >
                                    <Plus size={18} />
                                </button>
                                <button
                                    onClick={() => handleStartRestTimer(customRestTime)}
                                    className="btn-md3 btn-filled h-10 px-6 rounded-xl text-sm font-semibold"
                                >
                                    Start
                                </button>
                            </div>
                        </div>
                    )}

                    {(!selectorTimerType || selectorTimerType === 'rest') && selectorTimerType !== 'rest' && (
                        <div className="divider" aria-hidden="true" />
                    )}

                    {/* EMOM Timer Section */}
                    {(!selectorTimerType || selectorTimerType === 'emom') && (
                        <div className="space-y-3">
                            {!selectorTimerType && (
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-sys-primary" />
                                    <h4 className="text-base font-semibold text-sys-onSurface">EMOM Timer</h4>
                                </div>
                            )}

                            {/* Quick presets */}
                            <div className="grid grid-cols-5 gap-2">
                                {EMOM_INTERVAL_PRESETS.map((seconds) => (
                                    <button
                                        key={seconds}
                                        onClick={() => {
                                            emomTimer.setIntervalState(seconds);
                                            handleStartEmomTimer();
                                        }}
                                        className="btn-md3 btn-tonal h-11 rounded-xl text-sm font-medium transition-all active:scale-95"
                                    >
                                        {formatSecondsShort(seconds)}
                                    </button>
                                ))}
                            </div>

                            {/* Custom interval */}
                            <div className="flex items-center justify-between gap-3 p-3 bg-sys-surfaceContainerHigh rounded-xl">
                                <button
                                    onClick={decreaseEmomInterval}
                                    className="btn-icon h-10 w-10 bg-sys-surface border border-sys-outlineVariant"
                                    aria-label="Decrease interval by 5 seconds"
                                >
                                    <Minus size={18} />
                                </button>
                                <div className="flex-1 text-center">
                                    <span className="font-mono text-2xl font-bold text-sys-onSurface">
                                        {formatSecondsShort(customEmomInterval)}
                                    </span>
                                </div>
                                <button
                                    onClick={increaseEmomInterval}
                                    className="btn-icon h-10 w-10 bg-sys-surface border border-sys-outlineVariant"
                                    aria-label="Increase interval by 5 seconds"
                                >
                                    <Plus size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        emomTimer.setIntervalState(customEmomInterval);
                                        handleStartEmomTimer();
                                    }}
                                    className="btn-md3 btn-filled h-10 px-6 rounded-xl text-sm font-semibold"
                                >
                                    Start
                                </button>
                            </div>
                        </div>
                    )}

                    {(!selectorTimerType || selectorTimerType === 'emom') && selectorTimerType !== 'emom' && (
                        <div className="divider" aria-hidden="true" />
                    )}

                    {/* Density Timer Section */}
                    {(!selectorTimerType || selectorTimerType === 'density') && (
                        <div className="space-y-3">
                            {!selectorTimerType && (
                                <div className="flex items-center gap-2">
                                    <Timer size={18} className="text-sys-primary" />
                                    <h4 className="text-base font-semibold text-sys-onSurface">Density Timer</h4>
                                </div>
                            )}

                            {/* Quick presets */}
                            <div className="grid grid-cols-5 gap-2">
                                {DENSITY_TIME_PRESETS.map((minutes) => (
                                    <button
                                        key={minutes}
                                        onClick={() => handleStartDensityTimer(minutes)}
                                        className="btn-md3 btn-tonal h-11 rounded-xl text-sm font-medium transition-all active:scale-95"
                                    >
                                        {minutes}m
                                    </button>
                                ))}
                            </div>

                            {/* Target Reps */}
                            <div className="flex items-center justify-between gap-3 px-1 border-y border-sys-outlineVariant/20 py-2">
                                <span className="text-sm font-medium text-sys-onSurfaceVariant">Target Reps</span>
                                <div className="flex items-center gap-3 bg-sys-surfaceContainerHigh p-1.5 rounded-xl border border-sys-outlineVariant">
                                    <button
                                        onClick={decreaseDensityReps}
                                        className="btn-icon h-8 w-8 bg-sys-surface"
                                        aria-label="Decrease target reps"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="font-mono text-lg font-bold text-sys-onSurface min-w-[3ch] text-center">
                                        {densityTargetReps}
                                    </span>
                                    <button
                                        onClick={increaseDensityReps}
                                        className="btn-icon h-8 w-8 bg-sys-surface"
                                        aria-label="Increase target reps"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Custom time */}
                            <div className="flex items-center justify-between gap-3 p-3 bg-sys-surfaceContainerHigh rounded-xl">
                                <button
                                    onClick={decreaseDensityTime}
                                    className="btn-icon h-10 w-10 bg-sys-surface border border-sys-outlineVariant"
                                    aria-label="Decrease time by 1 minute"
                                >
                                    <Minus size={18} />
                                </button>
                                <div className="flex-1 text-center">
                                    <span className="font-mono text-2xl font-bold text-sys-onSurface">
                                        {customDensityTime}m
                                    </span>
                                </div>
                                <button
                                    onClick={increaseDensityTime}
                                    className="btn-icon h-10 w-10 bg-sys-surface border border-sys-outlineVariant"
                                    aria-label="Increase time by 1 minute"
                                >
                                    <Plus size={18} />
                                </button>
                                <button
                                    onClick={() => handleStartDensityTimer(customDensityTime)}
                                    className="btn-md3 btn-filled h-10 px-6 rounded-xl text-sm font-semibold"
                                >
                                    Start
                                </button>
                            </div>
                        </div>
                    )}

                    {(!selectorTimerType || selectorTimerType === 'density') && selectorTimerType !== 'density' && (
                        <div className="divider" aria-hidden="true" />
                    )}

                    {/* Workout Timer Section */}
                    {(!selectorTimerType || selectorTimerType === 'workout') && (
                        <div className="space-y-3">
                            {!selectorTimerType && (
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-sys-primary" />
                                    <h4 className="text-base font-semibold text-sys-onSurface">Workout Timer</h4>
                                </div>
                            )}

                            <button
                                onClick={handleToggleWorkoutTimer}
                                className="btn-md3 btn-filled w-full h-12 rounded-xl text-base font-semibold transition-all active:scale-[0.98]"
                            >
                                {workoutTimer.isRunning ? `Stop (${workoutTimer.formattedTime})` : 'Start Workout Timer'}
                            </button>
                        </div>
                    )}
                </div>
            </BottomSheet>

            {/* Extended Timer Bar */}
            {isExtended && !activeInfo && (
                <div className="fixed bottom-24 right-20 z-40 flex items-center bg-sys-surfaceContainerHigh rounded-2xl p-1.5 shadow-xl border border-sys-outlineVariant animate-in fade-in slide-in-from-right-4 duration-200">
                    <button
                        onClick={() => handleSelectTimerType('rest')}
                        className="btn-icon h-11 w-11 bg-transparent hover:bg-sys-surfaceVariant rounded-xl transition-colors"
                        aria-label="Rest Timer"
                    >
                        <Timer size={20} className="text-sys-primary" />
                    </button>
                    <button
                        onClick={() => handleSelectTimerType('emom')}
                        className="btn-icon h-11 w-11 bg-transparent hover:bg-sys-surfaceVariant rounded-xl transition-colors"
                        aria-label="EMOM Timer"
                    >
                        <Repeat size={20} className="text-sys-secondary" />
                    </button>
                    <button
                        onClick={() => handleSelectTimerType('density')}
                        className="btn-icon h-11 w-11 bg-transparent hover:bg-sys-surfaceVariant rounded-xl transition-colors"
                        aria-label="Density Timer"
                    >
                        <Zap size={20} className="text-sys-tertiary" />
                    </button>
                    <button
                        onClick={() => handleSelectTimerType('workout')}
                        className="btn-icon h-11 w-11 bg-transparent hover:bg-sys-surfaceVariant rounded-xl transition-colors"
                        aria-label="Workout Timer"
                    >
                        <Activity size={20} className="text-sys-onSurfaceVariant" />
                    </button>
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={handleFabClick}
                className={`fixed bottom-24 right-4 z-40 flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                    activeInfo
                        ? activeInfo.isUrgent
                            ? 'bg-sys-error animate-pulse min-w-[80px] h-14 px-4 rounded-2xl gap-2'
                            : activeInfo.isWarning
                            ? 'bg-sys-warning min-w-[80px] h-14 px-4 rounded-2xl gap-2'
                            : 'bg-sys-primary min-w-[80px] h-14 px-4 rounded-2xl gap-2'
                        : isExtended
                        ? 'bg-sys-surfaceContainerHigh h-14 w-14 rounded-2xl border border-sys-outlineVariant'
                        : 'bg-sys-primary h-14 w-14 rounded-2xl'
                } ${className}`}
                aria-label={
                    activeInfo
                        ? `${activeTimerType} timer: ${activeInfo.label}. Tap to expand.`
                        : isExtended
                        ? 'Close timer options'
                        : 'Open timer options'
                }
            >
                {activeInfo ? (
                    <>
                        <Timer size={18} className={activeInfo.isUrgent ? 'text-sys-onError' : 'text-sys-onPrimary'} />
                        <span className={`font-mono font-bold text-base ${activeInfo.isUrgent ? 'text-sys-onError' : 'text-sys-onPrimary'}`}>
                            {activeInfo.label}
                        </span>
                    </>
                ) : isExtended ? (
                    <X size={24} className="text-sys-onSurface" />
                ) : (
                    <Timer size={24} className="text-sys-onPrimary" />
                )}
            </button>
        </>
    );
};
