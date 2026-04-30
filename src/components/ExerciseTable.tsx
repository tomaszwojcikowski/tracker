/**
 * ExerciseTable — Strong/Hevy-style per-set logging table.
 *
 * Replaces the dense weight stepper + set-button row + RPE prompt of the
 * original ExerciseCard. One row per set; the next-incomplete row is the
 * "current" focus. Per-set weight & reps live in the
 * `setWeights` / `setReps` arrays on the exercise log entry; both are
 * optional and inherit from the exercise-level `weight` and prescription
 * default reps when absent.
 *
 * Surfaced behind the `set_table` feature flag — see `featureFlags.ts`.
 */

import React, { memo, useCallback, useMemo, useState } from 'react';
import { SetRow } from './SetRow';
import { RPESelector } from './RPESelector';
import { getExerciseHistory } from '../utils/exerciseHistory';
import type { RPEValue } from '../types';
import type { ExerciseLogEntry } from '../types/workout';
import type { HapticFeedback } from '../hooks';

export interface ExerciseTableProps {
    exId: string;
    /** Effective exercise name, used to look up history */
    effectiveName: string;
    sets: boolean[];
    /** Default sets count for the exercise (used when adding a new set) */
    defaultSets: number;
    exerciseLog: ExerciseLogEntry;
    isBodyweight?: boolean;
    /** Programmed prescription (e.g. "3x8 reps") - used to parse default reps */
    prescription?: string;
    haptic: Pick<HapticFeedback, 'tick' | 'bump' | 'success'>;

    onToggleSet: (
        exId: string,
        setIndex: number,
        defaultSets: number,
        restTime?: number,
        sectionType?: string,
        isEmom?: boolean,
    ) => void;
    /** Update per-set weight override. Pass empty string to clear. */
    onSaveSetWeight: (exId: string, setIndex: number, value: string, totalSets: number) => void;
    /** Update per-set rep count. Pass `undefined` to clear. */
    onSaveSetReps: (exId: string, setIndex: number, reps: number | undefined, totalSets: number) => void;
    onSaveRPE: (exId: string, setIndex: number, rpe: RPEValue) => void;

    /** Forwarded to onToggleSet so the parent can fire the rest timer. */
    restTime?: number;
    sectionType?: string;
    isEmom?: boolean;
}

/**
 * Parse "3x8 reps", "3 x 8", "4x5-8" etc. into a default rep count.
 * Returns `undefined` if not parseable.
 */
const parseDefaultReps = (prescription?: string): number | undefined => {
    if (!prescription) return undefined;
    // Match digits-x-digits (with optional spaces / "×" / "X"); take the
    // second integer as the rep target. For ranges like "5-8", take the low end.
    const m = prescription.match(/(\d+)\s*[x×]\s*(\d+)/i);
    if (!m) return undefined;
    const n = Number.parseInt(m[2], 10);
    return Number.isFinite(n) ? n : undefined;
};

const previousFromHistory = (
    historyEntries: ReturnType<typeof getExerciseHistory>,
    setIndex: number,
): string | undefined => {
    if (!historyEntries || historyEntries.length === 0) return undefined;
    // Most recent entry first
    const last = historyEntries[historyEntries.length - 1];
    const w = last.weight != null ? Number(last.weight) : undefined;
    const setsCount = last.sets ?? 0;
    const rpeForSet = last.rpe?.[setIndex];
    if (!w && setsCount === 0) return undefined;
    // We don't have per-set weight history, so use the entry-level weight as
    // the row's "previous" for every set. Reps are derived from sets count if
    // available; otherwise omitted.
    if (w && setsCount) {
        const repsHint = ''; // Per-set rep history not stored; leave blank.
        const rpeHint = rpeForSet ? ` @${rpeForSet}` : '';
        void repsHint;
        return `${w}kg${rpeHint}`;
    }
    if (w) return `${w}kg${rpeForSet ? ` @${rpeForSet}` : ''}`;
    return undefined;
};

