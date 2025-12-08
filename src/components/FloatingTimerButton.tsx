/**
 * FloatingTimerButton Component
 *
 * A floating action button that provides quick access to a rest timer.
 * Shows timer icon by default, and countdown when timer is active.
 * Position: bottom-right corner, above the navigation bar.
 */

import React, { useState, useCallback, useRef } from 'react';
import { Timer, X, Plus, Minus } from 'lucide-react';
import { useHaptic, useRestTimer } from '../hooks';
import { FullscreenTimer } from './FullscreenTimer';
import { BottomSheet } from './BottomSheet';

/** Default rest time options in seconds */
const TIMER_PRESETS = [30, 60, 90, 120, 180];
const DEFAULT_REST_TIME = 90;

export interface FloatingTimerButtonProps {
    /** Additional CSS classes */
    className?: string;
}

/**
 * FloatingTimerButton - Quick access timer from any view
 *
 * Features:
 * - Compact FAB when inactive
 * - Shows countdown when timer is running
 * - Quick preset selection (30s, 60s, 90s, 120s, 180s)
 * - Tap to expand fullscreen timer
 */
export const FloatingTimerButton: React.FC<FloatingTimerButtonProps> = ({
    className = '',
}) => {
    const haptic = useHaptic();
    const restTimer = useRestTimer({ haptic });
    const [showPresets, setShowPresets] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [customTime, setCustomTime] = useState(DEFAULT_REST_TIME);
    const [soundEnabled, setSoundEnabled] = useState(true);
    // Track total seconds for progress calculation
    const totalSecondsRef = useRef(0);

    // Format time for display
    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Handle starting timer with preset
    const handleStartTimer = useCallback((seconds: number) => {
        haptic.bump();
        totalSecondsRef.current = seconds;
        restTimer.start(seconds);
        setShowPresets(false);
    }, [haptic, restTimer]);

    // Handle FAB click
    const handleFabClick = useCallback(() => {
        haptic.tick();
        if (restTimer.active) {
            // If timer is running, expand to fullscreen
            setShowFullscreen(true);
        } else {
            // If no timer, show preset selection
            setShowPresets(prev => !prev);
        }
    }, [haptic, restTimer.active]);

    // Handle closing presets
    const handleClosePresets = useCallback(() => {
        haptic.tick();
        setShowPresets(false);
    }, [haptic]);

    // Handle fullscreen controls
    const handleMinimize = useCallback(() => {
        setShowFullscreen(false);
    }, []);

    const handleStopTimer = useCallback(() => {
        haptic.bump();
        restTimer.stop();
        setShowFullscreen(false);
    }, [haptic, restTimer]);

    // Handle add time
    const handleAddTime = useCallback((amount: number) => {
        restTimer.setSeconds(prev => Math.max(0, prev + amount));
        totalSecondsRef.current = Math.max(0, totalSecondsRef.current + amount);
    }, [restTimer]);

    // Toggle sound
    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => !prev);
    }, []);

    // Adjust custom time
    const decreaseTime = useCallback(() => {
        haptic.tick();
        setCustomTime(prev => Math.max(10, prev - 10));
    }, [haptic]);

    const increaseTime = useCallback(() => {
        haptic.tick();
        setCustomTime(prev => Math.min(600, prev + 10));
    }, [haptic]);

    // Calculate urgency state
    const isUrgent = restTimer.active && restTimer.seconds <= 10;
    const isWarning = restTimer.active && restTimer.seconds <= 30 && restTimer.seconds > 10;

    return (
        <>
            {/* Fullscreen Timer Modal */}
            {showFullscreen && restTimer.active && (
                <FullscreenTimer
                    mode="rest"
                    seconds={restTimer.seconds}
                    totalSeconds={totalSecondsRef.current}
                    onStop={handleStopTimer}
                    onAddTime={handleAddTime}
                    onMinimize={handleMinimize}
                    soundEnabled={soundEnabled}
                    onToggleSound={toggleSound}
                />
            )}

            {/* MD3 Bottom Sheet for Timer Presets */}
            <BottomSheet
                isOpen={showPresets && !restTimer.active}
                onClose={handleClosePresets}
                ariaLabel="Quick Timer"
                maxHeight={50}
                showHandle={false}
                className="border-t border-white/10"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-sys-accent/20 flex items-center justify-center">
                                <Timer size={20} className="text-sys-accent" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Quick Timer</h3>
                        </div>
                        <button
                            onClick={handleClosePresets}
                            className="btn-icon bg-sys-surfaceHigh"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Preset Buttons */}
                    <div>
                        <p className="text-sm text-sys-onSurfaceVar mb-3">Quick select</p>
                        <div className="grid grid-cols-5 gap-2">
                            {TIMER_PRESETS.map((seconds) => (
                                <button
                                    key={seconds}
                                    onClick={() => handleStartTimer(seconds)}
                                    className="btn-md3 btn-tonal h-12 rounded-xl text-sm font-medium transition-all active:scale-95"
                                >
                                    {formatTime(seconds)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Timer */}
                    <div>
                        <p className="text-sm text-sys-onSurfaceVar mb-3">Custom duration</p>
                        <div className="flex items-center justify-center gap-4 p-4 bg-sys-surfaceHigh rounded-2xl">
                            <button
                                onClick={decreaseTime}
                                className="btn-icon h-12 w-12 bg-sys-surface border border-white/10"
                                aria-label="Decrease time by 10 seconds"
                            >
                                <Minus size={20} />
                            </button>
                            <div className="min-w-[100px] text-center">
                                <span className="font-mono text-3xl font-bold text-white">
                                    {formatTime(customTime)}
                                </span>
                            </div>
                            <button
                                onClick={increaseTime}
                                className="btn-icon h-12 w-12 bg-sys-surface border border-white/10"
                                aria-label="Increase time by 10 seconds"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={() => handleStartTimer(customTime)}
                        className="btn-md3 btn-filled w-full h-14 rounded-xl text-base font-semibold transition-all active:scale-[0.98]"
                    >
                        Start Timer
                    </button>
                </div>
            </BottomSheet>

            {/* Floating Action Button - MD3 FAB */}
            <button
                onClick={handleFabClick}
                className={`fixed bottom-24 right-4 z-40 flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                    restTimer.active
                        ? isUrgent
                            ? 'bg-error-500 animate-pulse min-w-[80px] h-14 px-4 rounded-2xl gap-2'
                            : isWarning
                            ? 'bg-warning-500 min-w-[80px] h-14 px-4 rounded-2xl gap-2'
                            : 'bg-sys-accent min-w-[80px] h-14 px-4 rounded-2xl gap-2'
                        : 'bg-sys-accent h-14 w-14 rounded-2xl'
                } ${className}`}
                aria-label={
                    restTimer.active
                        ? `Timer: ${formatTime(restTimer.seconds)} remaining. Tap to expand.`
                        : 'Open quick timer'
                }
            >
                {restTimer.active ? (
                    <>
                        <Timer size={18} className={isUrgent ? 'text-white' : 'text-sys-black'} />
                        <span className={`font-mono font-bold text-base ${isUrgent ? 'text-white' : 'text-sys-black'}`}>
                            {formatTime(restTimer.seconds)}
                        </span>
                    </>
                ) : (
                    <Timer size={24} className="text-sys-black" />
                )}
            </button>
        </>
    );
};

export default FloatingTimerButton;
