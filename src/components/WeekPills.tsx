/**
 * WeekPills Component
 *
 * Horizontal week selector with pill-style buttons.
 * Part of Phase 2 mockup implementation.
 */

import { motion, LayoutGroup } from 'framer-motion';

interface WeekPillsProps {
  currentWeek: number;
  totalWeeks: number;
  onWeekSelect: (week: number) => void;
  visibleWeeks?: number;
}

export function WeekPills({
  currentWeek,
  totalWeeks,
  onWeekSelect,
  visibleWeeks = 4,
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
        {weeks.map((week) => (
          <button
            key={week}
            onClick={() => onWeekSelect(week)}
            className={`week-pill relative ${week === currentWeek ? 'active' : ''}`}
            aria-label={`Week ${week}`}
            aria-current={week === currentWeek ? 'true' : undefined}
          >
            {week === currentWeek && (
              <motion.div
                layoutId="active-week-pill"
                className="absolute inset-0 bg-sys-primary rounded-lg -z-10 shadow-elevation-1"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${week === currentWeek ? 'text-sys-onPrimary' : ''}`}>
              {week}
            </span>
          </button>
        ))}
        </LayoutGroup>
      </div>
    </div>
  );
}
