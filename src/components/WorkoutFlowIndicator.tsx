/**
 * WorkoutFlowIndicator Component
 *
 * Visual breadcrumb timeline showing workout progress through sections.
 * Provides spatial awareness without taking focus from current exercise.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useHaptic } from '../hooks';

// ============================================================================
// TYPES
// ============================================================================

export interface SectionProgress {
    /** Section name (e.g., "Warm-up", "Main Work") */
    name: string;
    /** Total exercises in section */
    totalExercises: number;
    /** Completed exercises in section */
    completedExercises: number;
    /** Whether this is the current active section */
    isActive?: boolean;
}

export interface WorkoutFlowIndicatorProps {
    /** Array of section progress data */
    sections: SectionProgress[];
    /** Current overall progress (0-100) */
    overallProgress: number;
    /** Callback when a section is tapped to jump to it */
    onSectionTap?: (sectionIndex: number) => void;
    /** Whether the indicator is collapsible */
    collapsible?: boolean;
    /** Initial collapsed state */
    initialCollapsed?: boolean;
}

// ============================================================================
// SECTION DOT COMPONENT
// ============================================================================

interface SectionDotProps {
    filled: boolean;
    isActive: boolean;
    delay: number;
}

const SectionDot: React.FC<SectionDotProps> = ({ filled, isActive, delay }) => (
    <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay, duration: 0.2 }}
        className={`h-2 w-2 rounded-full transition-all duration-300 ${
            filled
                ? 'bg-sys-accent'
                : isActive
                ? 'bg-sys-accent/50 animate-pulse'
                : 'bg-sys-surfaceHigh'
        }`}
    />
);

// ============================================================================
// SECTION INDICATOR COMPONENT
// ============================================================================

interface SectionIndicatorProps {
    section: SectionProgress;
    index: number;
    isLast: boolean;
    onTap?: () => void;
}

const SectionIndicator: React.FC<SectionIndicatorProps> = ({
    section,
    index,
    isLast,
    onTap,
}) => {
    const isComplete = section.completedExercises >= section.totalExercises;
    const hasProgress = section.completedExercises > 0;

    return (
        <div className="flex items-center">
            <button
                onClick={onTap}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                    onTap ? 'hover:bg-white/5 active:scale-95' : ''
                } ${section.isActive ? 'bg-sys-accent/10' : ''}`}
                disabled={!onTap}
            >
                {/* Section name - abbreviated */}
                <span
                    className={`text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                        isComplete
                            ? 'text-sys-accent'
                            : section.isActive
                            ? 'text-white'
                            : 'text-sys-onSurfaceVar'
                    }`}
                >
                    {section.name.length > 8 ? section.name.slice(0, 6) + '…' : section.name}
                </span>

                {/* Exercise dots */}
                <div className="flex items-center gap-0.5">
                    {Array.from({ length: section.totalExercises }).map((_, i) => (
                        <SectionDot
                            key={i}
                            filled={i < section.completedExercises}
                            isActive={!!section.isActive && i === section.completedExercises}
                            delay={index * 0.1 + i * 0.02}
                        />
                    ))}
                </div>
            </button>

            {/* Arrow connector */}
            {!isLast && (
                <span
                    className={`mx-1 text-xs transition-colors ${
                        hasProgress || isComplete ? 'text-sys-accent/50' : 'text-sys-surfaceHigh'
                    }`}
                >
                    →
                </span>
            )}
        </div>
    );
};

// ============================================================================
// COLLAPSED PROGRESS BAR
// ============================================================================

interface CollapsedProgressProps {
    progress: number;
    sections: SectionProgress[];
}

const CollapsedProgress: React.FC<CollapsedProgressProps> = ({ progress, sections }) => {
    // Calculate section boundaries for gradient stops
    const totalExercises = sections.reduce((sum, s) => sum + s.totalExercises, 0);
    let accumulated = 0;

    const sectionBoundaries = sections.map((s) => {
        const start = accumulated / totalExercises;
        accumulated += s.totalExercises;
        const end = accumulated / totalExercises;
        return { start, end, isActive: s.isActive };
    });

    return (
        <div className="relative h-1.5 bg-sys-surfaceHigh rounded-full overflow-hidden">
            {/* Progress fill */}
            <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-sys-accent to-sys-accent/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            />

            {/* Section markers */}
            {sectionBoundaries.slice(0, -1).map((boundary, idx) => (
                <div
                    key={idx}
                    className="absolute top-0 bottom-0 w-px bg-sys-surface"
                    style={{ left: `${boundary.end * 100}%` }}
                />
            ))}
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const WorkoutFlowIndicator: React.FC<WorkoutFlowIndicatorProps> = ({
    sections,
    overallProgress,
    onSectionTap,
    collapsible = true,
    initialCollapsed = false,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
    const haptic = useHaptic();

    // Calculate stats
    const stats = useMemo(() => {
        const totalExercises = sections.reduce((sum, s) => sum + s.totalExercises, 0);
        const completedExercises = sections.reduce((sum, s) => sum + s.completedExercises, 0);
        const activeSection = sections.find((s) => s.isActive);
        return { totalExercises, completedExercises, activeSection };
    }, [sections]);

    const toggleCollapse = () => {
        haptic.tick();
        setIsCollapsed(!isCollapsed);
    };

    if (sections.length === 0) return null;

    return (
        <div className="bg-sys-surface rounded-2xl border border-white/5 overflow-hidden mb-4">
            {/* Collapsible header */}
            {collapsible && (
                <button
                    onClick={toggleCollapse}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-white">
                            {stats.completedExercises}/{stats.totalExercises} exercises
                        </span>
                        {stats.activeSection && (
                            <span className="text-xs text-sys-accent">
                                • {stats.activeSection.name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-sys-accent font-bold">{Math.round(overallProgress)}%</span>
                        {isCollapsed ? (
                            <ChevronDown size={16} className="text-sys-onSurfaceVar" />
                        ) : (
                            <ChevronUp size={16} className="text-sys-onSurfaceVar" />
                        )}
                    </div>
                </button>
            )}

            <AnimatePresence initial={false}>
                {isCollapsed ? (
                    /* Collapsed: Simple progress bar */
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-3"
                    >
                        <CollapsedProgress progress={overallProgress} sections={sections} />
                    </motion.div>
                ) : (
                    /* Expanded: Full section breakdown */
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4"
                    >
                        {/* Section indicators */}
                        <div className="flex flex-wrap items-center gap-y-2">
                            {sections.map((section, idx) => (
                                <SectionIndicator
                                    key={section.name}
                                    section={section}
                                    index={idx}
                                    isLast={idx === sections.length - 1}
                                    onTap={onSectionTap ? () => {
                                        haptic.tick();
                                        onSectionTap(idx);
                                    } : undefined}
                                />
                            ))}
                        </div>

                        {/* Overall progress bar */}
                        <div className="mt-3">
                            <CollapsedProgress progress={overallProgress} sections={sections} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkoutFlowIndicator;
