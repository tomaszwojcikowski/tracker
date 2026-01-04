/**
 * Exercise Detail Modal Component
 *
 * Bottom sheet modal for viewing exercise details, history, and stats.
 * Uses MD3 BottomSheet pattern for consistent mobile UX.
 */

import React, { useMemo, useEffect, useState } from 'react';
import {
    X,
    TrendingUp,
    Calendar,
    Dumbbell,
    Trophy,
    Activity,
    ArrowRightLeft,
    Timer,
    ClipboardList,
    FileText,
    Edit3,
    Save,
    XCircle,
    Gauge,
} from '../icons';
import { getExerciseHistory, calculateExerciseStats } from '../../utils/exerciseHistory';
import type { ExerciseHistoryEntry } from '../../utils/exerciseHistory';
import type { ExerciseDetailMetadata } from '../../types/workout';
import { BottomSheet } from '../BottomSheet';

export interface ExerciseDetailModalProps {
    /** Exercise name to show details for */
    exerciseName: string;
    /** Optional override for which name to use when fetching history */
    historyLookupName?: string;
    /** Original programmed exercise name */
    originalName?: string;
    /** Whether exercise is currently swapped */
    isSwapped?: boolean;
    /** Available alternatives for swapping */
    alternatives?: string[];
    /** Callback to trigger swap flow */
    onSwapExercise?: (originalName: string, alternatives: string[]) => void;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Whether modal is visible */
    isOpen: boolean;
    /** Supplemental metadata for exercise details */
    metadata?: ExerciseDetailMetadata;
    /** Exercise ID for looking up current session notes */
    exerciseId?: string;
    /** Current user notes for this exercise in this session */
    currentUserNotes?: string;
    /** Callback to update user notes */
    onUpdateUserNotes?: (exerciseId: string, notes: string) => void;
}

const extractRepsFromPrescription = (prescription?: string): string | null => {
    if (!prescription) return null;
    if (/amrap/i.test(prescription)) {
        return 'AMRAP';
    }

    const xMatch = prescription.match(/x\s*(\d+(?:\s*-\s*\d+)?)/i);
    if (xMatch?.[1]) {
        return xMatch[1].replace(/\s+/g, '');
    }

    const repsMatch = prescription.match(/(\d+(?:-\d+)?)\s*reps?/i);
    if (repsMatch?.[1]) {
        return repsMatch[1];
    }

    return null;
};

const formatSetsLabel = (entry: ExerciseHistoryEntry): string => {
    if (typeof entry.totalSets === 'number' && entry.totalSets > 0) {
        return `${entry.sets}/${entry.totalSets}`;
    }
    return entry.sets?.toString() ?? '—';
};

const formatWeightLabel = (entry: ExerciseHistoryEntry): string => {
    if (typeof entry.weight === 'number' && entry.weight > 0) {
        return `${entry.weight}kg`;
    }
    if (entry.isBodyweight || !entry.weight || entry.weight === 0) {
        return 'Bodyweight';
    }
    return '—';
};

const formatRestTime = (seconds?: number): string | null => {
    if (!seconds || seconds <= 0) return null;
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
};

const formatLoadRangeLabel = (range?: ExerciseDetailMetadata['loadRange']): string | null => {
    if (!range) return null;
    if (range.unit === 'kg') {
        const value = range.min === range.max ? `${range.min}` : `${range.min}-${range.max}`;
        const suffix = range.perHand ? ' kg per hand' : ' kg';
        return `${value}${suffix}`;
    }
    if (range.unit === 'band') {
        return range.raw || 'Band resistance';
    }
    if (range.unit === 'bodyweight') {
        return 'Bodyweight';
    }
    if (range.unit === 'percent') {
        return `${range.min}%`;
    }
    return range.raw || null;
};

