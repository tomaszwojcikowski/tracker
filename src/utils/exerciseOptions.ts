/**
 * Exercise Options Utilities
 *
 * Functions for working with exercise options (variations of exercises with different parameters)
 */

import type { ExerciseOption } from '../workout-plan-utils';

/**
 * Apply an exercise option to base exercise properties
 * Returns the effective properties after applying the option's overrides
 */
export function applyExerciseOption<T extends Record<string, any>>(
    baseExercise: T,
    option: ExerciseOption
): T {
    return {
        ...baseExercise,
        // Override name if specified
        ...(option.exerciseName && { name: option.exerciseName }),
        // Override sets, reps, load, etc.
        ...(option.sets !== undefined && { sets: option.sets }),
        ...(option.restSeconds !== undefined && { restSeconds: option.restSeconds }),
        ...(option.rpe !== undefined && { rpe: option.rpe }),
        ...(option.notes && { notes: option.notes }),
        ...(option.loadMin !== undefined && { loadMin: option.loadMin }),
        ...(option.loadMax !== undefined && { loadMax: option.loadMax }),
        ...(option.loadUnit && { loadUnit: option.loadUnit }),
        ...(option.loadPerHand !== undefined && { loadPerHand: option.loadPerHand }),
        ...(option.repsType && { repsType: option.repsType }),
        ...(option.repsValue !== undefined && { repsValue: option.repsValue }),
        ...(option.repsMin !== undefined && { repsMin: option.repsMin }),
        ...(option.repsMax !== undefined && { repsMax: option.repsMax }),
        ...(option.repsUnit && { repsUnit: option.repsUnit }),
        ...(option.repsPerSide !== undefined && { repsPerSide: option.repsPerSide }),
    };
}

/**
 * Get the display name for an exercise, considering selected option
 */
export function getExerciseDisplayName(
    baseName: string,
    options: ExerciseOption[] | undefined,
    selectedOptionName: string | undefined
): string {
    if (!options || !selectedOptionName) {
        return baseName;
    }

    const selectedOption = options.find(opt => opt.optionName === selectedOptionName);
    if (!selectedOption) {
        return baseName;
    }

    // Return the option's exercise name if specified, otherwise the base name with option suffix
    if (selectedOption.exerciseName) {
        return selectedOption.exerciseName;
    }

    return `${baseName} (${selectedOption.optionName})`;
}

/**
 * Validate that a selected option exists in the available options
 */
export function validateExerciseOption(
    options: ExerciseOption[] | undefined,
    selectedOptionName: string | undefined
): boolean {
    if (!options || options.length === 0) {
        return true; // No options required
    }

    if (!selectedOptionName) {
        return false; // Options exist but none selected
    }

    return options.some(opt => opt.optionName === selectedOptionName);
}

/**
 * Get a summary of an exercise option for display
 */
export function getExerciseOptionSummary(option: ExerciseOption): string {
    const parts: string[] = [];

    if (option.sets !== undefined) {
        parts.push(`${option.sets} sets`);
    }

    if (option.repsMin !== undefined && option.repsMax !== undefined) {
        parts.push(`${option.repsMin}-${option.repsMax} reps`);
    } else if (option.repsValue !== undefined) {
        if (Array.isArray(option.repsValue)) {
            parts.push(`${option.repsValue.join('-')} ladder`);
        } else {
            parts.push(`${option.repsValue} reps`);
        }
    }

    if (option.loadMin !== undefined && option.loadMax !== undefined && option.loadUnit) {
        if (option.loadMin === option.loadMax) {
            parts.push(`${option.loadMin}${option.loadUnit}`);
        } else {
            parts.push(`${option.loadMin}-${option.loadMax}${option.loadUnit}`);
        }
    } else if (option.loadUnit === 'bodyweight') {
        parts.push('Bodyweight');
    }

    if (option.repsPerSide) {
        parts.push('per side');
    }

    return parts.join(', ');
}

/**
 * Check if an exercise has options that need to be selected
 */
export function exerciseNeedsOptionSelection(
    exerciseOptions: ExerciseOption[] | undefined,
    selectedOption: string | undefined
): boolean {
    // No selection needed if there are no options
    if (!exerciseOptions || exerciseOptions.length === 0) {
        return false;
    }

    // Selection needed if options exist but none is selected
    return !selectedOption;
}

/**
 * Get default option (first option in the list)
 */
export function getDefaultExerciseOption(options: ExerciseOption[] | undefined): string | undefined {
    if (!options || options.length === 0) {
        return undefined;
    }
    return options[0].optionName;
}
