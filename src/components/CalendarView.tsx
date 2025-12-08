/**
 * CalendarView Component
 * 
 * Displays workout history in a monthly calendar format.
 * Shows workout completion status for each day with visual indicators.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, Dumbbell } from './icons';

interface GlobalHistoryEntry {
    date: string;
    week: number;
    day: number;
    exercises?: Array<{
        name: string;
        prescription: string;
        completedSets: number;
        totalSets: number;
        weight?: string | number;
        rpe?: Record<string, string>;
    }>;
    workoutNotes?: string;
    isEmptyWorkout?: boolean;
}

interface CalendarViewProps {
    history: GlobalHistoryEntry[];
    onDayClick?: (date: string, workouts: GlobalHistoryEntry[]) => void;
}

interface DayData {
    date: Date;
    dateString: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    workouts: GlobalHistoryEntry[];
    hasWorkout: boolean;
    isComplete: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ history, onDayClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get the first day of the current month
    const firstDayOfMonth = useMemo(() => {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    }, [currentDate]);

    // Get the start date (including days from previous month to fill the week)
    const startDate = useMemo(() => {
        const start = new Date(firstDayOfMonth);
        const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
        start.setDate(start.getDate() - dayOfWeek);
        return start;
    }, [firstDayOfMonth]);

    // Group history by date for quick lookup - memoized to avoid recalculation
    const historyByDate = useMemo(() => {
        const grouped = new Map<string, GlobalHistoryEntry[]>();
        history.forEach(entry => {
            const dateKey = new Date(entry.date).toISOString().split('T')[0];
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, []);
            }
            grouped.get(dateKey)!.push(entry);
        });
        return grouped;
    }, [history]);

    // Pre-compute completion status for workouts - memoized
    const workoutCompletionStatus = useMemo(() => {
        const status = new Map<string, boolean>();
        historyByDate.forEach((workouts, dateKey) => {
            const isComplete = workouts.every(workout => {
                if (!workout.exercises || workout.exercises.length === 0) return false;
                const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.totalSets, 0);
                const completedSets = workout.exercises.reduce((sum, ex) => sum + ex.completedSets, 0);
                return totalSets > 0 && completedSets === totalSets;
            });
            status.set(dateKey, isComplete);
        });
        return status;
    }, [historyByDate]);

    // Build calendar data
    const calendarDays = useMemo<DayData[]>(() => {
        const days: DayData[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Generate 42 days (6 weeks) for calendar grid
        const current = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const dateString = current.toISOString().split('T')[0];
            const workouts = historyByDate.get(dateString) || [];
            const hasWorkout = workouts.length > 0;
            const isComplete = hasWorkout && (workoutCompletionStatus.get(dateString) || false);

            days.push({
                date: new Date(current),
                dateString,
                isCurrentMonth: current.getMonth() === currentDate.getMonth(),
                isToday: current.toDateString() === today.toDateString(),
                workouts,
                hasWorkout,
                isComplete,
            });

            current.setDate(current.getDate() + 1);
        }

        return days;
    }, [startDate, currentDate, historyByDate, workoutCompletionStatus]);

    const handlePreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleDayClick = (dayData: DayData) => {
        if (dayData.hasWorkout && onDayClick) {
            onDayClick(dayData.dateString, dayData.workouts);
        }
    };

    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={handlePreviousMonth}
                    className="h-10 w-10 rounded-xl bg-sys-surfaceHigh hover:bg-sys-accent/20 transition-colors flex items-center justify-center"
                    aria-label="Previous month"
                >
                    <ChevronLeft size={20} className="text-sys-onSurface" />
                </button>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-sys-surfaceHigh rounded-xl">
                        <CalendarIcon size={16} className="text-sys-accent" />
                        <h2 className="text-base font-bold text-white">{monthName}</h2>
                    </div>
                    <button
                        onClick={handleToday}
                        className="px-3 py-2 bg-sys-accent/20 hover:bg-sys-accent/30 rounded-xl text-xs font-semibold text-sys-accent transition-colors"
                    >
                        Today
                    </button>
                </div>

                <button
                    onClick={handleNextMonth}
                    className="h-10 w-10 rounded-xl bg-sys-surfaceHigh hover:bg-sys-accent/20 transition-colors flex items-center justify-center"
                    aria-label="Next month"
                >
                    <ChevronRight size={20} className="text-sys-onSurface" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-sys-surface rounded-2xl p-4 border border-white/5">
                {/* Week Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-sys-onSurfaceVar py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((dayData, index) => {
                        const dayNumber = dayData.date.getDate();
                        
                        return (
                            <motion.button
                                key={index}
                                onClick={() => handleDayClick(dayData)}
                                disabled={!dayData.hasWorkout}
                                whileTap={dayData.hasWorkout ? { scale: 0.95 } : undefined}
                                className={`
                                    relative aspect-square rounded-xl p-1 transition-all
                                    ${dayData.isCurrentMonth ? 'bg-sys-surfaceHigh' : 'bg-transparent'}
                                    ${dayData.isToday ? 'ring-2 ring-sys-accent' : ''}
                                    ${dayData.hasWorkout && dayData.isCurrentMonth ? 'hover:bg-sys-accent/20 cursor-pointer' : ''}
                                    ${!dayData.hasWorkout || !dayData.isCurrentMonth ? 'cursor-default' : ''}
                                `}
                            >
                                <div className="flex flex-col items-center justify-center h-full">
                                    {/* Day Number */}
                                    <span className={`
                                        text-sm font-semibold leading-none
                                        ${dayData.isCurrentMonth ? 'text-white' : 'text-sys-onSurfaceVar/30'}
                                        ${dayData.isToday ? 'text-sys-accent' : ''}
                                    `}>
                                        {dayNumber}
                                    </span>

                                    {/* Workout Indicator */}
                                    {dayData.hasWorkout && dayData.isCurrentMonth && (
                                        <div className="mt-1">
                                            {dayData.isComplete ? (
                                                <div className="h-5 w-5 rounded-full bg-sys-success/20 flex items-center justify-center">
                                                    <Check size={12} className="text-sys-success" />
                                                </div>
                                            ) : (
                                                <div className="h-5 w-5 rounded-full bg-sys-accent/20 flex items-center justify-center">
                                                    <Dumbbell size={10} className="text-sys-accent" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Multiple workouts indicator */}
                                    {dayData.workouts.length > 1 && dayData.isCurrentMonth && (
                                        <div className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-sys-accent" />
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-sys-onSurfaceVar">
                <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-sys-success/20 flex items-center justify-center">
                        <Check size={12} className="text-sys-success" />
                    </div>
                    <span>Complete</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-sys-accent/20 flex items-center justify-center">
                        <Dumbbell size={10} className="text-sys-accent" />
                    </div>
                    <span>Partial</span>
                </div>
            </div>
        </div>
    );
};
