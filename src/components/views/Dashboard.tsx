/**
 * Dashboard Component
 *
 * Main training dashboard showing current week, progress, and daily workouts.
 * Uses program-scoped storage keys for data isolation between programs.
 * Phase 2 Mockup: Enhanced with status pills, week selector pills, and continue card.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHaptic, useScrollToElement } from '../../hooks';
import { Play, ChevronRight, ChevronLeft, ChevronDown, Plus, Clock, X } from '../icons';
import { safeGetJSON, getInProgressWorkout, getWorkoutProgress, getWeekCompletionStatus, type InProgressWorkout, type WeekCompletionStatus } from '../../utils/storage';
import { getBlockForWeek } from '../../data/programData';
import { getCompleteSchedule, type RawScheduleItem } from '../../utils/schedule';
import { getSessionKey, getGlobalHistoryKey } from '../../services/storageNamespace';
import { ProgramSelector } from '../ProgramSelector';
import { useProgram } from '../../context/ProgramContext';
import { VALID_DAYS } from '../../constants';
import { getSectionTheme } from '../../utils/themeUtils';
import { WeeklyProgressRing } from '../progress';
import { StatusPill } from '../StatusPill';
import { WeekPills } from '../WeekPills';
import { ContinueWorkoutCard } from '../ContinueWorkoutCard';
import { BottomSheet } from '../BottomSheet';
import { WorkoutDetailModal } from '../modals';
import type { GlobalHistoryEntry } from '../../types';

/** Maximum number of exercises to show in the summary */
const MAX_EXERCISES_IN_SUMMARY = 3;

/**
 * Get color theme for a specific day
 */
function getDayTheme(day: number) {
  switch (day) {
    case 1:
      return {
        hero: {
          gradient: 'from-sys-primary to-sys-primary/80',
          border: 'border-sys-primary/30',
          badge: 'bg-sys-primaryContainer border-sys-primary/30 text-sys-onPrimaryContainer',
          iconBg: 'bg-sys-primary',
          iconColor: 'text-sys-onPrimary',
          text: 'text-sys-primary',
          container: 'bg-sys-primaryContainer text-sys-onPrimaryContainer',
          onContainer: 'text-sys-onPrimaryContainer'
        },
        card: {
          bg: 'bg-sys-primaryContainer',
          border: 'border-sys-primary/10',
          text: 'text-sys-onPrimaryContainer',
        }
      };
    case 2:
      return {
        hero: {
          gradient: 'from-sys-secondary to-sys-secondary/80',
          border: 'border-sys-secondary/30',
          badge: 'bg-sys-secondaryContainer border-sys-secondary/30 text-sys-onSecondaryContainer',
          iconBg: 'bg-sys-secondary',
          iconColor: 'text-sys-onSecondary',
          text: 'text-sys-secondary',
          container: 'bg-sys-secondaryContainer text-sys-onSecondaryContainer',
          onContainer: 'text-sys-onSecondaryContainer'
        },
        card: {
          bg: 'bg-sys-secondaryContainer',
          border: 'border-sys-secondary/10',
          text: 'text-sys-onSecondaryContainer',
        }
      };
    case 3:
      return {
        hero: {
          gradient: 'from-sys-tertiary to-sys-tertiary/80',
          border: 'border-sys-tertiary/30',
          badge: 'bg-sys-tertiaryContainer border-sys-tertiary/30 text-sys-onTertiaryContainer',
          iconBg: 'bg-sys-tertiary',
          iconColor: 'text-sys-onTertiary',
          text: 'text-sys-tertiary',
          container: 'bg-sys-tertiaryContainer',
          onContainer: 'text-sys-onTertiaryContainer'
        },
        card: {
          bg: 'bg-sys-tertiaryContainer',
          border: 'border-sys-tertiary/10',
          text: 'text-sys-onTertiaryContainer',
        }
      };
    case 5:
      return {
        hero: {
          gradient: 'from-sys-primary to-sys-secondary',
          border: 'border-sys-primary/30',
          badge: 'bg-sys-primaryContainer border-sys-primary/30 text-sys-onPrimaryContainer',
          iconBg: 'bg-sys-primary',
          iconColor: 'text-sys-onPrimary',
          text: 'text-sys-primary',
          container: 'bg-sys-primaryContainer',
          onContainer: 'text-sys-onPrimaryContainer'
        },
        card: {
          bg: 'bg-sys-primaryContainer',
          border: 'border-sys-primary/10',
          text: 'text-sys-onPrimaryContainer',
        }
      };
    default:
      return {
        hero: {
          gradient: 'from-sys-primary to-sys-primary/80',
          border: 'border-sys-primary/30',
          badge: 'bg-sys-primaryContainer border-sys-primary/30 text-sys-onPrimaryContainer',
          iconBg: 'bg-sys-primary',
          iconColor: 'text-sys-onPrimary',
          text: 'text-sys-primary',
          container: 'bg-sys-surfaceContainer',
          onContainer: 'text-sys-onSurface'
        },
        card: {
          bg: 'bg-sys-surfaceContainer',
          border: 'border-sys-outlineVariant',
          text: 'text-sys-onSurfaceVariant',
        }
      };
  }
}

