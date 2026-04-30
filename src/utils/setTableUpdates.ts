/**
 * Pure helpers for the v3 set-table per-set arrays.
 *
 * Used by `WorkoutPlayer` and `FocusView` when persisting per-set weight or
 * rep overrides. Extracted so the copy-forward / clear behaviour is unit
 * testable without mounting the full workout view.
 */

/**
 * Build an updated `setWeights` array for a single-set edit.
 *
 * Behaviour:
 *  - The array is padded with `undefined` to match `totalSets`.
 *  - An empty string clears only the target index (does NOT cascade).
 *  - A non-empty value writes to the target index and ALSO copies forward
 *    to subsequent rows that are not-yet-completed AND were either:
 *      a) not yet overridden (`undefined`), or
 *      b) still tracking the edited row (their value equals the edited
 *         row's *previous* value — i.e. they got there via an earlier
 *         cascade and haven't been individually changed since).
 *    This keeps the cascade alive across multi-keystroke edits like "5"→"50".
 */
export const computeSetWeightsUpdate = (
    current: readonly (string | undefined)[] | undefined,
    sets: readonly boolean[] | undefined,
    setIndex: number,
    value: string,
    totalSets: number,
): (string | undefined)[] => {
    const next: (string | undefined)[] = [...(current ?? [])];
    while (next.length < totalSets) next.push(undefined);
    const previousValue = next[setIndex];
    const cleared = value === '';
    next[setIndex] = cleared ? undefined : value;
    if (!cleared) {
        const completion = sets ?? [];
        for (let j = setIndex + 1; j < next.length; j++) {
            if (completion[j]) continue;
            const isUntouched = next[j] === undefined;
            const isTrackingPrior =
                previousValue !== undefined && next[j] === previousValue;
            if (isUntouched || isTrackingPrior) {
                next[j] = value;
            }
        }
    }
    return next;
};

/**
 * Build an updated `setReps` array for a single-set edit.
 *
 * Reps do NOT copy forward — each set's reps are typically logged
 * individually after the set is performed.
 */
export const computeSetRepsUpdate = (
    current: readonly (number | undefined)[] | undefined,
    setIndex: number,
    reps: number | undefined,
    totalSets: number,
): (number | undefined)[] => {
    const next: (number | undefined)[] = [...(current ?? [])];
    while (next.length < totalSets) next.push(undefined);
    next[setIndex] = reps;
    return next;
};
