/**
 * SetRow — single row in the v3 ExerciseTable.
 *
 * Columns: SET # | PREVIOUS | KG | REPS | ✓
 *
 * Pure presentational component. All persistence is delegated upward.
 *
 * UX contract:
 *  - Tapping the checkmark toggles set completion (the primary action).
 *  - Weight and reps are inline numeric inputs (`inputMode="decimal"` /
 *    `"numeric"`). Long-press the value to nudge ±2.5 / ±1 (handled by parent).
 *  - The active row (next-incomplete) gets a 2px primary border ("you are here").
 *  - Completed rows render at 60% opacity with line-through-style strikeout
 *    on the rep column.
 */

import React, { memo, useCallback, useMemo, useState } from 'react';
import { Check } from './icons';

export interface SetRowProps {
    /** 1-based display index */
    setNumber: number;
    /** Whether this set is marked complete */
    completed: boolean;
    /** Whether this is the next-incomplete row (the "current" row) */
    isCurrent: boolean;
    /** "Previous" hint — last session's value for this set, e.g. "60×8 @8" */
    previousLabel?: string;
    /** Current weight string for this set (may inherit from exercise default) */
    weight?: string;
    /** Whether to render the weight column (false for bodyweight exercises) */
    showWeight: boolean;
    /** Current reps for this set (may inherit from prescription default) */
    reps?: number;
    /** Disable interactions (e.g. while saving) */
    disabled?: boolean;

    onToggleComplete: () => void;
    onChangeWeight: (value: string) => void;
    onChangeReps: (value: number | undefined) => void;
}

const SetRowImpl: React.FC<SetRowProps> = ({
    setNumber,
    completed,
    isCurrent,
    previousLabel,
    weight,
    showWeight,
    reps,
    disabled,
    onToggleComplete,
    onChangeWeight,
    onChangeReps,
}) => {
    // Local mirrors so we can keep input cursor stable while typing
    const [weightDraft, setWeightDraft] = useState<string>(weight ?? '');
    const [repsDraft, setRepsDraft] = useState<string>(
        reps != null ? String(reps) : ''
    );

    // Sync down when prop changes (e.g. set inherits a new exercise default)
    React.useEffect(() => {
        setWeightDraft(weight ?? '');
    }, [weight]);
    React.useEffect(() => {
        setRepsDraft(reps != null ? String(reps) : '');
    }, [reps]);

    const handleWeightChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value;
            setWeightDraft(v);
            onChangeWeight(v);
        },
        [onChangeWeight]
    );

    const handleRepsChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value;
            setRepsDraft(v);
            const trimmed = v.trim();
            if (trimmed === '') {
                onChangeReps(undefined);
                return;
            }
            const n = Number.parseInt(trimmed, 10);
            if (Number.isFinite(n) && n >= 0) {
                onChangeReps(n);
            }
        },
        [onChangeReps]
    );

    const rowClasses = useMemo(() => {
        const base =
            'grid items-center gap-2 px-2 py-2 rounded-md text-sys-onSurface transition-all';
        if (completed) {
            return `${base} opacity-60 bg-sys-surface`;
        }
        if (isCurrent) {
            return `${base} bg-sys-surfaceContainerHigh ring-2 ring-sys-primary`;
        }
        return `${base} bg-sys-surface hover:bg-sys-surfaceContainerLow`;
    }, [completed, isCurrent]);

    const gridTemplate = showWeight
        ? 'grid-cols-[28px_1fr_minmax(64px,80px)_minmax(56px,64px)_44px]'
        : 'grid-cols-[28px_1fr_minmax(56px,64px)_44px]';

    const inputClass =
        'w-full h-10 px-1 bg-sys-surfaceContainerHigh rounded text-center text-base font-bold text-mono-stat outline-none focus:ring-2 focus:ring-sys-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50';

    return (
        <div
            data-testid="set-row"
            data-set-number={setNumber}
            data-completed={completed ? 'true' : 'false'}
            data-current={isCurrent ? 'true' : 'false'}
            className={`${rowClasses} ${gridTemplate}`}
        >
            {/* Set number */}
            <span
                aria-hidden="true"
                className="text-xs font-bold text-sys-onSurfaceVar text-mono-stat tabular-nums text-center"
            >
                {setNumber}
            </span>

            {/* Previous hint */}
            <span className="text-xs text-sys-onSurfaceVar text-mono-stat tabular-nums truncate">
                {previousLabel ?? '—'}
            </span>

            {/* Weight input */}
            {showWeight && (
                <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    enterKeyHint="next"
                    step="0.5"
                    min="0"
                    value={weightDraft}
                    placeholder="kg"
                    disabled={disabled}
                    onChange={handleWeightChange}
                    onFocus={(e) => e.currentTarget.select()}
                    className={inputClass}
                    aria-label={`Set ${setNumber} weight in kilograms`}
                />
            )}

            {/* Reps input */}
            <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="done"
                min="0"
                value={repsDraft}
                placeholder="reps"
                disabled={disabled}
                onChange={handleRepsChange}
                onFocus={(e) => e.currentTarget.select()}
                className={inputClass}
                aria-label={`Set ${setNumber} reps`}
            />

            {/* Complete checkmark — primary action */}
            <button
                type="button"
                onClick={onToggleComplete}
                disabled={disabled}
                aria-pressed={completed}
                aria-label={completed ? `Set ${setNumber} completed, undo` : `Mark set ${setNumber} complete`}
                className={`h-10 w-11 rounded flex items-center justify-center transition-all active:scale-90 ${
                    completed
                        ? 'bg-sys-onSurface text-sys-surface'
                        : isCurrent
                          ? 'bg-sys-primary text-sys-onPrimary'
                          : 'bg-sys-surfaceContainerHigh text-sys-onSurfaceVar border border-sys-outlineVariant'
                }`}
            >
                {completed ? <Check size={18} strokeWidth={3} /> : ''}
            </button>
        </div>
    );
};

SetRowImpl.displayName = 'SetRow';

export const SetRow = memo(SetRowImpl);