const ExerciseTableImpl: React.FC<ExerciseTableProps> = ({
    exId,
    effectiveName,
    sets,
    defaultSets,
    exerciseLog,
    isBodyweight,
    prescription,
    haptic,
    onToggleSet,
    onSaveSetWeight,
    onSaveSetReps,
    onSaveRPE,
    restTime,
    sectionType,
    isEmom,
}) => {
    const [rpePromptIndex, setRpePromptIndex] = useState<number | null>(null);

    const defaultReps = useMemo(() => parseDefaultReps(prescription), [prescription]);

    const history = useMemo(() => {
        if (isBodyweight) return [];
        return getExerciseHistory(effectiveName);
    }, [effectiveName, isBodyweight]);

    const firstIncompleteIndex = useMemo(() => sets.findIndex((s) => !s), [sets]);

    const handleToggleComplete = useCallback(
        (setIndex: number) => {
            haptic.success();
            onToggleSet(exId, setIndex, defaultSets, restTime, sectionType, isEmom);
            // Auto-prompt RPE if completing (not un-completing) and RPE not yet set
            const wasCompleted = sets[setIndex];
            const willBeCompleted = !wasCompleted;
            const rpeAlreadySet = exerciseLog.rpe?.[setIndex];
            if (willBeCompleted && !rpeAlreadySet) {
                setRpePromptIndex(setIndex);
            }
        },
        [haptic, onToggleSet, exId, defaultSets, restTime, sectionType, isEmom, sets, exerciseLog.rpe],
    );

    const totalSets = sets.length;

    const handleWeightChange = useCallback(
        (setIndex: number, value: string) => {
            onSaveSetWeight(exId, setIndex, value, totalSets);
        },
        [exId, onSaveSetWeight, totalSets],
    );

    const handleRepsChange = useCallback(
        (setIndex: number, value: number | undefined) => {
            onSaveSetReps(exId, setIndex, value, totalSets);
        },
        [exId, onSaveSetReps, totalSets],
    );

    const handleRpeSelect = useCallback(
        (rpe: RPEValue) => {
            if (rpePromptIndex == null) return;
            onSaveRPE(exId, rpePromptIndex, rpe);
            haptic.tick();
            setRpePromptIndex(null);
        },
        [rpePromptIndex, onSaveRPE, exId, haptic],
    );

    const inheritedWeightForSet = useCallback(
        (setIndex: number): string | undefined => {
            const override = exerciseLog.setWeights?.[setIndex];
            if (override !== undefined) return override;
            return exerciseLog.weight ?? '';
        },
        [exerciseLog.setWeights, exerciseLog.weight],
    );

    const inheritedRepsForSet = useCallback(
        (setIndex: number): number | undefined => {
            const override = exerciseLog.setReps?.[setIndex];
            if (override !== undefined) return override;
            return defaultReps;
        },
        [exerciseLog.setReps, defaultReps],
    );

    const showWeight = !isBodyweight;

    return (
        <div data-testid="exercise-table" className="flex flex-col gap-1.5">
            {/* Column header — eyebrow, brutalist tracking */}
            <div
                aria-hidden="true"
                className={`grid items-center gap-2 px-2 text-[10px] uppercase tracking-[0.18em] font-bold text-sys-onSurfaceVar ${
                    showWeight
                        ? 'grid-cols-[28px_1fr_minmax(64px,80px)_minmax(56px,64px)_44px_44px]'
                        : 'grid-cols-[28px_1fr_minmax(56px,64px)_44px_44px]'
                }`}
            >
                <span className="text-center">#</span>
                <span>Previous</span>
                {showWeight && <span className="text-center">Kg</span>}
                <span className="text-center">Reps</span>
                <span className="text-center">RPE</span>
                <span className="text-center">✓</span>
            </div>

            {sets.map((completed, idx) => (
                <SetRow
                    key={`${exId}-row-${idx}`}
                    setNumber={idx + 1}
                    completed={completed}
                    isCurrent={idx === firstIncompleteIndex}
                    previousLabel={previousFromHistory(history, idx)}
                    weight={showWeight ? inheritedWeightForSet(idx) : undefined}
                    showWeight={showWeight}
                    reps={inheritedRepsForSet(idx)}
                    rpe={exerciseLog.rpe?.[idx]}
                    onToggleComplete={() => handleToggleComplete(idx)}
                    onChangeWeight={(v) => handleWeightChange(idx, v)}
                    onChangeReps={(v) => handleRepsChange(idx, v)}
                    onTapRpe={() => setRpePromptIndex(idx)}
                />
            ))}

            {/* RPE prompt pinned below the table when active */}
            {rpePromptIndex !== null && (
                <div className="mt-2">
                    <RPESelector
                        value={exerciseLog.rpe?.[rpePromptIndex]}
                        onChange={handleRpeSelect}
                        onSkip={() => setRpePromptIndex(null)}
                        setNumber={rpePromptIndex + 1}
                        showAsPrompt
                    />
                </div>
            )}
        </div>
    );
};

ExerciseTableImpl.displayName = 'ExerciseTable';

export const ExerciseTable = memo(ExerciseTableImpl);