/**
 * Get a summary of main and skill exercises for a day (excluding warmup/accessory)
 */
function getExerciseSummary(week: number, day: number): string {
  const schedule = getCompleteSchedule();
  const dayExercises = schedule.filter((item) => item.w === week && item.d === day);

  if (dayExercises.length === 0) {
    return 'Rest day';
  }

  // Filter to only skill and main work exercises based on category
  const mainExercises = dayExercises
    .filter((item) => item.category === 'skill' || item.category === 'main')
    .map((item) => item.ex)
    .slice(0, MAX_EXERCISES_IN_SUMMARY);

  if (mainExercises.length === 0) {
    return 'Rest day';
  }

  return mainExercises.join(', ');
}

function getDayExercises(week: number, day: number): RawScheduleItem[] {
  const schedule = getCompleteSchedule();
  return schedule.filter((item) => item.w === week && item.d === day);
}

function formatScheduleItem(item: RawScheduleItem): string {
  // Keep this intentionally simple and stable for UI.
  const setsReps = item.s && item.r ? `${item.s}×${item.r}` : '';
  const load = item.load ? ` @ ${item.load}` : '';
  return `${item.ex}${setsReps ? ` — ${setsReps}` : ''}${load}`;
}

export interface DashboardProps {
  currentWeek: number;
  setCurrentWeek: (week: number) => void;
  onStartWorkout: (day: number) => void;
  onStartEmptyWorkout?: () => void;
  /** Optional callback when program changes */
  onProgramChange?: (programId: string) => void;
}

