/**
 * ExerciseSelectorModal Component
 *
 * Modal for searching and adding exercises to a workout.
 */

import React from 'react';
import { X } from 'lucide-react';
import { ExerciseListItem } from './ExerciseListItem';
import { RecentExercisesList, addRecentExercise } from './RecentExercises';
import { MUSCLE_FILTERS } from '../types/workout';
import type { Exercise } from '../types';
import type { MuscleFilter } from '../types/workout';
import type { HapticFeedback } from '../hooks';

// ============================================================================
// TYPES
// ============================================================================

export interface ExerciseSelectorModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Search term */
    searchTerm: string;
    /** Debounced search term for filtering */
    debouncedSearchTerm: string;
    /** Selected muscle filter */
    selectedFilter: MuscleFilter;
    /** Filtered exercises to display */
    filteredExercises: Exercise[];
    /** Full exercise library for recent exercises */
    exerciseLibrary: Exercise[];
    /** Haptic feedback interface */
    haptic: HapticFeedback;
    /** Callbacks */
    onSearchChange: (term: string) => void;
    onFilterChange: (filter: MuscleFilter) => void;
    onAddExercise: (exercise: Exercise, sets?: number, weight?: string, rest?: number) => void;
    onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ExerciseSelectorModal: React.FC<ExerciseSelectorModalProps> = ({
    isOpen,
    searchTerm,
    debouncedSearchTerm,
    selectedFilter,
    filteredExercises,
    exerciseLibrary,
    haptic,
    onSearchChange,
    onFilterChange,
    onAddExercise,
    onClose,
}) => {
    if (!isOpen || exerciseLibrary.length === 0) {
        return null;
    }

    const handleAdd = (exercise: Exercise, sets?: number, weight?: string, rest?: number) => {
        onAddExercise(exercise, sets, weight, rest);
        addRecentExercise(exercise);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-slide-up">
            <div className="bg-sys-surface rounded-t-3xl w-full max-h-[85vh] border-t border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Add Exercise</h3>
                        <button
                            onClick={() => {
                                haptic.tick();
                                onClose();
                            }}
                            className="h-10 w-10 rounded-xl bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Search exercises..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full h-12 px-4 bg-sys-surfaceHigh rounded-xl text-white placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-accent transition-all"
                    />

                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {MUSCLE_FILTERS.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => onFilterChange(filter)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                    selectedFilter === filter
                                        ? 'bg-sys-accent text-white'
                                        : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                }`}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {/* Recent Exercises - shown at top when no search term */}
                    {!debouncedSearchTerm && (
                        <RecentExercisesList
                            exerciseLibrary={exerciseLibrary}
                            onSelect={handleAdd}
                        />
                    )}

                    <div className="space-y-3">
                        {filteredExercises.map((exercise) => (
                            <ExerciseListItem
                                key={exercise.id}
                                exercise={exercise}
                                onAdd={handleAdd}
                                haptic={haptic}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
