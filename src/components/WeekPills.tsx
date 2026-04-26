/**
 * WeekPills Component
 *
 * Horizontal week selector with pill-style buttons.
 * Part of Phase 2 mockup implementation.
 * Shows completion status and progress for each week.
 */

import { motion, LayoutGroup } from 'framer-motion';
import { Check } from './icons';

interface WeekCompletionData {
  week: number;
  completedDays: number;
  totalDays: number;
  progress: number;
  isCompleted: boolean;
}

interface WeekPillsProps {
  currentWeek: number;
  totalWeeks: number;
  onWeekSelect: (week: number) => void;
  visibleWeeks?: number;
  /** Completion status for each week */
  weekCompletions?: Map<number, WeekCompletionData>;
}

export function WeekPills({
  currentWeek,
  totalWeeks,
  onWeekSelect,
  visibleWeeks = 4,
  weekCompletions,
}: WeekPillsProps) {
  // Calculate which weeks to show (center around current week)
  const startWeek = Math.max(1, Math.min(currentWeek - Math.floor(visibleWeeks / 2), totalWeeks - visibleWeeks + 1));
  const endWeek = Math.min(totalWeeks, startWeek + visibleWeeks - 1);

  const weeks = [];
  for (let i = startWeek; i <= endWeek; i++) {
    weeks.push(i);
  }

  return (
    <div className="flex gap-3 items-center">
      <div className="text-label-md font-bold text-sys-onSurfaceVariant uppercase tracking-wider">
        Week
      </div>
      <div className="flex gap-2 items-center overflow-x-auto hide-scrollbar py-1 isolate">
        <LayoutGroup id="week-pills">
        {weeks.map((week) => {
          const completion = weekCompletions?.get(week);
          const isCompleted = completion?.isCompleted ?? false;
          const progress = completion?.progress ?? 0;
          const hasProgress = progress > 0 && progress < 100;

          return (
          <button
            key={week}
            onClick={() => onWeekSelect(week)}
            className={`week-pill relative ${week === currentWeek ? 'active' : ''}`}
            aria-label={`Week ${week}${isCompleted ? ' (Completed)' : hasProgress ? ` (${progress}% complete)` : ''}`}
            aria-current={week === currentWeek ? 'true' : undefined}
          >
            {week === currentWeek && (
              <motion.div
                layoutId="active-week-pill"
                className="absolute inset-0 bg-sys-onSurface rounded-sm -z-10"
                initial={false}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 ${week === currentWeek ? 'text-sys-onPrimary' : ''}`}>
              {week}
              {isCompleted && (
                <Check
                  size={14}
                  className={`${week === currentWeek ? 'text-sys-surface' : 'text-sys-onSurface'}`}
                  strokeWidth={3}
                />
              )}
            </span>
            {/* Progress indicator for partially completed weeks */}
            {hasProgress && (
              <div
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 bg-sys-onSurface rounded-sm transition-all"
                style={{ width: `${Math.max(progress * 0.6, 12)}%` }}
                aria-hidden="true"
              />
            )}
          </button>
        )})}
        </LayoutGroup>
      </div>
    </div>
  );
}
