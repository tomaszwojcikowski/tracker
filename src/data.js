// Global data storage that can be mutated from different modules
export const data = {
    RAW_SCHEDULE: [],
    COMPLETE_SCHEDULE: [],
    EXERCISE_LIBRARY: []
};

// Helper to set the data
export function setScheduleData(scheduleData) {
    data.RAW_SCHEDULE = scheduleData;
}

export function setExerciseLibrary(exercisesData) {
    data.EXERCISE_LIBRARY = exercisesData;
}

export function setCompleteSchedule(scheduleData) {
    data.COMPLETE_SCHEDULE = scheduleData;
}