const formatTempoLabel = (tempo?: ExerciseDetailMetadata['tempoRange']): {
    display: string;
    phases: { label: string; value: string }[];
} | null => {
    if (!tempo) return null;
    const display = `${tempo.eccentric}-${tempo.pauseBottom}-${tempo.concentric}-${tempo.pauseTop}`;
    const phases = [
        { label: 'Down', value: `${tempo.eccentric}s` },
        { label: 'Hold', value: `${tempo.pauseBottom}s` },
        { label: 'Up', value: `${tempo.concentric}s` },
        { label: 'Top', value: `${tempo.pauseTop}s` },
    ];
    return { display, phases };
};

/**
 * Enhanced Weight Progress Graph (SVG-based)
 */
const WeightGraph: React.FC<{ data: Array<{ weight: number; date: string }> }> = ({ data }) => {
    const sanitizedData = Array.isArray(data) ? data : [];
    const weightData = sanitizedData.filter((d) => typeof d.weight === 'number' && d.weight > 0);
    const hasGraph = weightData.length >= 2;

    const width = 300;
    const height = 150;
    const padding = 20;

    let graphContent: React.ReactNode = (
        <div className="h-40 flex flex-col items-center justify-center text-sys-onSurfaceVar text-xs gap-2 rounded-xl border border-dashed border-white/10 bg-sys-surfaceHigh/60">
            <Activity size={24} className="opacity-50" />
            <span>Not enough data for graph</span>
        </div>
    );

    if (hasGraph) {
        const weights = weightData.map((d) => d.weight);
        const maxWeight = Math.max(...weights);
        const minWeight = Math.min(...weights);
        const range = maxWeight - minWeight || 1;
        const paddingY = range * 0.1;
        const effectiveMin = Math.max(0, minWeight - paddingY);
        const effectiveMax = maxWeight + paddingY;
        const effectiveRange = effectiveMax - effectiveMin;

        const points = weightData.map((d, i) => {
            const x = padding + (i / (weightData.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((d.weight - effectiveMin) / effectiveRange) * (height - 2 * padding);
            return { x, y };
        });

        const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
        const areaPoints = `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`;

        graphContent = (
            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="graphGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                    <polygon points={areaPoints} fill="url(#graphGradient)" />

                    <polyline
                        points={polylinePoints}
                        fill="none"
                        stroke="var(--color-accent)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2" />
                    ))}
                </svg>

                <div className="absolute top-0 right-0 text-xs font-bold text-sys-accent transform -translate-y-1/2">
                    {maxWeight}kg
                </div>
                <div className="absolute bottom-0 left-0 text-xs text-sys-onSurfaceVar transform translate-y-1/2">
                    {minWeight}kg
                </div>
            </div>
        );
    }

    return (
        <div className="bg-sys-surfaceContainerHigh rounded-xl p-4 border border-sys-outlineVariant">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-sys-onSurface flex items-center gap-2">
                    <TrendingUp size={16} className="text-sys-primary" />
                    Progress
                </h3>
                <span className="text-xs text-sys-onSurfaceVar">
                    {hasGraph ? `Last ${weightData.length} sessions` : 'Complete 2 sessions to unlock'}
                </span>
            </div>
            {graphContent}
        </div>
    );
};

/**
 * Exercise Detail Modal - Bottom sheet for exercise info
 */
