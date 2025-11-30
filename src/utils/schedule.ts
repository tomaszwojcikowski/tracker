/**
 * Schedule Utilities
 *
 * Functions for building and managing the workout schedule.
 */

import type { WeekNumber, TrainingDay } from '../types';
import type { LoadRange, RepsRange, TempoRange } from '../workout-plan-utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Raw schedule item from JSON
 */
export interface RawScheduleItem {
    w: number;          // Week number
    d: number;          // Day number
    ex: string;         // Exercise name
    s: number;          // Sets
    r: string;          // Reps
    n?: string;         // Notes/Section (optional)
    category?: string;  // Exercise category (warmup, skill, main, accessory, cooldown)
    load?: string;      // Load/weight for weighted exercises (optional)
    loadRange?: LoadRange; // Parsed load range (optional)
    repsRange?: RepsRange; // Parsed reps range (optional)
    tempoRange?: TempoRange; // Parsed tempo range (optional)
    isEmom?: boolean;   // Whether this exercise uses EMOM timing
    isUnilateral?: boolean; // Whether this exercise is performed unilaterally (per side)
    supersetGroup?: number; // Superset group ID
    restSeconds?: number; // Rest between sets in seconds
    alternatives?: string[]; // Array of alternative exercise names
}

/**
 * Section types in a workout
 */
export type SectionType = 'prep' | 'skill' | 'main' | 'access' | 'cool';

/**
 * Workout section with exercises
 */
export interface WorkoutSection {
    title: string;
    exercises: WorkoutExercise[];
}

/**
 * Exercise in a workout
 */
export interface WorkoutExercise {
    id: string;
    name: string;
    sets: number;
    reps: string;
    notes: string;
    rest?: number;
    load?: string;
    loadRange?: LoadRange;
    repsRange?: RepsRange;
    tempoRange?: TempoRange;
}

/**
 * Complete workout for a day
 */
export interface Workout {
    title: string;
    sections: WorkoutSection[];
}

// ============================================================================
// SCHEDULE DATA
// ============================================================================

// Global schedule arrays - populated by data loading
let RAW_SCHEDULE: RawScheduleItem[] = [];
let COMPLETE_SCHEDULE: RawScheduleItem[] = [];

/**
 * Set the raw schedule data (called during app initialization)
 */
export function setRawSchedule(data: RawScheduleItem[]): void {
    RAW_SCHEDULE = data;
}

/**
 * Get the raw schedule data
 */
export function getRawSchedule(): RawScheduleItem[] {
    return RAW_SCHEDULE;
}

/**
 * Get the complete schedule (with auto-generated warmups/cooldowns)
 */
export function getCompleteSchedule(): RawScheduleItem[] {
    return COMPLETE_SCHEDULE;
}

// ============================================================================
// SCHEDULE BUILDING
// ============================================================================

/**
 * Build complete schedule.
 *
 * The workout plan data is now self-contained in the V2 JSON format,
 * so no additional processing or auto-generation of warmups/cooldowns is needed.
 * This function creates a copy of the raw schedule data for use by the rest of the application.
 */
export function buildCompleteSchedule(): void {
    // The schedule is self-contained, so we just use the raw schedule as is
    COMPLETE_SCHEDULE = [...RAW_SCHEDULE];
}

// ============================================================================
// WORKOUT RETRIEVAL
// ============================================================================

/**
 * Section name mapping
 */
const SECTION_MAP: Record<SectionType, string> = {
    prep: 'Warm Up',
    skill: 'Skill',
    main: 'Main Work',
    access: 'Accessory',
    cool: 'Cool Down',
};

/**
 * Map note text to section type
 */
function getSectionType(note: string): SectionType {
    const noteLower = note.toLowerCase();
    if (noteLower.includes('warm') || noteLower.includes('prep')) return 'prep';
    if (noteLower.includes('skill')) return 'skill';
    if (noteLower.includes('cool')) return 'cool';
    if (noteLower.includes('access') || noteLower.includes('supplemental')) return 'access';
    return 'main';
}

/**
 * Get workout data for a specific week and day
 */
export function getWorkout(week: WeekNumber, day: TrainingDay): Workout | null {
    const dayExercises = COMPLETE_SCHEDULE.filter(i => i.w === week && i.d === day);

    if (dayExercises.length === 0) {
        return null;
    }

    const sections: Record<SectionType, WorkoutExercise[]> = {
        prep: [],
        skill: [],
        main: [],
        access: [],
        cool: [],
    };

    dayExercises.forEach(item => {
        const sectionType = getSectionType(item.n ?? '');
        const exercise: WorkoutExercise = {
            id: `${item.ex.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${week}_${day}`,
            name: item.ex,
            sets: item.s,
            reps: item.r,
            notes: item.n ?? '',
            load: item.load,
            loadRange: item.loadRange,
            repsRange: item.repsRange,
            tempoRange: item.tempoRange,
        };
        sections[sectionType].push(exercise);
    });

    const finalSections: WorkoutSection[] = [];
    (Object.keys(SECTION_MAP) as SectionType[]).forEach(key => {
        if (sections[key].length > 0) {
            finalSections.push({
                title: SECTION_MAP[key],
                exercises: sections[key],
            });
        }
    });

    return {
        title: `Week ${week} Day ${day}`,
        sections: finalSections,
    };
}
