
import { WorkoutPlanMetadata } from '../workout-plan-utils';

declare global {
    interface Window {
        TRACKER_APP?: {
            workoutPlanMetadata?: WorkoutPlanMetadata;
        };
    }
}

export {};
