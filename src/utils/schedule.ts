/**
 * Schedule Utilities
 *
 * Functions for building and managing the workout schedule.
 */

import type { WeekNumber, TrainingDay } from '../types';
import type { LoadRange } from '../workout-plan-utils';

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
    load?: string;      // Load/weight for weighted exercises (optional)
    loadRange?: LoadRange; // Parsed load range (optional)
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
}

/**
 * Complete workout for a day
 */
export interface Workout {
    title: string;
    sections: WorkoutSection[];
}

/**
 * Training block definition
 */
export interface TrainingBlock {
    id: number;
    name: string;
    weeks: WeekNumber[];
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
 * Build complete schedule with auto-generated warmups and cooldowns.
 *
 * Week 1 has explicit warmup/cooldown in the JSON.
 * For weeks 2-21, this function adds standard warmup/cooldown protocols
 * if not already present. This avoids repeating boilerplate exercises
 * in the schedule JSON.
 */
export function buildCompleteSchedule(): void {
    // Start with all items from RAW_SCHEDULE
    COMPLETE_SCHEDULE = [...RAW_SCHEDULE];

    const add = (w: number, d: number, ex: string, s: number, r: string, n: string): void => {
        COMPLETE_SCHEDULE.push({ w, d, ex, s, r, n });
    };

    // Auto-generate standard warmups/cooldowns for weeks 2-21
    for (let w = 2; w <= 21; w++) {
        // Add standard warmups for pull days (D1/D5) if not already present
        [1, 5].forEach(d => {
            if (!RAW_SCHEDULE.some(i => i.w === w && i.d === d && i.ex.includes('Rower'))) {
                add(w, d, 'Rower (Zone 1)', 1, '2 min', 'Warm-up');
                add(w, d, 'Band Pull-Aparts', 1, '20 reps', 'Warm-up');
                add(w, d, 'Scapular Pull-Ups', 3, '5 reps', 'Warm-up');
            }
        });

        // Add standard cooldown for all training days (D1, D2, D3, D5)
        [1, 2, 3, 5].forEach(d => {
            if (!RAW_SCHEDULE.some(i => i.w === w && i.d === d && i.n?.includes('Cool-down'))) {
                add(w, d, 'Cool-down Protocol', 1, '5 min', 'Cool-down');
            }
        });
    }
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

// ============================================================================
// PROGRAM DATA
// ============================================================================

/**
 * Training blocks for the 21-week program
 */
export const TRAINING_BLOCKS: TrainingBlock[] = [
    { id: 1, name: 'Foundation', weeks: [1, 2, 3, 4] as WeekNumber[] },
    { id: 2, name: 'Intensification', weeks: [5, 6, 7, 8] as WeekNumber[] },
    { id: 3, name: 'Neutral Grip', weeks: [9, 10, 11, 12] as WeekNumber[] },
    { id: 4, name: 'Accumulation', weeks: [13, 14, 15, 16] as WeekNumber[] },
    { id: 5, name: 'Peak & Taper', weeks: [17, 18, 19, 20] as WeekNumber[] },
    { id: 6, name: 'Reload', weeks: [21] as WeekNumber[] },
];

/**
 * Get the training block for a given week
 */
export function getBlockForWeek(week: WeekNumber): TrainingBlock | undefined {
    return TRAINING_BLOCKS.find(b => b.weeks.includes(week));
}
