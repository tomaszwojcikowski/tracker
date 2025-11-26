import React, { useEffect, useMemo, useState } from 'react';
import { FloatingTimer } from '../FloatingTimer';
import { ActionBar } from '../ActionBar';
import { ExerciseListItem } from './ExerciseListItem';
import { safeGetJSON, safeSetJSON } from '../../utils/storage';
import { useHaptic, useSwipe, useDebounce, useLucideIcons } from '../../hooks';
import {
    DEBOUNCE_DELAY_MS,
    MAX_SETS,
    };

    ```
    const [addedExercises, setAddedExercises] = useState<AddedExercise[]>([]);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
    const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<MuscleFilter>('all');
    const [showExerciseHistory, setShowExerciseHistory] = useState<string | null>(null);
    const [workoutNotes, setWorkoutNotes] = useState('');

    const haptic = useHaptic();

    const swipeHandlers = useSwipe({
        onSwipeRight: () => {
            haptic.tick();
            onComplete();
        },
    });

    const debouncedExerciseSearch = useDebounce(
        exerciseSearchTerm,
        DEBOUNCE_DELAY_MS
    );

    useLucideIcons([
        collapsedExercises,
        showTimerToast,
        showExerciseSelector,
        showExerciseHistory,
        week,
        day,
        addedExercises,
        logs,
        timerSeconds,
        timerActive,
        emomSeconds,
        emomActive,
        emomInterval,
    ]);

    useEffect(() => {
        const parsedLogs = safeGetJSON<WorkoutSessionData>(sessionKey, {} as WorkoutSessionData);
        if (parsedLogs && typeof parsedLogs === 'object') {
            setLogs(parsedLogs);
            setAddedExercises(normalizeAddedExercises(parsedLogs.addedExercises));
            setWorkoutNotes(typeof parsedLogs.workoutNotes === 'string' ? parsedLogs.workoutNotes : '');
        } else {
            setLogs({});
            setAddedExercises([]);
            setWorkoutNotes('');
        }
    }, [sessionKey]);

    useEffect(() => {
        if (timerActive && timerSeconds > 0) {
            const interval = setInterval(() => setTimerSeconds((s) => s - 1), 1000);
            return () => clearInterval(interval);
        }
        if (timerSeconds === 0 && timerActive) {
            setTimerActive(false);
            haptic.timer();
            setShowTimerToast(true);
        }
    }, [timerActive, timerSeconds, haptic]);

    useEffect(() => {
        if (emomActive && emomSeconds > 0) {
            const interval = setInterval(() => {
                setEmomSeconds((s) => {
                    const newValue = s - 1;
                    if (newValue <= 5 && newValue >= 1) {
                        playTickSound();
                    }
                    return newValue;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
        if (emomSeconds === 0 && emomActive) {
            setEmomSeconds(emomInterval);
            haptic.timer();
            playBeepSound();
        }
    }, [emomActive, emomSeconds, emomInterval, haptic]);

    useEffect(() => {
        safeSetJSON('emom_interval', emomInterval);
    }, [emomInterval]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
        haptic.bump();
        const allExercises: string[] = [];
        workout.sections.forEach((section) => {
            section.exercises.forEach((ex) => {
                const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                const sets = getExerciseLogEntry(logs, exId).sets || [];
                const allComplete = sets.length > 0 && sets.every((s) => s);
                if (!allComplete) {
                    allExercises.push(exId);
                }
            });
        });

        if (allExercises.length > 0 && typeof document !== 'undefined') {
            const nextExId = allExercises[0];
            const element = document.getElementById(nextExId);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const addExerciseToWorkout = (
        exercise: Exercise,
        sets = 3,
        weight = ''
    ) => {
        try {
            if (!exercise || !exercise.id || !exercise.name) {
                            day,
                            sets: completedSets,
                            totalSets,
                            weight: parseWeight(exLog.weight) ?? undefined,
                            prescription: ex.prescription,
                            isBodyweight: ex.isBodyweight,
                        });
                    }
                });
            });

            addedExercises.forEach((ex) => {
                const exId = `added_${ex.id}`;
                const exLog = getExerciseLogEntry(updatedLogs, exId);
                const sets = exLog.sets || [];
                const completedSets = sets.filter((s) => s).length;
                const totalSets = sets.length || ex.sets || 0;

                exerciseSummary.push({
                    name: `${ex.name} (Added)`,
                    prescription: `${ex.sets} sets`,
                    completedSets,
                    totalSets,
                    weight: ex.weight || exLog.weight || null,
                });

                if (completedSets > 0) {
                    updateExerciseHistory(ex.name, {
                        date: completionDate,
                        week,
                        day,
                        sets: completedSets,
                        totalSets,
                        weight: parseWeight(ex.weight || exLog.weight) ?? undefined,
                        prescription: `${ex.sets} sets`,
                        isBodyweight: ex.isBodyweight,
                    });
                }
            });

            const historyEntry = {
                week,
                day,
                date: completionDate,
                title: workout.title,
                exercises: exerciseSummary,
                workoutNotes: workoutNotes || null,
            };

            const history = safeGetJSON('global_history', [] as unknown[]) as unknown[];
            const cleanHistory = Array.isArray(history)
                ? history.filter((h: any) => !(h?.week === week && h?.day === day))
                : [];
            cleanHistory.push(historyEntry);
            safeSetJSON('global_history', cleanHistory);

            onComplete();
        } catch (error) {
            console.error('Failed to complete workout:', error);
            alert('Failed to save workout completion. Please try again.');
        }
    };

    const hasIncompleteExercises = workout.sections.some((section) =>
        section.exercises.some((ex) => {
            const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
            const sets = getExerciseLogEntry(logs, exId).sets || [];
            return sets.length === 0 || !sets.every((s) => s);
        })
    );

    const filteredExercises = useMemo(() => {
        const normalizedFilter = selectedMuscleFilter.toLowerCase();
        const searchTerm = debouncedExerciseSearch.toLowerCase();

        return exerciseLibrary.filter((ex) => {
            const nameMatch = ex.name.toLowerCase().includes(searchTerm);
            const muscleMatch = ex.primaryMuscles.some((m) => m.toLowerCase().includes(searchTerm));
            const searchMatch = !searchTerm || nameMatch || muscleMatch;

            const category = String(ex.category || '').toLowerCase();
            const categoryMatch = normalizedFilter === 'all' || category === normalizedFilter;

            return searchMatch && categoryMatch;
        });
    }, [exerciseLibrary, debouncedExerciseSearch, selectedMuscleFilter]);

    return (
        <>
            <FloatingTimer
                seconds={timerSeconds}
                active={timerActive}
                onStop={() => {
                    haptic.bump();
                    setTimerActive(false);
                    setTimerSeconds(0);
                }}
                onAddTime={() => {
                    haptic.bump();
                    setTimerSeconds((s) => s + 30);
                }}
            />

            <div {...swipeHandlers} className="px-5 pb-32 pt-6">
                {hasIncompleteExercises && (
                    <div className="mb-6">
                        <button
                            onClick={scrollToNextIncompleteExercise}
                            className="w-full h-12 px-6 rounded-xl border border-sys-accent/30 text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform btn-gradient-primary btn-dimmed"
                        >
                            <i data-lucide="arrow-down-circle" width="20"></i>
                            <span>Jump to Next Exercise</span>
                        </button>
                    </div>
                )}

                <div className="mb-6">
                    <div className="bg-sys-surface rounded-3xl border border-white/5 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <i data-lucide="file-text" width="18" className="text-sys-accent"></i>
                            <label className="text-sm font-bold text-white uppercase tracking-wider">Workout Notes</label>
                        </div>
                        <textarea
                            value={workoutNotes}
                            onChange={(event) => {
                                const value = event.target.value;
                                setWorkoutNotes(value);
                                const updatedLogs: WorkoutSessionData = {
                                    ...logs,
                                    workoutNotes: value,
                                    lastModified: new Date().toISOString(),
                                };
                                persistLogs(updatedLogs);
                            }}
                            placeholder="Add notes about today's workout (e.g., how you felt, form cues, adjustments)..."
                            className="w-full bg-sys-surfaceHigh rounded-xl px-4 py-3 text-white placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-accent transition-all resize-none"
                            rows={3}
                        ></textarea>
                    </div>
                </div>

                {workout.sections.map((section, sIdx) => {
                    const isEMOM = (ex: typeof section.exercises[number]) =>
                        ex && ((ex.notes && ex.notes.toLowerCase().includes('emom')) || (ex.name && ex.name.toLowerCase().includes('emom')));

                    const exercisesWithSuperset = [] as Array<
                        typeof section.exercises[number] & {
                            supersetLabel: string | null;
                            supersetPosition: 'first' | 'middle' | 'last' | null;
                        }
                    >;
                    let currentSupersetStart = -1;

                    section.exercises.forEach((ex, idx) => {
                        const exIsEMOM = isEMOM(ex);
                        const prevIsEMOM = idx > 0 && isEMOM(section.exercises[idx - 1]);
                        const nextIsEMOM = idx < section.exercises.length - 1 && isEMOM(section.exercises[idx + 1]);

                        let supersetLabel: string | null = null;
                        let supersetPosition: 'first' | 'middle' | 'last' | null = null;

                        if (exIsEMOM) {
                            if (!prevIsEMOM) {
                                currentSupersetStart = idx;
                            }

                            if (prevIsEMOM || nextIsEMOM) {
                                const positionInSuperset = idx - currentSupersetStart;
                                supersetLabel = `B${positionInSuperset + 1}`;

                                if (!prevIsEMOM && nextIsEMOM) {
                                    supersetPosition = 'first';
                                } else if (prevIsEMOM && nextIsEMOM) {
                                    supersetPosition = 'middle';
                                } else if (prevIsEMOM && !nextIsEMOM) {
                                    supersetPosition = 'last';
                                }
                            }
                        }

                        exercisesWithSuperset.push({ ...ex, supersetLabel, supersetPosition });
                    });

                    const sectionExercises = section.exercises.length;
                    let sectionCompletedExercises = 0;
                    section.exercises.forEach((ex) => {
                        const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                        const sets = getExerciseLogEntry(logs, exId).sets || [];
                        if (sets.length > 0 && sets.every((s) => s)) {
                            sectionCompletedExercises++;
                        }
                    });
                    const sectionProgress = sectionExercises > 0 ? (sectionCompletedExercises / sectionExercises) * 100 : 0;

                    return (
                        <div key={sIdx} className="mb-10">
                            <div className="mb-5">
                                <div className="flex items-center gap-3 mb-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                                section.type === 'prep'
                                                    ? 'bg-sys-accent/10'
                                                    : section.type === 'main'
                                                    ? 'bg-sys-success/10'
                                                    : section.type === 'cool'
                                                    ? 'bg-sys-accent/10'
                                                    : 'bg-sys-surfaceHigh'
                                            }`}
                                        >
                                            <i
                                                data-lucide={
                                                    section.type === 'prep'
                                                        ? 'zap'
                                                        : section.type === 'main'
                                                        ? 'dumbbell'
                                                        : section.type === 'cool'
                                                        ? 'wind'
                                                        : 'activity'
                                                }
                                                width="16"
                                                className={
                                                    section.type === 'prep'
                                                        ? 'text-sys-accent'
                                                        : section.type === 'main'
                                                        ? 'text-sys-success'
                                                        : section.type === 'cool'
                                                        ? 'text-sys-accent'
                                                        : 'text-white'
                                                }
                                            ></i>
                                        </div>
                                        <span className="text-base font-bold text-white uppercase tracking-wide">{section.name}</span>
                                    </div>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                                    {sectionProgress > 0 && (
                                        <span className="text-xs font-bold text-sys-onSurfaceVar">
                                            {sectionCompletedExercises}/{sectionExercises}
                                        </span>
                                    )}
                                </div>
                                {sectionProgress > 0 && (
                                    <div className="h-1 bg-sys-surfaceHigh rounded-full overflow-hidden mx-1">
                                        <div
                                            className="h-full bg-gradient-to-r from-sys-accent to-sys-success transition-all duration-500"
                                            style={{ width: `${sectionProgress}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-5">
                                {exercisesWithSuperset.map((ex, eIdx) => {
                                    const defaultSets = ex.sets || 3;
                                    const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                                    const exerciseLog = getExerciseLogEntry(logs, exId);
                                    const currentSetArray = exerciseLog.sets || new Array(defaultSets).fill(false);
                                    const completedSets = currentSetArray.filter((s) => s).length;
                                    const totalSets = currentSetArray.length;
                                    const hasHistory = getExerciseHistory(ex.name).length > 0;

                                    return (
                                        <div key={eIdx} id={exId} className="relative scroll-mt-20">
                                            {ex.supersetPosition && (
                                                <div
                                                    className="absolute left-4 top-0 w-[3px] rounded-full z-0 gradient-vertical-primary"
                                                    style={{
                                                        height:
                                                            ex.supersetPosition === 'first'
                                                                ? 'calc(50% + 1.25rem)'
                                                                : ex.supersetPosition === 'last'
                                                                ? 'calc(50% + 1.25rem)'
                                                                : 'calc(100% + 1.25rem)',
                                                        top: ex.supersetPosition === 'first' ? '50%' : '-1.25rem',
                                                    }}
                                                ></div>
                                            )}

                                            <div
                                                className={`bg-sys-surface rounded-3xl p-6 border relative z-10 overflow-hidden ${
                                                    completedSets === totalSets
                                                        ? 'border-sys-success/30 bg-sys-success/5'
                                                        : ex.supersetLabel
                                                        ? 'border-sys-accent/20'
                                                        : 'border-white/5'
                                                }`}
                                            >
                                                {completedSets > 0 && (
                                                    <div
                                                        className="progress-bar"
                                                        style={{ width: `${(completedSets / totalSets) * 100}%` }}
                                                    ></div>
                                                )}

                                                {ex.supersetLabel && (
                                                    <div className="absolute -left-2 top-6 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white z-20 btn-gradient-primary">
                                                        {ex.supersetLabel}
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start mb-6">
                                                    <div className={`flex-1 pr-2 ${ex.supersetLabel ? 'pl-8' : ''}`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (hasHistory) {
                                                                        haptic.tick();
                                                                        setShowExerciseHistory(ex.name);
                                                                    }
                                                                }}
                                                                className={`text-left ${hasHistory ? 'cursor-pointer active:opacity-70 transition-opacity' : 'cursor-default'}`}
                                                                aria-label={hasHistory ? `${ex.name} - tap to view history` : ex.name}
                                                            >
                                                                <h3 className="text-lg font-semibold text-white leading-snug">{ex.name}</h3>
                                                            </button>
                                                            {completedSets > 0 && (
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                                    completedSets === totalSets
                                                                        ? 'bg-sys-success/20 text-sys-success'
                                                                        : 'bg-sys-accent/10 text-sys-accent'
                                                                }`}>
                                                                    {completedSets}/{totalSets}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {collapsedExercises[exId] ? (
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <p className="text-sm text-sys-onSurfaceVar">{ex.prescription}</p>
                                                                {exerciseLog.weight && (
                                                                    <span className="text-xs font-semibold text-sys-accent">
                                                                        {exerciseLog.weight}kg
                                                                    </span>
                                                                )}
                                                                <div className="flex-1 max-w-[80px] h-1 bg-sys-surfaceHigh rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-sys-success transition-all"
                                                                        style={{ width: `${(completedSets / totalSets) * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="text-base text-sys-onSurfaceVar font-medium">{ex.prescription}</p>
                                                                {ex.notes && <p className="text-sm text-sys-accent mt-2 leading-relaxed">{ex.notes}</p>}
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {hasHistory && !collapsedExercises[exId] && (
                                                            <button
                                                                onClick={() => {
                                                                    haptic.tick();
                                                                    setShowExerciseHistory(ex.name);
                                                                }}
                                                                className="h-10 w-10 min-w-[40px] rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar hover:text-sys-accent flex items-center justify-center active:scale-90 transition-all"
                                                                aria-label="View exercise history"
                                                            >
                                                                <i data-lucide="bar-chart-2" width="18"></i>
                                                            </button>
                                                        )}
                                                        {completedSets === totalSets && (
                                                            <button
                                                                onClick={() => toggleExerciseCollapse(exId)}
                                                                className="h-10 w-10 min-w-[40px] rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                                                                aria-label={collapsedExercises[exId] ? 'Expand exercise' : 'Collapse exercise'}
                                                            >
                                                                <i data-lucide={collapsedExercises[exId] ? 'chevron-down' : 'chevron-up'} width="20"></i>
                                                            </button>
                                                        )}
                                                        {ex.rest > 0 && !collapsedExercises[exId] && (
                                                            <button
                                                                onClick={() => {
                                                                    haptic.bump();
                                                                    setTimerSeconds(ex.rest);
                                                                    setTimerActive(true);
                                                                }}
                                                                className="h-12 min-h-[48px] px-4 rounded-xl bg-sys-surfaceHigh text-white text-sm font-bold flex items-center gap-2 active:bg-sys-onSurfaceVar transition-colors flex-shrink-0"
                                                                aria-label={`Start ${ex.rest} second timer`}
                                                            >
                                                                <i data-lucide="timer" width="16"></i> {ex.rest}s
                                                            </button>
                                                        )}
                                                        {isEMOM(ex) && !collapsedExercises[exId] && (
                                                            <button
                                                                onClick={() => {
                                                                    haptic.bump();
                                                                    setEmomSeconds(emomInterval);
                                                                    setEmomActive(true);
                                                                }}
                                                                className="h-12 min-h-[48px] px-4 rounded-xl bg-sys-accent text-white text-sm font-bold flex items-center gap-2 active:bg-sys-accent/80 transition-colors flex-shrink-0"
                                                                aria-label={`Start EMOM timer with ${emomInterval} second interval`}
                                                            >
                                                                <i data-lucide="clock" width="16"></i> EMOM
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={`exercise-content ${collapsedExercises[exId] ? 'collapsed' : ''}`}>
                                                    <div>
                                                        <div className="flex flex-wrap gap-4 mb-5">
                                                            {currentSetArray.map((isDone, i) => {
                                                                const currentRPE = exerciseLog.rpe?.[i];
                                                                return (
                                                                    <div key={`${exId}-set-${i}`} className="flex flex-col items-center gap-2">
                                                                        <button
                                                                            onClick={() => toggleSet(exId, i, defaultSets, ex.rest)}
                                                                            className={`set-button h-14 w-14 min-w-[56px] min-h-[56px] rounded-2xl flex flex-col items-center justify-center text-base font-bold relative overflow-hidden ${
                                                                                isDone
                                                                                    ? 'completed bg-sys-accent text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                                                                                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                                                            }`}
                                                                            aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                                                        >
                                                                            {isDone ? (
                                                                                <div className="flex flex-col items-center">
                                                                                    <i data-lucide="check" width="20" />
                                                                                    <span className="text-xs mt-0.5">{i + 1}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center">
                                                                                    <div className="h-3 w-3 rounded-full border-2 border-current mb-1"></div>
                                                                                    <span>{i + 1}</span>
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                        {isDone && (
                                                                            <select
                                                                                key={`${exId}-rpe-${i}`}
                                                                                value={currentRPE || ''}
                                                                                onChange={(event) =>
                                                                                    saveRPE(exId, i, event.target.value as RPEValue)
                                                                                }
                                                                                className="w-14 h-7 px-1 bg-sys-surfaceHigh rounded-lg text-white text-xs font-semibold text-center outline-none focus:ring-1 focus:ring-sys-accent"
                                                                                aria-label={`RPE for set ${i + 1}`}
                                                                            >
                                                                                <option value="">RPE</option>
                                                                                <option value="6">6</option>
                                                                                <option value="7">7</option>
                                                                                <option value="8">8</option>
                                                                                <option value="9">9</option>
                                                                                <option value="10">10</option>
                                                                            </select>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                            <button
                                                                onClick={() => addSet(exId, defaultSets)}
                                                                className="h-14 w-14 min-w-[56px] min-h-[56px] rounded-2xl border-2 border-dashed border-white/20 text-white/30 flex items-center justify-center active:bg-white/5 transition-colors"
                                                                aria-label={`Add additional set to ${ex.name}`}
                                                            >
                                                                <i data-lucide="plus" width="22"></i>
                                                            </button>
                                                        </div>

                                                        {currentSetArray.some((s) => !s) && (
                                                            <div className="flex gap-3 mb-5">
                                                                <button
                                                                    onClick={() => completeAllSets(exId, defaultSets)}
                                                                    className="flex-1 h-10 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar text-sm font-semibold flex items-center justify-center gap-2 active:bg-sys-accent/20 transition-colors"
                                                                    aria-label="Complete all sets"
                                                                >
                                                                    <i data-lucide="check-check" width="16"></i>
                                                                    <span>Complete All</span>
                                                                </button>
                                                            </div>
                                                        )}

                                                        {!ex.isBodyweight && (
                                                            <div className="pt-4 border-t border-white/5">
                                                                <label htmlFor={`${exId}-weight`} className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">
                                                                    Load (kg)
                                                                </label>
                                                                <div className="relative flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            haptic.tick();
                                                                            const current = parseFloat(exerciseLog.weight || '0');
                                                                            if (!Number.isNaN(current)) {
                                                                                saveLog(exId, 'weight', Math.max(0, current - WEIGHT_INCREMENT_KG).toString());
                                                                            }
                                                                        }}
                                                                        className="h-14 w-12 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors"
                                                                        aria-label={`Decrease weight by ${WEIGHT_INCREMENT_KG}kg`}
                                                                    >
                                                                        <i data-lucide="minus" width="18"></i>
                                                                    </button>
                                                                    <input
                                                                        id={`${exId}-weight`}
                                                                        type="number"
                                                                        inputMode="decimal"
                                                                        min={0}
                                                                        max={MAX_WEIGHT_KG}
                                                                        step={WEIGHT_STEP}
                                                                        className="bg-sys-surfaceHigh rounded-xl flex-1 min-w-0 h-14 px-3 text-white font-mono text-lg text-center outline-none focus:ring-2 focus:ring-sys-accent transition-all"
                                                                        value={exerciseLog.weight || ''}
                                                                        onChange={(event) => {
                                                                            const value = event.target.value;
                                                                            const numericValue = parseFloat(value);
                                                                            if (
                                                                                value === '' ||
                                                                                (!Number.isNaN(numericValue) && numericValue >= 0 && numericValue <= MAX_WEIGHT_KG)
                                                                            ) {
                                                                                saveLog(exId, 'weight', value);
                                                                            }
                                                                        }}
                                                                        placeholder="0"
                                                                        aria-label="Weight in kilograms"
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            haptic.tick();
                                                                            const current = parseFloat(exerciseLog.weight || '0');
                                                                            if (!Number.isNaN(current) && current < MAX_WEIGHT_KG) {
                                                                                saveLog(
                                                                                    exId,
                                                                                    'weight',
                                                                                    Math.min(MAX_WEIGHT_KG, current + WEIGHT_INCREMENT_KG).toString()
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="h-14 w-12 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors"
                                                                        aria-label={`Increase weight by ${WEIGHT_INCREMENT_KG}kg`}
                                                                    >
                                                                        <i data-lucide="plus" width="18"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {addedExercises.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-5 px-1">
                            <span className="text-sm font-bold text-sys-success uppercase tracking-wider bg-sys-surfaceHigh px-4 py-2 rounded-xl">Added Exercises</span>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-sys-success/20 to-transparent rounded-full"></div>
                        </div>

                        <div className="space-y-5">
                            {addedExercises.map((ex) => {
                                const exId = `added_${ex.id}`;
                                const exerciseLog = getExerciseLogEntry(logs, exId);
                                const currentSetArray = exerciseLog.sets || new Array(ex.sets).fill(false);
                                const completedSets = currentSetArray.filter((s) => s).length;
                                const totalSets = currentSetArray.length;
                                const hasHistory = getExerciseHistory(ex.name).length > 0;

                                return (
                                    <div key={exId} id={exId} className="relative scroll-mt-20">
                                        <div className={`bg-sys-surface rounded-3xl p-6 border relative overflow-hidden ${
                                            completedSets === totalSets ? 'border-sys-success/30 bg-sys-success/5' : 'border-sys-success/20'
                                        }`}>
                                            {completedSets > 0 && (
                                                <div
                                                    className="progress-bar"
                                                    style={{ width: `${(completedSets / totalSets) * 100}%` }}
                                                ></div>
                                            )}

                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex-1 pr-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (hasHistory) {
                                                                    haptic.tick();
                                                                    setShowExerciseHistory(ex.name);
                                                                }
                                                            }}
                                                            className={`text-left ${hasHistory ? 'cursor-pointer active:opacity-70 transition-opacity' : 'cursor-default'}`}
                                                            aria-label={hasHistory ? `${ex.name} - tap to view history` : ex.name}
                                                        >
                                                            <h3 className="text-lg font-semibold text-white leading-snug">{ex.name}</h3>
                                                        </button>
                                                        {completedSets > 0 && (
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                                completedSets === totalSets
                                                                    ? 'bg-sys-success/20 text-sys-success'
                                                                    : 'bg-sys-accent/10 text-sys-accent'
                                                            }`}>
                                                                {completedSets}/{totalSets}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-sys-onSurfaceVar">
                                                        {ex.primaryMuscles.join(', ')} • {ex.equipment.join(', ')}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeAddedExercise(ex.id)}
                                                    className="h-10 w-10 min-w-[40px] rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center active:scale-90 transition-all"
                                                    aria-label="Remove exercise"
                                                >
                                                    <i data-lucide="x" width="20"></i>
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-4 mb-5">
                                                {currentSetArray.map((isDone, i) => (
                                                    <button
                                                        key={`${exId}-set-${i}`}
                                                        onClick={() => toggleSet(exId, i, ex.sets, 90)}
                                                        className={`set-button h-14 w-14 min-w-[56px] min-h-[56px] rounded-2xl flex items-center justify-center text-base font-bold ${
                                                            isDone
                                                                ? 'completed bg-sys-accent text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                                                                : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                                        }`}
                                                        aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                                    >
                                                        {isDone ? <i data-lucide="check" width="24" /> : i + 1}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => addSet(exId, ex.sets)}
                                                    className="h-14 w-14 min-w-[56px] min-h-[56px] rounded-2xl border-2 border-dashed border-white/20 text-white/30 flex items-center justify-center active:bg-white/5 transition-colors"
                                                    aria-label="Add additional set"
                                                >
                                                    <i data-lucide="plus" width="22"></i>
                                                </button>
                                            </div>

                                            {currentSetArray.some((s) => !s) && (
                                                <div className="flex gap-3 mb-5">
                                                    <button
                                                        onClick={() => completeAllSets(exId, ex.sets)}
                                                        className="flex-1 h-10 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar text-sm font-semibold flex items-center justify-center gap-2 active:bg-sys-accent/20 transition-colors"
                                                        aria-label="Complete all sets"
                                                    >
                                                        <i data-lucide="check-check" width="16"></i>
                                                        <span>Complete All</span>
                                                    </button>
                                                </div>
                                            )}

                                            {!ex.isBodyweight && (
                                                <div className="pt-4 border-t border-white/5">
                                                    <label htmlFor={`${exId}-weight`} className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">
                                                        Load (kg)
                                                    </label>
                                                    <div className="relative flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                haptic.tick();
                                                                const current = parseFloat(exerciseLog.weight || ex.weight || '0');
                                                                saveLog(exId, 'weight', Math.max(0, current - 2.5).toString());
                                                            }}
                                                            className="h-14 w-12 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors"
                                                            aria-label="Decrease weight by 2.5kg"
                                                        >
                                                            <i data-lucide="minus" width="18"></i>
                                                        </button>
                                                        <input
                                                            id={`${exId}-weight`}
                                                            type="number"
                                                            inputMode="decimal"
                                                            className="bg-sys-surfaceHigh rounded-xl flex-1 min-w-0 h-14 px-3 text-white font-mono text-lg text-center outline-none focus:ring-2 focus:ring-sys-accent transition-all"
                                                            value={exerciseLog.weight || ex.weight || ''}
                                                            onChange={(event) => saveLog(exId, 'weight', event.target.value)}
                                                            placeholder="0"
                                                            aria-label="Weight in kilograms"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                haptic.tick();
                                                                const current = parseFloat(exerciseLog.weight || ex.weight || '0');
                                                                saveLog(exId, 'weight', (current + 2.5).toString());
                                                            }}
                                                            className="h-14 w-12 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors"
                                                            aria-label="Increase weight by 2.5kg"
                                                        >
                                                            <i data-lucide="plus" width="18"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!logs.completed && (
                    <div className="mb-6">
                        <button
                            onClick={() => {
                                haptic.bump();
                                setShowExerciseSelector(true);
                            }}
                            className="w-full h-12 px-6 rounded-xl bg-sys-success/10 border border-sys-success/30 text-sys-success font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <i data-lucide="plus-circle" width="20"></i>
                            <span>Add Exercise</span>
                        </button>
                    </div>
                )}

                {!logs.completed && (
                    <ActionBar
                        onFinish={handleFinish}
                        timerState={{ time: timerSeconds, active: timerActive }}
                        setTimerActive={setTimerActive}
                        setTimerSeconds={setTimerSeconds}
                        emomState={{ active: emomActive, seconds: emomSeconds, interval: emomInterval }}
                        setEmomActive={setEmomActive}
                        setEmomSeconds={setEmomSeconds}
                        setEmomInterval={setEmomInterval}
                    />
                )}

                {showTimerToast && (
                    <div className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4 safe-pt animate-slide-up">
                        <div className="bg-sys-accent px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 max-w-md w-full border border-white/10">
                            <i data-lucide="check-circle-2" width="24" className="text-white flex-shrink-0"></i>
                            <span className="text-white font-bold text-base flex-1">Rest Complete!</span>
                            <button
                                onClick={() => {
                                    haptic.tick();
                                    setShowTimerToast(false);
                                }}
                                className="h-8 w-8 min-w-[32px] rounded-full hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
                                aria-label="Close notification"
                            >
                                <i data-lucide="x" width="18"></i>
                            </button>
                        </div>
                    </div>
                )}

                {showExerciseSelector && exerciseLibrary.length > 0 && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-slide-up">
                        <div className="bg-sys-surface rounded-t-3xl w-full max-h-[85vh] border-t border-white/10 flex flex-col">
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white">Add Exercise</h3>
                                    <button
                                        onClick={() => {
                                            haptic.tick();
                                            setShowExerciseSelector(false);
                                            setExerciseSearchTerm('');
                                        }}
                                        className="h-10 w-10 rounded-xl bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all"
                                        aria-label="Close"
                                    >
                                        <i data-lucide="x" width="20"></i>
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Search exercises..."
                                    value={exerciseSearchTerm}
                                    onChange={(event) => setExerciseSearchTerm(event.target.value)}
                                    className="w-full h-12 px-4 bg-sys-surfaceHigh rounded-xl text-white placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-accent transition-all"
                                />

                                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                    {MUSCLE_FILTERS.map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setSelectedMuscleFilter(filter)}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                                selectedMuscleFilter === filter
                                                    ? 'bg-sys-accent text-white'
                                                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                            }`}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-3">
                                    {filteredExercises.map((exercise) => (
                                        <ExerciseListItem
                                            key={exercise.id}
                                            exercise={exercise}
                                            onAdd={addExerciseToWorkout}
                                            haptic={haptic}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showExerciseHistory && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-slide-up">
                        <div className="bg-sys-surface rounded-t-3xl w-full max-h-[85vh] border-t border-white/10 flex flex-col">
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-bold text-white">{showExerciseHistory}</h3>
                                    <button
                                        onClick={() => {
                                            haptic.tick();
                                            setShowExerciseHistory(null);
                                        }}
                                        className="h-10 w-10 rounded-xl bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all"
                                        aria-label="Close"
                                    >
                                        <i data-lucide="x" width="20"></i>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {(() => {
                                    const history = getExerciseHistory(showExerciseHistory);
                                    const stats = calculateExerciseStats(showExerciseHistory);

                                    return (
                                        <>
                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                    <div className="text-xs text-sys-onSurfaceVar mb-1">Workouts</div>
                                                    <div className="text-2xl font-bold text-white">{stats.totalWorkouts}</div>
                                                </div>
                                                {stats.maxWeight && (
                                                    <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                        <div className="text-xs text-sys-onSurfaceVar mb-1">Max Weight</div>
                                                        <div className="text-2xl font-bold text-sys-accent">{stats.maxWeight}kg</div>
                                                    </div>
                                                )}
                                            </div>

                                            <h4 className="text-sm font-bold text-white mb-3">Recent History</h4>
                                            <div className="space-y-2">
                                                {history.slice(-5).reverse().map((entry, idx) => (
                                                    <div key={idx} className="bg-sys-surfaceHigh rounded-xl p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="text-sm font-semibold text-white">
                                                                    {new Date(entry.date).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                    })}
                                                                </div>
                                                                <div className="text-xs text-sys-onSurfaceVar">
                                                                    W{entry.week} D{entry.day}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-bold text-white">{entry.sets} sets</div>
                                                                {entry.weight && (
                                                                    <div className="text-xs text-sys-accent font-semibold">{entry.weight}kg</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

interface ExerciseListItemProps {
    exercise: Exercise;
    onAdd: (exercise: Exercise, sets?: number, weight?: string) => void;
    haptic: HapticFeedback;
}

const ExerciseListItem: React.FC<ExerciseListItemProps> = ({ exercise, onAdd, haptic }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [sets, setSets] = useState(3);
    const [weight, setWeight] = useState('');

    return (
        <div className="bg-sys-surfaceHigh rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <h4 className="text-base font-semibold text-white mb-1">{exercise.name}</h4>
                    <p className="text-xs text-sys-onSurfaceVar mb-2">{exercise.primaryMuscles.join(', ')}</p>
                    <div className="flex flex-wrap gap-1">
                        {exercise.equipment.slice(0, 3).map((equipment) => (
                            <span key={equipment} className="text-xs px-2 py-1 bg-sys-surface rounded-lg text-sys-onSurfaceVar">
                                {equipment}
                            </span>
                        ))}
                        {!exercise.isBodyweight && (
                            <span className="text-xs px-2 py-1 bg-sys-accent/10 rounded-lg text-sys-accent">Weighted</span>
                        )}
                    </div>
                </div>

                {!showAddForm ? (
                    <button
                        onClick={() => {
                            haptic.tick();
                            setShowAddForm(true);
                        }}
                        className="h-10 px-4 rounded-xl text-white font-semibold text-sm active:scale-95 transition-transform flex-shrink-0 btn-gradient-primary"
                    >
                        Add
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            haptic.tick();
                            setShowAddForm(false);
                        }}
                        className="h-10 w-10 rounded-xl bg-sys-surface text-sys-onSurfaceVar flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
                        aria-label="Collapse form"
                    >
                        <i data-lucide="chevron-up" width="20"></i>
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">Sets</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={sets}
                                onChange={(event) => setSets(parseInt(event.target.value, 10) || 1)}
                                className="w-full h-10 px-3 bg-sys-surface rounded-xl text-white text-center font-mono outline-none focus:ring-2 focus:ring-sys-accent"
                            />
                        </div>
                        {!exercise.isBodyweight && (
                            <div>
                                <label className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">Weight (kg)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={weight}
                                    onChange={(event) => setWeight(event.target.value)}
                                    placeholder="0"
                                    className="w-full h-10 px-3 bg-sys-surface rounded-xl text-white text-center font-mono outline-none focus:ring-2 focus:ring-sys-accent"
                                />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            haptic.success();
                            onAdd(exercise, sets, weight);
                            setShowAddForm(false);
                            setSets(3);
                            setWeight('');
                        }}
                        className="w-full h-10 rounded-xl text-white font-semibold active:scale-95 transition-transform btn-gradient-success"
                    >
                        Add to Workout
                    </button>
                </div>
            )}
        </div>
    );
};
