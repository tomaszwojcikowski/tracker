/**
 * DensityRepControls Component
 *
 * Rep tracking controls for density exercises where users complete a target
 * number of reps within a time limit (e.g., 30 reps in 10 minutes).
 * Users can add rep chunks, see their progress, and mark as complete.
 */

import { useState, useCallback, useEffect } from 'react';
import { Plus, Minus, Check } from './icons';
import type { HapticFeedback } from '../hooks';

export interface DensityRepControlsProps {
    /** Total target reps for this density exercise */
    targetReps: number;
    /** Current rep chunks (e.g., [5, 3, 4] = 12 total) */
    repChunks: number[];
    /** Whether marked as complete */
    isComplete: boolean;
    /** Whether this is the first incomplete exercise */
    isFirstIncomplete?: boolean;
    /** Haptic feedback interface */
    haptic: Pick<HapticFeedback, 'tick' | 'bump' | 'success'>;
    /** Callback to update rep chunks */
    onUpdateRepChunks: (chunks: number[]) => void;
    /** Callback to mark as complete */
    onMarkComplete: (complete: boolean) => void;
}

export const DensityRepControls = ({
    targetReps,
    repChunks,
    isComplete,
    isFirstIncomplete: _isFirstIncomplete = false,
    haptic,
    onUpdateRepChunks,
    onMarkComplete,
}: DensityRepControlsProps) => {
    const [chunkInput, setChunkInput] = useState('');

    // Calculate total reps from chunks
    const totalReps = repChunks.reduce((sum, chunk) => sum + chunk, 0);
    const progressPercent = Math.min(100, (totalReps / targetReps) * 100);
    const allRepsComplete = totalReps >= targetReps;

    // Auto-mark complete if all reps are done
    useEffect(() => {
        if (allRepsComplete && !isComplete) {
            onMarkComplete(true);
        }
    }, [allRepsComplete, isComplete, onMarkComplete]);

    const handleAddChunk = useCallback(() => {
        const value = parseInt(chunkInput, 10);
        if (isNaN(value) || value <= 0) return;

        haptic.tick();
        onUpdateRepChunks([...repChunks, value]);
        setChunkInput('');
    }, [chunkInput, repChunks, haptic, onUpdateRepChunks]);

    const handleRemoveChunk = useCallback((index: number) => {
        haptic.tick();
        onUpdateRepChunks(repChunks.filter((_, i) => i !== index));
    }, [repChunks, haptic, onUpdateRepChunks]);

    const handleToggleComplete = useCallback(() => {
        haptic.bump();
        onMarkComplete(!isComplete);
    }, [isComplete, haptic, onMarkComplete]);

    const handleQuickAdd = useCallback((amount: number) => {
        haptic.tick();
        onUpdateRepChunks([...repChunks, amount]);
    }, [repChunks, haptic, onUpdateRepChunks]);

    return (
        <div className="space-y-2.5">
            {/* Progress Bar - More compact with glow */}
            <div className="relative">
                <div className="h-2 bg-sys-surfaceHigh rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${
                            allRepsComplete
                                ? 'bg-sys-success shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="flex justify-between items-center mt-0.5">
                    <span className="text-xs text-sys-onSurfaceVar font-semibold">
                        {totalReps} / {targetReps} reps
                    </span>
                    <span className={`text-xs font-bold ${
                        allRepsComplete ? 'text-sys-success' : 'text-cyan-400'
                    }`}>
                        {Math.round(progressPercent)}%
                    </span>
                </div>
            </div>

            {/* Quick Add Buttons - Prominent position */}
            <div className="flex gap-2">
                <button
                    onClick={() => handleQuickAdd(1)}
                    className="flex-1 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-bold active:scale-95 active:bg-cyan-500/20 transition-all"
                    aria-label="Add 1 rep"
                >
                    +1
                </button>
                <button
                    onClick={() => handleQuickAdd(3)}
                    className="flex-1 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-bold active:scale-95 active:bg-cyan-500/20 transition-all"
                    aria-label="Add 3 reps"
                >
                    +3
                </button>
                <button
                    onClick={() => handleQuickAdd(5)}
                    className="flex-1 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-bold active:scale-95 active:bg-cyan-500/20 transition-all"
                    aria-label="Add 5 reps"
                >
                    +5
                </button>
            </div>

            {/* Custom Amount Input - More compact */}
            <div className="flex gap-2">
                <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    enterKeyHint="done"
                    value={chunkInput}
                    onChange={(e) => setChunkInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChunk();
                        }
                    }}
                    placeholder="Custom"
                    className="flex-1 h-8 px-3 bg-sys-surfaceHigh rounded-lg text-white text-sm font-medium outline-none focus:ring-2 focus:ring-cyan-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                    onClick={handleAddChunk}
                    disabled={!chunkInput || parseInt(chunkInput, 10) <= 0}
                    className="h-8 px-3 rounded-lg bg-cyan-500 text-white font-medium flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                    aria-label="Add custom rep count"
                >
                    <Plus size={14} />
                    Add
                </button>
            </div>

            {/* Rep Chunk List - Always visible when chunks exist */}
            {repChunks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {repChunks.map((chunk, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-2 py-1 shadow-[0_0_4px_rgba(6,182,212,0.2)]"
                        >
                            <span className="text-sm font-bold text-cyan-400">
                                {chunk}
                            </span>
                            <button
                                onClick={() => handleRemoveChunk(index)}
                                className="h-4 w-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all"
                                aria-label={`Remove ${chunk} reps`}
                            >
                                <Minus size={10} className="text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Mark Complete Button - Matches "Complete All Sets" style */}
            <button
                onClick={handleToggleComplete}
                className={`w-full h-8 rounded-lg flex items-center justify-center gap-1.5 font-medium text-sm transition-all active:scale-[0.98] ${
                    isComplete
                        ? 'bg-sys-success text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : allRepsComplete
                        ? 'bg-cyan-500 text-white shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                }`}
                aria-label={isComplete ? 'Mark as incomplete' : 'Mark as complete'}
            >
                {isComplete ? (
                    <>
                        <Check size={14} />
                        <span>Completed</span>
                    </>
                ) : allRepsComplete ? (
                    <>
                        <Check size={14} />
                        <span>Mark Complete</span>
                    </>
                ) : (
                    <>
                        <Check size={14} />
                        <span>Mark Complete</span>
                    </>
                )}
            </button>
        </div>
    );
};
