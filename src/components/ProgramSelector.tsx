/**
 * ProgramSelector Component
 *
 * Displays available workout programs and allows users to switch between them.
 * Shows the current program and provides a modal for program selection.
 */

import React, { useState, useCallback } from 'react';
import { ChevronRight, Check, Clock, Target, Dumbbell, X, Download } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { useHaptic } from '../hooks';
import type { ProgramManifest } from '../services/programRegistry';

// ============================================================================
// TYPES
// ============================================================================

export interface ProgramSelectorProps {
  /** Optional callback when program changes */
  onProgramChange?: (programId: string) => void;
  /** Whether to show as a compact card or full selector */
  variant?: 'card' | 'full';
  /** Optional class name for styling */
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a display-friendly target level label
 */
function getTargetLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    'beginner': 'Beginner',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced',
    'all-levels': 'All Levels',
  };
  return labels[level] || level;
}

/**
 * Get a color class for the target level badge
 */
function getTargetLevelColor(level: string): string {
  const colors: Record<string, string> = {
    'beginner': 'bg-green-500/20 text-green-400',
    'intermediate': 'bg-yellow-500/20 text-yellow-400',
    'advanced': 'bg-red-500/20 text-red-400',
    'all-levels': 'bg-blue-500/20 text-blue-400',
  };
  return colors[level] || 'bg-sys-accent/20 text-sys-accent';
}

// ============================================================================
// PROGRAM CARD COMPONENT
// ============================================================================

interface ProgramCardProps {
  program: ProgramManifest;
  isActive: boolean;
  onSelect: () => void;
  isLoading?: boolean;
}

function ProgramCard({ program, isActive, onSelect, isLoading }: ProgramCardProps): React.ReactElement {
  const haptic = useHaptic();

  const handleClick = () => {
    if (!isActive && !isLoading) {
      haptic.bump();
      onSelect();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`w-full p-4 rounded-2xl border text-left transition-all ${
        isActive
          ? 'bg-sys-accent/10 border-sys-accent'
          : 'bg-sys-surface border-white/5 hover:border-white/10 active:scale-[0.98]'
      } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-white truncate">{program.name}</h4>
            {isActive && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sys-accent/20 text-sys-accent text-xs font-medium">
                <Check size={12} />
                Active
              </span>
            )}
          </div>

          {program.description && (
            <p className="text-sm text-sys-onSurfaceVar line-clamp-2 mb-3">
              {program.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {/* Duration */}
            <span className="flex items-center gap-1 text-xs text-sys-onSurfaceVar">
              <Clock size={12} />
              {program.durationWeeks} weeks
            </span>

            {/* Target Level */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTargetLevelColor(program.targetLevel)}`}>
              {getTargetLevelLabel(program.targetLevel)}
            </span>

            {/* Goals */}
            {program.goals.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-sys-onSurfaceVar">
                <Target size={12} />
                {program.goals.slice(0, 2).map(g => g.replace(/-/g, ' ')).join(', ')}
                {program.goals.length > 2 && ` +${program.goals.length - 2}`}
              </span>
            )}
          </div>
        </div>

        {/* Selection indicator */}
        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          isActive ? 'bg-sys-accent border-sys-accent' : 'border-white/20'
        }`}>
          {isActive && <Check size={14} className="text-white" />}
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// PROGRAM SELECTOR MODAL
// ============================================================================

interface ProgramSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  programs: ProgramManifest[];
  currentProgramId: string | null;
  onSelect: (programId: string) => Promise<void>;
  isLoading: boolean;
}

function ProgramSelectorModal({
  isOpen,
  onClose,
  programs,
  currentProgramId,
  onSelect,
  isLoading,
}: ProgramSelectorModalProps): React.ReactElement | null {
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const haptic = useHaptic();

  const handleSelect = async (programId: string) => {
    if (programId === currentProgramId) return;

    setSelectingId(programId);
    try {
      await onSelect(programId);
      haptic.success();
      onClose();
    } catch (error) {
      haptic.error();
      console.error('Failed to switch program:', error);
    } finally {
      setSelectingId(null);
    }
  };

  const handleClose = () => {
    haptic.tick();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-sys-surfaceHigh rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Select Program</h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-sys-surface transition-colors"
          >
            <X size={20} className="text-sys-onSurfaceVar" />
          </button>
        </div>

        {/* Program List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {programs.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell size={48} className="mx-auto text-sys-onSurfaceVar/50 mb-3" />
              <p className="text-sys-onSurfaceVar">No programs available</p>
              <p className="text-sm text-sys-onSurfaceVar/70 mt-1">
                Import a workout plan to get started
              </p>
            </div>
          ) : (
            programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                isActive={program.id === currentProgramId}
                onSelect={() => handleSelect(program.id)}
                isLoading={selectingId === program.id || isLoading}
              />
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <button
            className="w-full h-12 rounded-xl bg-sys-surface text-white font-medium flex items-center justify-center gap-2 border border-white/5 active:scale-[0.98] transition-transform"
            onClick={() => {
              // TODO: Implement program import
              haptic.bump();
              alert('Program import coming soon!');
            }}
          >
            <Download size={18} />
            Import Program
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgramSelector({
  onProgramChange,
  variant = 'card',
  className = '',
}: ProgramSelectorProps): React.ReactElement {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentProgram, availablePrograms, switchProgram, isLoading } = useProgram();
  const haptic = useHaptic();

  const handleOpenModal = useCallback(() => {
    haptic.tick();
    setIsModalOpen(true);
  }, [haptic]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleProgramSelect = useCallback(async (programId: string) => {
    await switchProgram(programId);
    onProgramChange?.(programId);
  }, [switchProgram, onProgramChange]);

  if (variant === 'card') {
    return (
      <>
        <button
          onClick={handleOpenModal}
          className={`w-full p-4 rounded-2xl bg-sys-surface border border-white/5 hover:border-white/10 active:scale-[0.98] transition-all text-left ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sys-accent/10 flex items-center justify-center">
                <Dumbbell size={20} className="text-sys-accent" />
              </div>
              <div>
                <p className="text-xs text-sys-onSurfaceVar mb-0.5">Current Program</p>
                <p className="text-base font-semibold text-white">
                  {currentProgram?.name || 'No program selected'}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-sys-onSurfaceVar" />
          </div>

          {currentProgram && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-sys-onSurfaceVar">
                <Clock size={12} />
                {currentProgram.durationWeeks} weeks
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTargetLevelColor(currentProgram.targetLevel)}`}>
                {getTargetLevelLabel(currentProgram.targetLevel)}
              </span>
            </div>
          )}
        </button>

        <ProgramSelectorModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          programs={availablePrograms}
          currentProgramId={currentProgram?.id ?? null}
          onSelect={handleProgramSelect}
          isLoading={isLoading}
        />
      </>
    );
  }

  // Full variant - inline list
  return (
    <div className={className}>
      <h3 className="text-lg font-bold text-white mb-4">Workout Programs</h3>
      <div className="space-y-3">
        {availablePrograms.length === 0 ? (
          <div className="text-center py-8 bg-sys-surface rounded-2xl border border-white/5">
            <Dumbbell size={48} className="mx-auto text-sys-onSurfaceVar/50 mb-3" />
            <p className="text-sys-onSurfaceVar">No programs available</p>
          </div>
        ) : (
          availablePrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              isActive={program.id === currentProgram?.id}
              onSelect={() => handleProgramSelect(program.id)}
              isLoading={isLoading}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProgramSelector;
