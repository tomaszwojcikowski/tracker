/**
 * Schedule Utilities
 *
 * Functions for building and managing the workout schedule.
 * Supports multiple programs by storing schedules in a Map keyed by program ID.
 */

import type { WeekNumber, TrainingDay } from '../types';
import type { LoadRange, RepsRange, TempoRange, ExerciseOption } from '../workout-plan-utils';
import { DEFAULT_PROGRAM_ID } from '../services/programRegistry';

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
    exerciseOptions?: ExerciseOption[]; // Array of exercise options to choose from
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
    exerciseOptions?: ExerciseOption[];
}

/**
 * Complete workout for a day
 */
export interface Workout {
    title: string;
    sections: WorkoutSection[];
}

/**
 * Schedule data for a program
 */
interface ProgramScheduleData {
    raw: RawScheduleItem[];
    complete: RawScheduleItem[];
}

// ============================================================================
// SCHEDULE DATA BY PROGRAM
// ============================================================================

/**
 * Map of program ID to schedule data
 */
const SCHEDULE_BY_PROGRAM: Map<string, ProgramScheduleData> = new Map();

/**
 * Current active program ID
 */
let currentProgramId: string = DEFAULT_PROGRAM_ID;

/**
 * Set the active program for schedule access
 * @param programId - The program ID to set as active
 */
export function setActiveScheduleProgram(programId: string): void {
    currentProgramId = programId;
}

/**
 * Get the active program ID
 */
export function getActiveScheduleProgram(): string {
    return currentProgramId;
}

/**
 * Ensure schedule data exists for a program
 */
function ensureScheduleData(programId: string): ProgramScheduleData {
    if (!SCHEDULE_BY_PROGRAM.has(programId)) {
        SCHEDULE_BY_PROGRAM.set(programId, { raw: [], complete: [] });
    }
    return SCHEDULE_BY_PROGRAM.get(programId)!;
}

// ============================================================================
// LEGACY API (for backward compatibility)
// ============================================================================

/**
 * Set the raw schedule data for the current program
 * @param data - Raw schedule items
 * @param programId - Optional program ID (defaults to current active program)
 */
export function setRawSchedule(data: RawScheduleItem[], programId?: string): void {
    const id = programId ?? currentProgramId;
    const scheduleData = ensureScheduleData(id);
    scheduleData.raw = data;
}

/**
 * Get the raw schedule data for the current program
 * @param programId - Optional program ID (defaults to current active program)
 */
export function getRawSchedule(programId?: string): RawScheduleItem[] {
    const id = programId ?? currentProgramId;
    return SCHEDULE_BY_PROGRAM.get(id)?.raw ?? [];
}

/**
 * Get the complete schedule for the current program
 * @param programId - Optional program ID (defaults to current active program)
 */
export function getCompleteSchedule(programId?: string): RawScheduleItem[] {
    const id = programId ?? currentProgramId;
    return SCHEDULE_BY_PROGRAM.get(id)?.complete ?? [];
}

// ============================================================================
// SCHEDULE BUILDING
// ============================================================================

/**
 * Build complete schedule for the current program.
 *
 * The workout plan data is now self-contained in the V2 JSON format,
 * so no additional processing or auto-generation of warmups/cooldowns is needed.
 * This function creates a copy of the raw schedule data for use by the rest of the application.
 * 
 * @param programId - Optional program ID (defaults to current active program)
 */
export function buildCompleteSchedule(programId?: string): void {
    const id = programId ?? currentProgramId;
    const scheduleData = ensureScheduleData(id);
    // The schedule is self-contained, so we just use the raw schedule as is
    scheduleData.complete = [...scheduleData.raw];
}

/**
 * Clear schedule data for a program
 * @param programId - The program ID to clear
 */
export function clearScheduleForProgram(programId: string): void {
    SCHEDULE_BY_PROGRAM.delete(programId);
}

/**
 * Clear all schedule data
 */
export function clearAllSchedules(): void {
    SCHEDULE_BY_PROGRAM.clear();
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
 * @param week - Week number
 * @param day - Day number (1, 2, 3, or 5)
 * @param programId - Optional program ID (defaults to current active program)
 */
export function getWorkout(week: WeekNumber, day: TrainingDay, programId?: string): Workout | null {
    const completeSchedule = getCompleteSchedule(programId);
    const dayExercises = completeSchedule.filter(i => i.w === week && i.d === day);

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
