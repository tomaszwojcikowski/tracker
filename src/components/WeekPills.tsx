/**
 * WeekPills Component
 *
 * Horizontal week selector with pill-style buttons.
 * Part of Phase 2 mockup implementation.
 */

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
      <div className="flex gap-2 items-center overflow-x-auto hide-scrollbar py-1">
        {weeks.map((week) => (
          <button
            key={week}
            onClick={() => onWeekSelect(week)}
            className={`week-pill ${week === currentWeek ? 'active' : ''}`}
            aria-label={`Week ${week}`}
            aria-current={week === currentWeek ? 'true' : undefined}
          >
            {week}
          </button>
        ))}
      </div>
    </div>
  );
}
