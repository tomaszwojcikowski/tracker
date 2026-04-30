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
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const timeAgo = lastModified ? (formatRelativeTime(lastModified.toISOString()) || 'Recently') : 'Recently';

  return (
    <section className="continue-card relative overflow-hidden" aria-label="Continue workout">
      {/* Decorative accent stripe */}
      <span aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-1 bg-sys-primary" />

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-title-md font-bold text-sys-onSurface">
              Continue
            </h3>
          </div>
          <p className="text-body-sm text-sys-onSurfaceVariant">
            Resume your in-progress session without losing data
          </p>
        </div>
        <button
          onClick={onResume}
          className="h-12 px-6 rounded-md bg-sys-primary text-sys-onPrimary font-bold flex items-center gap-2 shrink-0 active:scale-[0.99] transition-all"
          aria-label="Resume workout"
        >
          <PlayCircle className="w-5 h-5" />
          Resume
        </button>
      </div>

      {totalSets > 0 && (
        <div className="w-full bg-sys-surfaceContainerHigh h-2 rounded-sm overflow-hidden mb-4">
          <div
            className="h-full bg-sys-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sys-outlineVariant">
        <div>
          <div className="eyebrow text-sys-onSurfaceVariant mb-1">
            Last activity
          </div>
          <div className="text-body-md font-semibold text-sys-onSurface">
            {timeAgo}
          </div>
        </div>
        <div>
          <div className="eyebrow text-sys-onSurfaceVariant mb-1">
            Workout
          </div>
          <div className="text-body-md font-semibold text-sys-onSurface text-mono-stat">
            Week {week} • Day {day}
          </div>
        </div>
        <div className="col-span-2">
          <div className="eyebrow text-sys-onSurfaceVariant mb-1">
            Progress
          </div>
          <div className="text-body-md font-semibold text-sys-onSurface text-mono-stat">
            {progress}
          </div>
        </div>
      </div>
    </section>
  );
}
