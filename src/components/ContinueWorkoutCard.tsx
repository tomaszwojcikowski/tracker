/**
 * ContinueWorkoutCard Component
 *
 * Shows in-progress workout with resume option.
 * Part of Phase 2 mockup implementation.
 */

import { PlayCircle } from './icons';
import { formatRelativeTime } from '../utils/time';
import type { InProgressWorkout } from '../utils/storage';

interface ContinueWorkoutCardProps {
  workout: InProgressWorkout;
  onResume: () => void;
}

export function ContinueWorkoutCard({ workout, onResume }: ContinueWorkoutCardProps) {
  const { week, day, lastModified, completedSets, totalSets } = workout;

  const progress = totalSets > 0 ? `${completedSets} / ${totalSets} sets` : 'In progress';
  const timeAgo = lastModified ? (formatRelativeTime(lastModified.toISOString()) || 'Recently') : 'Recently';

  return (
    <section className="continue-card" aria-label="Continue workout">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-title-md font-bold text-sys-onSurface">
              Continue
            </h3>
          </div>
          <p className="text-body-sm text-sys-onSurfaceVar">
            Resume your in-progress session without losing data
          </p>
        </div>
        <button
          onClick={onResume}
          className="btn-md3 btn-gradient-primary-mockup flex items-center gap-2 shrink-0"
          aria-label="Resume workout"
        >
          <PlayCircle className="w-5 h-5" />
          Resume
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sys-outlineVariant">
        <div>
          <div className="text-label-sm text-sys-onSurfaceVar mb-1">
            Last activity
          </div>
          <div className="text-body-md font-semibold text-sys-onSurface">
            {timeAgo}
          </div>
        </div>
        <div>
          <div className="text-label-sm text-sys-onSurfaceVar mb-1">
            Workout
          </div>
          <div className="text-body-md font-semibold text-sys-onSurface">
            Week {week} • Day {day}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-label-sm text-sys-onSurfaceVar mb-1">
            Progress
          </div>
          <div className="text-body-md font-semibold text-sys-onSurface">
            {progress}
          </div>
        </div>
      </div>
    </section>
  );
}