export function Dashboard({
  currentWeek,
  setCurrentWeek,
  onStartWorkout,
  onStartEmptyWorkout,
  onProgramChange,
}: DashboardProps) {
  const [inProgressWorkout, setInProgressWorkout] = useState<InProgressWorkout | null>(null);
  const [detailWorkout, setDetailWorkout] = useState<GlobalHistoryEntry[] | null>(null);
  const haptic = useHaptic();

  // Get program context for program-aware features
  const { currentProgram, metadata, currentProgramId } = useProgram();

  // Calculate max weeks based on current program
  const maxWeeks = metadata?.durationWeeks ?? currentProgram?.durationWeeks ?? 21;

  const handleViewDetails = (week: number, day: number) => {
    const historyKey = getGlobalHistoryKey();
    const history = safeGetJSON<GlobalHistoryEntry[]>(historyKey, []);
    // Find all entries for this specific week and day
    const entries = history.filter(h => h.week === week && h.day === day);
    if (entries.length > 0) {
      setDetailWorkout(entries);
    }
  };

  // Navigation handlers for buttons
  const changeWeek = useCallback((newWeek: number) => {
    if (newWeek === currentWeek || newWeek < 1 || newWeek > maxWeeks) return;
    haptic.swipe();
    setCurrentWeek(newWeek);
  }, [currentWeek, maxWeeks, haptic, setCurrentWeek]);

  // Check for in-progress workouts on mount and when week changes
  useEffect(() => {
    const inProgress = getInProgressWorkout();
    setInProgressWorkout(inProgress);
  }, [currentWeek]);

  // Scroll to the active day card when the view loads
  // Priority: in-progress workout > next incomplete day
  const activeDayId = inProgressWorkout
    ? `day-card-${inProgressWorkout.day}`
    : undefined; // Let the page naturally show top (Weekly Progress Ring is prominent)

  useScrollToElement({
    elementId: activeDayId,
    delay: 150,
    enabled: !!activeDayId,
  });

  const isCompleted = (day: number): boolean => {
    const sessionKey = getSessionKey(currentWeek, day);
    const session = safeGetJSON<{ completed?: boolean } | null>(
      sessionKey,
      null
    );
    return session?.completed === true;
  };

  const getDayProgress = (day: number): { completedSets: number; totalSets: number; completedExercises: number; totalExercises: number; progress: number } | null => {
    return getWorkoutProgress(currentWeek, day);
  };

  const days = VALID_DAYS;

  const schedule = useMemo(
    () => getCompleteSchedule(currentProgramId ?? undefined),
    [currentProgramId]
  );

  const workoutDayKeys = useMemo(() => {
    const keys = new Set<string>();
    (schedule as RawScheduleItem[]).forEach((item) => {
      keys.add(`${item.w}-${item.d}`);
    });
    return keys;
  }, [schedule]);

  const daysByWeek = useMemo(() => {
    const map = new Map<number, number[]>();
    for (let week = 1; week <= maxWeeks; week++) {
      map.set(
        week,
        days.filter((day) => workoutDayKeys.has(`${week}-${day}`))
      );
    }
    return map;
  }, [days, maxWeeks, workoutDayKeys]);

  // Find the next workout to do across ALL weeks in the program (not just current week)
  // Returns { week, day } of the first incomplete workout, or null if all completed
  const findNextWorkout = useCallback((): { week: number; day: number } | null => {
    for (let week = 1; week <= maxWeeks; week++) {
      const weekDays = daysByWeek.get(week) ?? [];
      for (const day of weekDays) {
        const sessionKey = getSessionKey(week, day);
        const session = safeGetJSON<{ completed?: boolean } | null>(
          sessionKey,
          null
        );
        if (session?.completed !== true) {
          return { week, day };
        }
      }
    }
    return null;
  }, [daysByWeek, maxWeeks]);

  const nextWorkout = findNextWorkout();

  // Calculate completion status for all weeks
  const weekCompletions = useMemo(() => {
    const completions = new Map<number, WeekCompletionStatus>();
    for (let week = 1; week <= maxWeeks; week++) {
      const weekDays = daysByWeek.get(week) ?? [];
      const status = getWeekCompletionStatus(week, weekDays);
      completions.set(week, status);
    }
    return completions;
  }, [maxWeeks, daysByWeek, currentWeek]); // Include currentWeek to refresh when week changes

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Program Selector - fixed at top */}
      <div className="px-5 pt-6">
        <ProgramSelector
          variant="card"
          className="mb-6"
          onProgramChange={onProgramChange}
        />
      </div>

      {/* Week Selector Pills - Moved outside WeekContent for smooth transition */}
      <div className="px-5 mb-4 shrink-0">
        <WeekPills
          currentWeek={currentWeek}
          totalWeeks={maxWeeks}
          onWeekSelect={changeWeek}
          visibleWeeks={4}
          weekCompletions={weekCompletions}
        />
      </div>

      {/* Main Content Area - Renders active week only for smooth transitions */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <WeekContent
            key={currentWeek}
            week={currentWeek}
            currentWeek={currentWeek}
            maxWeeks={maxWeeks}
            inProgressWorkout={inProgressWorkout}
            days={daysByWeek.get(currentWeek) ?? []}
            nextWorkout={nextWorkout}
            isCompleted={isCompleted}
            getDayProgress={getDayProgress}
            getExerciseSummary={getExerciseSummary}
            changeWeek={changeWeek}
            onStartWorkout={onStartWorkout}
            onViewDetails={handleViewDetails}
            onStartEmptyWorkout={onStartEmptyWorkout}
            haptic={haptic}
          />
      </div>

      <WorkoutDetailModal
        isOpen={detailWorkout !== null}
        onClose={() => setDetailWorkout(null)}
        workouts={detailWorkout || []}
      />

      {/* Week navigation dots - above bottom nav */}
      <div className="py-4 pb-24 flex justify-center items-center gap-2">
        <button
          onClick={() => changeWeek(currentWeek - 1)}
          className="btn-icon h-12 w-12 bg-sys-surfaceHigh text-sys-onSurface disabled:opacity-30"
          disabled={currentWeek === 1}
          aria-label="Previous week"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2 px-4">
          {[...Array(5)].map((_, i) => {
            const dotWeek = currentWeek - 2 + i;
            if (dotWeek < 1 || dotWeek > maxWeeks)
              return <div key={i} className="w-2 h-2" />;
            return (
              <button
                key={i}
                onClick={() => changeWeek(dotWeek)}
                className={`rounded-full transition-all ${
                  dotWeek === currentWeek
                    ? 'w-8 h-2 bg-sys-primary'
                    : 'w-2 h-2 bg-sys-outlineVariant hover:bg-sys-onSurfaceVariant/50'
                }`}
                aria-label={`Week ${dotWeek}`}
              />
            );
          })}
        </div>
        <button
          onClick={() => changeWeek(currentWeek + 1)}
          className="btn-icon h-12 w-12 bg-sys-surfaceHigh text-sys-onSurface disabled:opacity-30"
          disabled={currentWeek === maxWeeks}
          aria-label="Next week"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// WEEK CONTENT COMPONENT
// ============================================================================

interface WeekContentProps {
  week: number;
  currentWeek: number;
  maxWeeks: number;
  inProgressWorkout: InProgressWorkout | null;
  days: number[];
  nextWorkout: { week: number; day: number } | null;
  isCompleted: (day: number) => boolean;
  getDayProgress: (day: number) => { completedSets: number; totalSets: number; completedExercises: number; totalExercises: number; progress: number } | null;
  getExerciseSummary: (week: number, day: number) => string;
  changeWeek: (week: number) => void;
  onStartWorkout: (day: number) => void;
  onViewDetails: (week: number, day: number) => void;
  onStartEmptyWorkout?: () => void;
  haptic: ReturnType<typeof useHaptic>;
}

// Helper to get color classes for preview items based on section/category
// (Replaced by shared getSectionTheme utility)

function WeekContent({
  week,
  currentWeek,
  maxWeeks: _maxWeeks,
  inProgressWorkout,
  days,
  nextWorkout,
  isCompleted,
  getDayProgress,
  getExerciseSummary,
  changeWeek,
  onStartWorkout,
  onViewDetails,
  onStartEmptyWorkout,
  haptic,
}: WeekContentProps) {
  const [previewDay, setPreviewDay] = useState<number | null>(null);
  const [isWarmupExpanded, setIsWarmupExpanded] = useState(false);

  // Reset expansion when preview day changes
  useEffect(() => {
    setIsWarmupExpanded(false);
  }, [previewDay]);

  const currentBlock = getBlockForWeek(week) || { name: `Week ${week}`, id: week, weeks: [week] };
  const completedWorkouts = days.filter(day => isCompleted(day)).length;
  const totalWorkouts = days.length;

  const handleResumeWorkout = () => {
    if (inProgressWorkout) {
      haptic.bump();
      if (inProgressWorkout.week !== currentWeek) {
        changeWeek(inProgressWorkout.week);
      }
      onStartWorkout(inProgressWorkout.day);
    }
  };

  const handleHeroCardActivate = (day: number) => {
    haptic.tick();
    onStartWorkout(day);
  };

  return (
    <div className="flex-shrink-0 w-full px-5 pb-32">
      <BottomSheet
        isOpen={previewDay !== null}
        onClose={() => setPreviewDay(null)}
        ariaLabel={previewDay !== null ? `Preview Day ${previewDay} workout` : 'Preview workout'}
        maxHeight={85}
        showHandle={false}
      >
        <div className="p-6 space-y-4">
          <div className="divider divider-full-width" aria-hidden="true" />
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-sys-onSurface">
              {previewDay !== null ? `Day ${previewDay} Preview` : 'Preview'}
            </h3>
            <button
              onClick={() => {
                haptic.tick();
                setPreviewDay(null);
              }}
              className="btn-icon h-12 w-12 bg-sys-surfaceHigh"
              aria-label="Close preview"
            >
              <X size={24} />
            </button>
          </div>
          {previewDay !== null && (
            <div className="text-sm text-sys-onSurfaceVariant">
              Week {week}
            </div>
          )}
        </div>

        <div className="p-4 pb-8">
          {previewDay === null ? null : (
            (() => {
              const items = getDayExercises(week, previewDay);
              if (items.length === 0) {
                return <div className="text-sys-onSurfaceVariant">Rest day</div>;
              }

              const isWarmup = (item: RawScheduleItem) => {
                  const key = (item.category || item.n || '').toLowerCase();
                  return key.includes('prep') || key.includes('warmup');
              };

              const warmupItems = items.filter(isWarmup);
              const mainItems = items.filter(i => !isWarmup(i));
              let staggerIndex = 1;

              return (
                <div className="space-y-2">
                  {warmupItems.length > 0 && (
                      <div className={`rounded-xl border border-warmup-500/20 bg-warmup-500/5 overflow-hidden stagger-item stagger-${Math.min(staggerIndex++, 10)}`}>
                        <button
                            onClick={() => {
                                haptic.tick();
                                setIsWarmupExpanded(!isWarmupExpanded);
                            }}
                            className="w-full flex items-center justify-between p-3 text-left"
                        >
                            <span className="text-sm font-medium text-warmup-100">
                                Warmup • {warmupItems.length} exercises
                            </span>
                            <ChevronDown size={16} className={`text-warmup-100 transition-transform duration-300 ${isWarmupExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isWarmupExpanded && (
                            <div className="p-2 pt-0 space-y-2 border-t border-warmup-500/10 mt-1">
                                {warmupItems.map((item, idx) => {
                                    const theme = getSectionTheme(item.category || item.n);
                                    return (
                                        <div
                                            key={`${previewDay}-warmup-${idx}-${item.ex}`}
                                            className={`p-3 rounded-xl border ${theme.bg} ${theme.border} stagger-item stagger-${Math.min(staggerIndex++, 10)}`}
                                        >
                                            <div className="text-sm text-sys-onSurface font-medium">
                                                {formatScheduleItem(item)}
                                            </div>
                                            {(item.category || item.n) && (
                                                <div className="mt-1 text-xs text-sys-onSurfaceVariant">
                                                    {item.category ?? 'work'}
                                                    {item.n ? ` • ${item.n}` : ''}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                      </div>
                  )}

                  {mainItems.map((item, idx) => {
                    const theme = getSectionTheme(item.category || item.n);
                    return (
                      <div
                        // Raw schedule items do not have stable IDs; index is acceptable for read-only preview.
                        key={`${previewDay}-${idx}-${item.ex}`}
                        className={`p-3 rounded-xl border stagger-item stagger-${Math.min(staggerIndex++, 10)} ${theme.bg} ${theme.border}`}
                      >
                        <div className="text-sm text-sys-onSurface font-medium">
                          {formatScheduleItem(item)}
                        </div>
                        {(item.category || item.n) && (
                          <div className="mt-1 text-xs text-sys-onSurfaceVariant">
                            {item.category ?? 'work'}
                            {item.n ? ` • ${item.n}` : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      </BottomSheet>

      {/* Weekly Progress Ring */}
      <WeeklyProgressRing
        completedWorkouts={completedWorkouts}
        totalWorkouts={totalWorkouts}
        currentWeek={week}
      />

      {/* Continue Workout Card - Phase 2 Mockup Feature */}
      {inProgressWorkout && inProgressWorkout.week === week && (
        <div className="mb-6">
          <ContinueWorkoutCard
            workout={inProgressWorkout}
            onResume={handleResumeWorkout}
          />
        </div>
      )}

        <div className="flex justify-between items-end mb-5 px-1">
          <h3 className="text-title-lg text-sys-onSurface">Workouts</h3>
          <span className="text-label-md text-sys-primary font-medium uppercase tracking-wide">
            {currentBlock.name}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {days.map((day, idx) => {
            const done = isCompleted(day);
            const dayProgress = getDayProgress(day);
            const isInProgress = !done && dayProgress !== null;
            void isInProgress;

            // Determine if this is the "Hero" card (next up)
            // It's the hero only if this week+day matches the next workout in the entire program
            // and there's no workout currently in progress (in which case the resume banner handles it)
            const isNextUp = nextWorkout !== null &&
                             nextWorkout.week === week &&
                             nextWorkout.day === day &&
                             !inProgressWorkout;
            const theme = getDayTheme(day);

            if (isNextUp) {
                return (
                <div
                        key={day}
                        id={`day-card-${day}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleHeroCardActivate(day)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) {
                      return;
                    }

                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleHeroCardActivate(day);
                    }
                  }}
                  className={`stagger-item relative overflow-hidden rounded-md p-6 text-left transition-all active:scale-[0.99] group scroll-mt-16 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sys-primary ${theme.hero.container}`}
                        style={{ animationDelay: `${idx * 200}ms` }}
                        aria-label={`Start Day ${day} workout`}
                    >
                        <div className={`absolute inset-0 border ${theme.hero.border} rounded-md`} />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <button
                              type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        haptic.tick();
                                        setPreviewDay(day);
                                    }}
                                    className={`px-3 py-1 rounded-full ${theme.hero.badge} text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95`}
                                    aria-label={`Preview Day ${day} workout`}
                                >
                                    Next Up
                                </button>
                                <div className={`h-10 w-10 rounded-full ${theme.hero.iconBg} ${theme.hero.iconColor} flex items-center justify-center shadow-elevation-2 ring-1 ring-sys-onSurface/5`}>
                                    <Play size={20} fill="currentColor" />
                                </div>
                            </div>

                            <h3 className={`text-2xl font-bold ${theme.hero.onContainer} mb-1`}>Day {day}</h3>
                            <p className={`text-sm ${theme.hero.onContainer} opacity-80 mb-4 line-clamp-1`}>
                                {getExerciseSummary(week, day)}
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className={`h-1.5 w-1.5 rounded-full ${theme.hero.iconBg}`} />
                                    <span className={`text-xs font-bold ${theme.hero.onContainer} opacity-60 uppercase tracking-wider`}>
                                        {getDayExercises(week, day).length} Exercises
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className={`h-1.5 w-1.5 rounded-full ${theme.hero.iconBg}`} />
                                    <span className={`text-xs font-bold ${theme.hero.onContainer} opacity-60 uppercase tracking-wider`}>
                                        45-60 Min
                                    </span>
                                </div>
                            </div>
                        </div>
                        </div>
                );
            }

            return (
              <div
                key={day}
                id={`day-card-${day}`}
                className="day-card-enhanced stagger-item"
                style={{ animationDelay: `${idx * 200}ms` }}
              >
                {/* Day header with status pill */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-title-md font-bold text-sys-onSurface mb-1">
                      Day {day}
                    </h4>
                    <p className="text-body-sm text-sys-onSurfaceVariant line-clamp-1">
                      {getExerciseSummary(week, day)}
                    </p>
                  </div>
                  {(done || isInProgress) && (
                    <StatusPill
                      status={done ? 'completed' : 'up-next'}
                    />
                  )}
                </div>

                {/* Metadata row - Phase 2 Mockup Feature */}
                {(done || dayProgress) && (
                  <div className="day-metadata mb-4">
                    {dayProgress && (
                      <div className="day-metadata-item">
                        <span className="day-metadata-label">Sets</span>
                        <span className="day-metadata-value">
                          {dayProgress.completedSets} / {dayProgress.totalSets}
                        </span>
                      </div>
                    )}
                    {done && dayProgress && (
                      <div className="day-metadata-item">
                        <Clock className="w-3 h-3" />
                        <span className="day-metadata-value">48m</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      haptic.tick();
                      if (done) {
                        onViewDetails(week, day);
                      } else {
                        onStartWorkout(day);
                      }
                    }}
                    className={`btn-md3 flex-1 ${
                      isInProgress
                        ? 'btn-filled'
                        : done
                        ? 'btn-tonal'
                        : 'btn-filled'
                    } flex items-center justify-center gap-2`}
                    aria-label={`${done ? 'View' : isInProgress ? 'Resume' : 'Start'} Day ${day} workout`}
                  >
                    {done ? 'Details' : isInProgress ? 'Resume' : 'Start'}
                  </button>
                  {!done && !isInProgress && (
                    <button
                      onClick={() => {
                        haptic.tick();
                        setPreviewDay(day);
                      }}
                      className="btn-md3 btn-outlined px-4"
                      aria-label={`Preview Day ${day} workout`}
                    >
                      Preview
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Start Empty Workout Button - MD3 Outlined Button Style */}
        {onStartEmptyWorkout && (
          <div className="mt-6">
            <button
              onClick={() => {
                haptic.bump();
                onStartEmptyWorkout();
              }}
              className="w-full min-h-[64px] rounded-lg px-5 py-4 flex items-center justify-center gap-4 transition-all active:scale-[0.98] card-outlined hover:bg-sys-surfaceVariant/20"
              aria-label="Start an empty workout"
            >
              <div className="h-10 w-10 min-w-[40px] rounded-full bg-sys-primaryContainer flex items-center justify-center">
                <Plus className="text-sys-onPrimaryContainer" size={20} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-label-lg text-sys-onSurface">Start Custom Workout</span>
                <span className="text-body-sm text-sys-onSurfaceVar">Add your own exercises</span>
              </div>
            </button>
          </div>
        )}
    </div>
  );
}