export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
    exerciseName,
    historyLookupName,
    originalName,
    isSwapped = false,
    alternatives,
    onSwapExercise,
    onClose,
    isOpen,
    metadata,
    exerciseId,
    currentUserNotes,
    onUpdateUserNotes,
}) => {
    const lookupName = historyLookupName || exerciseName;
    const history = lookupName ? getExerciseHistory(lookupName) : [];
    const stats = calculateExerciseStats(lookupName);
    const canSwap = Boolean(onSwapExercise && alternatives?.length && originalName);

    // State for editing user notes
    const [editingUserNotes, setEditingUserNotes] = useState(false);
    const [userNotesValue, setUserNotesValue] = useState(currentUserNotes || '');

    // Sync user notes when modal opens or currentUserNotes changes
    useEffect(() => {
        setUserNotesValue(currentUserNotes || '');
        setEditingUserNotes(false);
    }, [currentUserNotes, isOpen]);

    const restLabel = formatRestTime(metadata?.restTime);
    const loadLabel = formatLoadRangeLabel(metadata?.loadRange);
    const tempoLabel = formatTempoLabel(metadata?.tempoRange);
    const detailBadges = [
        metadata?.isEmom
            ? {
                  label: 'EMOM',
                  className: 'bg-sys-tertiary/20 text-sys-tertiary border border-sys-tertiary/30',
              }
            : null,
        metadata?.isUnilateral
            ? {
                  label: 'Per Side',
                  className: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
              }
            : null,
        metadata?.isBodyweight
            ? {
                  label: 'Bodyweight',
                  className: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
              }
            : null,
    ].filter((chip): chip is { label: string; className: string } => Boolean(chip));
    const showMetadataCard = Boolean(
        detailBadges.length || metadata?.prescription || restLabel || loadLabel || tempoLabel
    );

    // Prepare graph data (chronological)
    const graphData = useMemo(() => {
        return history
            .filter(h => h.weight && typeof h.weight === 'number')
            .map(h => ({
                weight: h.weight as number,
                date: h.date
            }));
    }, [history]);

    const recentHistory = history.slice(-3).reverse();

    const handleSwapClick = (): void => {
        if (canSwap && originalName && alternatives) {
            onSwapExercise?.(originalName, alternatives);
        }
    };

    const handleSaveUserNotes = (): void => {
        if (exerciseId && onUpdateUserNotes) {
            onUpdateUserNotes(exerciseId, userNotesValue);
            setEditingUserNotes(false);
        }
    };

    const handleCancelEditUserNotes = (): void => {
        setUserNotesValue(currentUserNotes || '');
        setEditingUserNotes(false);
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            ariaLabelledBy="exercise-modal-title"
            maxHeight={85}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-sys-outlineVariant gap-3">
                <div className="min-w-0">
                    <h2 id="exercise-modal-title" className="text-xl font-bold text-sys-onSurface truncate">
                        {exerciseName}
                    </h2>
                    {isSwapped && originalName && (
                        <p className="text-[11px] text-sys-onSurfaceVar mt-0.5 truncate">
                            Swapped from <span className="text-sys-onSurface/80 font-medium">{originalName}</span>
                        </p>
                    )}
                    <p className="text-xs text-sys-onSurfaceVar mt-1">
                        {stats.totalWorkouts} sessions completed
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {canSwap && (
                        <button
                            onClick={handleSwapClick}
                            className="h-8 px-3 rounded-full bg-sys-surfaceContainerHigh text-sys-onSurfaceVar text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all border border-sys-outlineVariant"
                            aria-label="Swap exercise"
                        >
                            <ArrowRightLeft size={14} />
                            <span>Swap</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-full bg-sys-surfaceContainerHigh flex items-center justify-center text-sys-onSurfaceVar active:scale-90 transition-all"
                        aria-label="Close exercise details"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto pb-safe">
                {showMetadataCard && (
                    <div className="bg-sys-surfaceContainerHigh rounded-xl p-4 border border-sys-outlineVariant space-y-4">
                        <div className="flex items-center gap-2 text-sys-onSurface">
                            <ClipboardList size={16} className="text-sys-primary" />
                            <h3 className="text-sm font-bold">Exercise Details</h3>
                        </div>
                        {detailBadges.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {detailBadges.map((badge) => (
                                    <span
                                        key={badge.label}
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}
                                    >
                                        {badge.label}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="space-y-3 text-sm text-sys-onSurfaceVar">
                            {metadata?.prescription && (
                                <div className="flex items-start gap-3">
                                    <Dumbbell size={16} className="mt-0.5 text-sys-primary" />
                                    <div>
                                        <p className="text-xs uppercase tracking-wider opacity-60">Prescription</p>
                                        <p className="font-semibold leading-tight text-sys-onSurface">{metadata.prescription}</p>
                                    </div>
                                </div>
                            )}
                            {restLabel && (
                                <div className="flex items-start gap-3">
                                    <Timer size={16} className="mt-0.5 text-sys-primary" />
                                    <div>
                                        <p className="text-xs uppercase tracking-wider opacity-60">Rest Between Sets</p>
                                        <p className="font-semibold leading-tight text-sys-onSurface">{restLabel}</p>
                                    </div>
                                </div>
                            )}
                            {loadLabel && (
                                <div className="flex items-start gap-3">
                                    <ArrowRightLeft size={16} className="mt-0.5 text-sys-primary" />
                                    <div>
                                        <p className="text-xs uppercase tracking-wider opacity-60">Suggested Load</p>
                                        <p className="font-semibold leading-tight text-sys-onSurface">{loadLabel}</p>
                                    </div>
                                </div>
                            )}
                            {tempoLabel && (
                                <div className="flex items-start gap-3">
                                    <Gauge size={16} className="mt-0.5 text-sys-primary" />
                                    <div>
                                        <p className="text-xs uppercase tracking-wider opacity-60">Tempo</p>
                                        <p className="font-semibold leading-tight font-mono text-sys-onSurface">{tempoLabel.display}</p>
                                        <div className="flex gap-3 mt-1.5">
                                            {tempoLabel.phases.map((phase) => (
                                                <div key={phase.label} className="text-center">
                                                    <span className="text-[10px] opacity-40 uppercase tracking-wide">{phase.label}</span>
                                                    <p className="text-xs font-medium opacity-70">{phase.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {metadata?.notes && (
                    <div className="bg-sys-surfaceContainerHigh rounded-xl p-4 border border-sys-outlineVariant space-y-3">
                        <div className="flex items-center gap-2 text-sys-onSurface">
                            <FileText size={16} className="text-sys-primary" />
                            <h3 className="text-sm font-bold">Coaching Notes</h3>
                        </div>
                        <p className="text-sm leading-relaxed text-sys-onSurfaceVar whitespace-pre-line">
                            {metadata.notes}
                        </p>
                    </div>
                )}

                {/* User Notes Section - Only shown when onUpdateUserNotes is provided */}
                {exerciseId && onUpdateUserNotes && (
                    <div className="bg-sys-surfaceContainerHigh rounded-xl p-4 border border-sys-outlineVariant space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sys-onSurface">
                                <Edit3 size={16} className="text-sys-primary" />
                                <h3 className="text-sm font-bold">My Notes</h3>
                            </div>
                            {!editingUserNotes && (
                                <button
                                    onClick={() => setEditingUserNotes(true)}
                                    className="text-xs font-semibold text-sys-primary px-3 py-1 rounded-full bg-sys-primary/10 active:scale-95 transition-all"
                                    aria-label="Edit notes"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {editingUserNotes ? (
                            <div className="space-y-2">
                                <textarea
                                    value={userNotesValue}
                                    onChange={(e) => setUserNotesValue(e.target.value)}
                                    placeholder="Add your notes about this exercise..."
                                    className="w-full min-h-[100px] bg-sys-surface rounded-lg p-3 text-sm text-sys-onSurface placeholder:text-sys-onSurfaceVar/40 border border-sys-outlineVariant focus:border-sys-primary focus:outline-none resize-y"
                                    autoFocus
                                    aria-label="Exercise notes"
                                    aria-describedby="notes-help-text"
                                />
                                <p id="notes-help-text" className="sr-only">
                                    Enter your personal notes about this exercise. These notes are specific to this workout session.
                                </p>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={handleCancelEditUserNotes}
                                        className="px-4 py-2 rounded-lg bg-sys-surface text-sys-onSurfaceVar text-sm font-semibold active:scale-95 transition-all flex items-center gap-1.5"
                                    >
                                        <XCircle size={14} />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveUserNotes}
                                        className="px-4 py-2 rounded-lg bg-sys-primary text-sys-onPrimary text-sm font-semibold active:scale-95 transition-all flex items-center gap-1.5"
                                    >
                                        <Save size={14} />
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {userNotesValue ? (
                                    <p className="text-sm leading-relaxed text-sys-onSurfaceVar whitespace-pre-line">
                                        {userNotesValue}
                                    </p>
                                ) : (
                                    <p className="text-sm text-sys-onSurfaceVar/40 italic">
                                        No notes yet. Click Edit to add your thoughts about this exercise.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Stats Grid - Only show if there's meaningful data */}
                {(stats.estimated1RM || stats.maxWeight || stats.maxSets !== null) && (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-sys-surfaceContainerHigh rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 opacity-10">
                                <Trophy size={32} />
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-sys-onSurfaceVar mb-1 font-bold">Est. 1RM</div>
                            <div className="text-xl font-bold text-sys-onSurface">
                                {stats.estimated1RM ? (
                                    <span>{stats.estimated1RM}<span className="text-xs font-normal text-sys-onSurfaceVar ml-0.5">kg</span></span>
                                ) : '-'}
                            </div>
                        </div>
                        <div className="bg-sys-surfaceContainerHigh rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 opacity-10">
                                <Dumbbell size={32} />
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-sys-onSurfaceVar mb-1 font-bold">Max Weight</div>
                            <div className="text-xl font-bold text-sys-onSurface">
                                {stats.maxWeight ? (
                                    <span>{stats.maxWeight}<span className="text-xs font-normal text-sys-onSurfaceVar ml-0.5">kg</span></span>
                                ) : '-'}
                            </div>
                        </div>
                        <div className="bg-sys-surfaceContainerHigh rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 opacity-10">
                                <Activity size={32} />
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-sys-onSurfaceVar mb-1 font-bold">Max Sets</div>
                            <div className="text-xl font-bold text-sys-onSurface">
                                {stats.maxSets !== null ? stats.maxSets : '-'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Graph - Only show if there's weight data */}
                {graphData.length > 0 && <WeightGraph data={graphData} />}

                {/* History List - Only show if there's history */}
                {recentHistory.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-sys-onSurface flex items-center gap-2">
                                <Calendar size={16} className="text-sys-primary" />
                                Recent Sessions
                            </h3>
                            <span className="text-[10px] uppercase text-sys-onSurfaceVar font-semibold tracking-wider">Last 3</span>
                        </div>

                        <div className="space-y-3">
                            {recentHistory.map((entry, idx) => {
                                const repsLabel = extractRepsFromPrescription(entry.prescription) ?? '—';
                                const setsLabel = formatSetsLabel(entry);
                                const weightLabel = formatWeightLabel(entry);
                                const isPr = Boolean(stats.maxWeight && entry.weight === stats.maxWeight && entry.weight);
                                const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                });

                                return (
                                    <div key={`${entry.date}-${idx}`} className="bg-sys-surfaceContainerHigh rounded-xl p-4 border border-sys-outlineVariant">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="text-sm font-semibold text-sys-onSurface">{formattedDate}</div>
                                                <div className="text-[11px] text-sys-onSurfaceVar">
                                                    Week {entry.week} • Day {entry.day}
                                                </div>
                                            </div>
                                            {isPr && (
                                                <div className="h-6 px-2 rounded-full bg-sys-primary/20 text-sys-primary text-[10px] font-bold flex items-center border border-sys-primary/30">
                                                    PR
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <div className="text-[10px] uppercase text-sys-onSurfaceVar tracking-wide">Sets</div>
                                                <div className="text-sys-onSurface font-semibold text-sm">{setsLabel}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-sys-onSurfaceVar tracking-wide">Reps</div>
                                                <div className="text-sys-onSurface font-semibold text-sm">{repsLabel}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-sys-onSurfaceVar tracking-wide">Weight</div>
                                                <div className="text-sys-onSurface font-semibold text-sm">{weightLabel}</div>
                                            </div>
                                        </div>
                                        {entry.prescription && (
                                            <p className="text-[11px] text-sys-onSurfaceVar mt-2 text-center">
                                                {entry.prescription}
                                            </p>
                                        )}
                                        {entry.notes && (
                                            <div className="mt-3 pt-3 border-t border-sys-outlineVariant">
                                                <div className="flex items-start gap-2">
                                                    <FileText size={12} className="mt-0.5 text-sys-primary flex-shrink-0" />
                                                    <p className="text-[11px] text-sys-onSurfaceVar leading-relaxed">{entry.notes}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </BottomSheet>
    );
};
