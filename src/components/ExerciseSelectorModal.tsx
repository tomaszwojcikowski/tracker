/**
 * ExerciseSelectorModal Component
 *
 * MD3 bottom sheet modal for searching and adding exercises to a workout.
 */

import React from 'react';
import { X } from './icons';
import { ExerciseListItem } from './ExerciseListItem';
import { RecentExercisesList, addRecentExercise } from './RecentExercises';
import { BottomSheet } from './BottomSheet';
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

    const handleClose = () => {
        haptic.tick();
        onClose();
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={handleClose}
            ariaLabel="Add Exercise"
            maxHeight={85}
            showHandle={false}
            className="border-t border-white/10"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Add Exercise</h3>
                    <button
                        onClick={handleClose}
                        className="btn-icon h-12 w-12 bg-sys-surfaceHigh"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full h-12 px-4 bg-sys-surfaceHigh rounded-xl text-white placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-accent transition-all"
                />

                <div className="flex gap-2 mt-3 overflow-x-auto pb-2 -mx-2 px-2">
                    {MUSCLE_FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => onFilterChange(filter)}
                            className={`btn-md3 px-4 py-2 text-sm whitespace-nowrap transition-all ${
                                selectedFilter === filter
                                    ? 'btn-filled'
                                    : 'btn-tonal'
                            }`}
                        >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-8">
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
        </BottomSheet>
    );
};
