/**
 * Recent Exercises Component
 *
 * Shows recently used exercises at the top of the exercise picker.
 * Tracks last 5 exercises added to workouts.
 */

import React from 'react';
import { Clock, Plus } from 'lucide-react';
import { safeGetJSON, safeSetJSON } from '../utils/storage';
import type { Exercise } from '../types';

const STORAGE_KEY = 'recent_exercises';
const MAX_RECENT = 5;

export interface RecentExercise {
    id: string;
    name: string;
    lastUsed: string;
}

/**
 * Get recent exercises from storage
 */
export const getRecentExercises = (): RecentExercise[] => {
    return safeGetJSON<RecentExercise[]>(STORAGE_KEY, []) ?? [];
};

/**
 * Add an exercise to recent list
 */
export const addRecentExercise = (exercise: Exercise): void => {
    const recent = getRecentExercises();

    // Remove if already exists
    const filtered = recent.filter(r => r.id !== exercise.id);

    // Add to front
    const updated: RecentExercise[] = [
        { id: exercise.id, name: exercise.name, lastUsed: new Date().toISOString() },
        ...filtered,
    ].slice(0, MAX_RECENT);

    safeSetJSON(STORAGE_KEY, updated);
};

/**
 * Clear recent exercises
 */
export const clearRecentExercises = (): void => {
    safeSetJSON(STORAGE_KEY, []);
};

export interface RecentExercisesListProps {
    /** Full exercise library to look up exercise details */
    exerciseLibrary: Exercise[];
    /** Callback when an exercise is selected */
    onSelect: (exercise: Exercise) => void;
    /** Currently added exercises (to filter out) */
    addedExerciseIds?: string[];
}

/**
 * Recent Exercises List Component
 */
export const RecentExercisesList: React.FC<RecentExercisesListProps> = ({
    exerciseLibrary,
    onSelect,
    addedExerciseIds = [],
}) => {
    const recentExercises = getRecentExercises();

    // Filter out already added exercises and find full exercise objects
    const availableRecent = recentExercises
        .filter(r => !addedExerciseIds.includes(r.id))
        .map(r => exerciseLibrary.find(e => e.id === r.id))
        .filter((e): e is Exercise => e !== undefined)
        .slice(0, MAX_RECENT);

    if (availableRecent.length === 0) return null;

    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-1">
                <Clock size={14} className="text-sys-onSurfaceVar" />
                <span className="text-xs font-semibold text-sys-onSurfaceVar uppercase tracking-wider">
                    Recently Used
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {availableRecent.map((exercise) => (
                    <button
                        key={exercise.id}
                        onClick={() => onSelect(exercise)}
                        className="flex items-center gap-2 h-9 px-3 bg-sys-surfaceHigh rounded-xl text-sm text-white font-medium border border-white/5 active:scale-95 transition-all hover:bg-sys-accent/10 hover:border-sys-accent/30"
                    >
                        <span className="truncate max-w-[140px]">{exercise.name}</span>
                        <Plus size={14} className="text-sys-accent flex-shrink-0" />
                    </button>
                ))}
            </div>
        </div>
    );
};
