/**
 * ProgramSelector Component
 *
 * Displays available workout programs and allows users to switch between them.
 * Shows the current program and provides a modal for program selection.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ChevronRight, Check, Clock, Target, Dumbbell, X, Plus, Loader2 } from './icons';
import { useProgram } from '../context/ProgramContext';
import { useHaptic } from '../hooks';
import type { ProgramManifest } from '../services/programRegistry';
import { importProgram } from '../utils/programImportExport';

// ============================================================================
// SAMPLE PROGRAMS CONFIG
// ============================================================================

interface SampleProgramInfo {
  id: string;
  name: string;
  description: string;
  durationWeeks: number;
  targetLevel: string;
  path: string;
}

/**
 * Get the correct path for sample programs based on the base URL
 */
/**
 * Available sample programs that can be imported
 */
const SAMPLE_PROGRAMS: SampleProgramInfo[] = [
  {
    id: 'power-clean-bench-10-week',
    name: '10-Week Strength & Conditioning',
    description:
      'Power Clean / Bench focused 10-week power-strength block with Monday bench emphasis, Wednesday and Friday jump or sprint primers, elbow-aware loading, and support running that nudges 5k fitness without interfering with the main work.',
    durationWeeks: 10,
    targetLevel: 'advanced',
    path: `${import.meta.env.BASE_URL}power-clean-bench.json`,
  },
];

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
    'beginner': 'bg-sys-successContainer text-sys-onSuccessContainer',
    'intermediate': 'bg-sys-tertiaryContainer text-sys-onTertiaryContainer',
    'advanced': 'bg-sys-errorContainer text-sys-onErrorContainer',
    'all-levels': 'bg-sys-secondaryContainer text-sys-onSecondaryContainer',
  };
  return colors[level] || 'bg-sys-primaryContainer text-sys-onPrimaryContainer';
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
      role="option"
      aria-selected={isActive}
      aria-label={`${program.name}${isActive ? ' (Active)' : ''}, ${program.durationWeeks} weeks, ${getTargetLevelLabel(program.targetLevel)}`}
      className={`w-full p-4 rounded-md border text-left transition-all ${
        isActive
          ? 'bg-sys-surfaceContainerHigh border-sys-onSurface'
          : 'bg-sys-surfaceContainerLow border-sys-outlineVariant hover:border-sys-outline active:scale-[0.99]'
      } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-sys-onSurface truncate">{program.name}</h4>
            {isActive && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-sys-onSurface text-sys-surface text-xs font-bold border border-sys-onSurface" aria-hidden="true">
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
            <span className="flex items-center gap-1 text-xs text-sys-onSurfaceVar text-mono-stat">
              <Clock size={12} aria-hidden="true" />
              {program.durationWeeks} weeks
            </span>

            {/* Target Level */}
            <span className={`px-2 py-0.5 rounded-sm text-xs font-medium border border-sys-outlineVariant ${getTargetLevelColor(program.targetLevel)}`}>
              {getTargetLevelLabel(program.targetLevel)}
            </span>

            {/* Goals */}
            {program.goals.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-sys-onSurfaceVar">
                <Target size={12} aria-hidden="true" />
                {program.goals.slice(0, 2).map(g => g.replace(/-/g, ' ')).join(', ')}
                {program.goals.length > 2 && ` +${program.goals.length - 2}`}
              </span>
            )}
          </div>
        </div>

        {/* Selection indicator */}
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-colors ${
            isActive ? 'bg-sys-onSurface border-sys-onSurface' : 'border-sys-outline'
          }`}
          aria-hidden="true"
        >
          {isActive && <Check size={14} className="text-sys-surface" />}
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
  onRefresh: () => void;
  isLoading: boolean;
}

function ProgramSelectorModal({
  isOpen,
  onClose,
  programs,
  currentProgramId,
  onSelect,
  onRefresh,
  isLoading,
}: ProgramSelectorModalProps): React.ReactElement | null {
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSamplePrograms, setShowSamplePrograms] = useState(false);
  const haptic = useHaptic();

  // Get list of programs that can be imported (not already installed)
  const installedProgramIds = new Set(programs.map(p => p.id));
  const availableSamplePrograms = SAMPLE_PROGRAMS.filter(p => !installedProgramIds.has(p.id));

  const handleSelect = async (programId: string) => {
    if (programId === currentProgramId) return;

    setSelectingId(programId);
    setErrorMessage(null);
    try {
      await onSelect(programId);
      haptic.success();
      onClose();
    } catch (error) {
      haptic.error();
      const message = error instanceof Error ? error.message : 'Failed to switch program';
      setErrorMessage(message);
    } finally {
      setSelectingId(null);
    }
  };

  const handleImportSampleProgram = async (sample: SampleProgramInfo) => {
    setImportingId(sample.id);
    setErrorMessage(null);

    try {
      // Fetch the program JSON
      const response = await fetch(sample.path);
      if (!response.ok) {
        throw new Error(`Failed to load program: ${response.statusText}`);
      }
      const programJson = await response.json();

      // Import the program
      const result = await importProgram(programJson, { setActive: false });

      if (!result.success) {
        throw new Error(result.errors.join(', '));
      }

      // Refresh the program list
      onRefresh();

      haptic.success();
      // Switch to the newly imported program
      if (result.manifest) {
        await onSelect(result.manifest.id);
      }
      onClose();
    } catch (error) {
      haptic.error();
      const message = error instanceof Error ? error.message : 'Failed to import program';
      setErrorMessage(message);
    } finally {
      setImportingId(null);
    }
  };

  const handleClose = () => {
    haptic.tick();
    setErrorMessage(null);
    setShowSamplePrograms(false);
    onClose();
  };

  // Lock body scroll while the modal is open so the page behind doesn't
  // scroll on mobile (which can drag the modal off-screen and make footer
  // buttons unreachable). Also wire up Escape to close.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="program-selector-title"
    >
      <div
        className="w-full max-w-md modal-dialog rounded-t-3xl max-h-[85dvh] flex flex-col animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-sys-outlineVariant">
          <h3 id="program-selector-title" className="text-lg font-bold text-sys-onSurface">
            {showSamplePrograms ? 'Add New Program' : 'Select Program'}
          </h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-sys-surfaceContainer transition-colors"
            aria-label="Close program selector"
          >
            <X size={20} className="text-sys-onSurfaceVar" />
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-sys-errorContainer border border-sys-error/20 text-sys-onErrorContainer text-sm" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3">
          {showSamplePrograms ? (
            /* Sample Programs List */
            <>
              <button
                onClick={() => setShowSamplePrograms(false)}
                className="flex items-center gap-2 text-sm text-sys-primary mb-2"
              >
                <ChevronRight size={16} className="rotate-180" />
                Back to my programs
              </button>

              {availableSamplePrograms.length === 0 ? (
                <div className="text-center py-8">
                  <Check size={48} className="mx-auto text-sys-success/50 mb-3" />
                  <p className="text-sys-onSurfaceVar">All sample programs installed</p>
                  <p className="text-sm text-sys-onSurfaceVar/70 mt-1">
                    You've added all available sample programs
                  </p>
                </div>
              ) : (
                availableSamplePrograms.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleImportSampleProgram(sample)}
                    disabled={importingId !== null}
                    className={`w-full p-4 rounded-2xl border text-left transition-all bg-sys-surfaceContainerLow border-sys-outlineVariant hover:border-sys-primary/30 active:scale-[0.98] ${
                      importingId === sample.id ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-semibold text-sys-onSurface truncate">{sample.name}</h4>
                        </div>
                        <p className="text-sm text-sys-onSurfaceVar line-clamp-2 mb-3">
                          {sample.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-sys-onSurfaceVar">
                            <Clock size={12} aria-hidden="true" />
                            {sample.durationWeeks} weeks
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTargetLevelColor(sample.targetLevel)}`}>
                            {getTargetLevelLabel(sample.targetLevel)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sys-primaryContainer flex items-center justify-center">
                        {importingId === sample.id ? (
                          <Loader2 size={20} className="text-sys-primary animate-spin" />
                        ) : (
                          <Plus size={20} className="text-sys-primary" />
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </>
          ) : (
            /* Installed Programs List */
            <>
              {programs.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell size={48} className="mx-auto text-sys-onSurfaceVar/50 mb-3" />
                  <p className="text-sys-onSurfaceVar">No programs available</p>
                  <p className="text-sm text-sys-onSurfaceVar/70 mt-1">
                    Add a program to get started
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
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!showSamplePrograms && (
          <div className="shrink-0 p-4 border-t border-sys-outlineVariant space-y-3 safe-pb">
            <button
              onClick={() => {
                haptic.tick();
                setShowSamplePrograms(true);
              }}
              className="w-full h-12 rounded-xl bg-sys-surfaceContainerLow text-sys-onSurface font-medium flex items-center justify-center gap-2 border border-sys-outlineVariant active:scale-[0.98] transition-transform hover:border-sys-primary/30"
            >
              <Plus size={18} />
              Add New Program
              {availableSamplePrograms.length > 0 && (
                <span className="text-xs bg-sys-primaryContainer text-sys-onPrimaryContainer px-2 py-0.5 rounded-full ml-1">
                  {availableSamplePrograms.length}
                </span>
              )}
            </button>
          </div>
        )}
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
  const { currentProgram, availablePrograms, switchProgram, refreshPrograms, isLoading } = useProgram();
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
          className={`w-full p-4 rounded-2xl bg-sys-surfaceContainerLow border border-sys-outlineVariant shadow-elevation-1 hover:border-sys-primary/40 hover:shadow-elevation-2 active:scale-[0.98] transition-all text-left ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-sys-primaryContainer ring-1 ring-sys-outlineVariant flex items-center justify-center">
                <Dumbbell size={20} className="text-sys-primary" />
              </div>
              <div>
                <p className="text-xs text-sys-onSurfaceVar mb-0.5">Current Program</p>
                <p className="text-base font-semibold text-sys-onSurface">
                  {currentProgram?.name || 'No program selected'}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-sys-onSurfaceVar" />
          </div>

          {currentProgram && (
            <div className="mt-3 pt-3 border-t border-sys-outlineVariant flex items-center gap-3">
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
          onRefresh={refreshPrograms}
          isLoading={isLoading}
        />
      </>
    );
  }

  // Get installed program IDs
  const installedProgramIds = new Set(availablePrograms.map(p => p.id));

  // Sample programs that haven't been installed yet
  const uninstalledSamplePrograms = SAMPLE_PROGRAMS.filter(p => !installedProgramIds.has(p.id));

  // Full variant - inline list showing all programs (installed + available)
  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Installed Programs */}
        {availablePrograms.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            isActive={program.id === currentProgram?.id}
            onSelect={() => handleProgramSelect(program.id)}
            isLoading={isLoading}
          />
        ))}

        {/* Available Sample Programs (not yet installed) */}
        {uninstalledSamplePrograms.length > 0 && (
          <>
            {availablePrograms.length > 0 && (
              <div className="pt-2 pb-1">
                <p className="text-xs text-sys-onSurfaceVar uppercase tracking-wider font-medium">
                  Available Programs
                </p>
              </div>
            )}
            {uninstalledSamplePrograms.map((sample) => (
              <SampleProgramCard
                key={sample.id}
                sample={sample}
                onImport={async () => {
                  try {
                    const response = await fetch(sample.path);
                    if (!response.ok) throw new Error(`Failed to load: ${response.statusText}`);
                    const programJson = await response.json();
                    const result = await importProgram(programJson, { setActive: true });
                    if (!result.success) throw new Error(result.errors.join(', '));
                    refreshPrograms();
                    if (result.manifest) {
                      await switchProgram(result.manifest.id);
                      onProgramChange?.(result.manifest.id);
                    }
                  } catch (error) {
                    console.error('Failed to import program:', error);
                  }
                }}
              />
            ))}
          </>
        )}

        {/* Empty state */}
        {availablePrograms.length === 0 && uninstalledSamplePrograms.length === 0 && (
          <div className="text-center py-8 bg-sys-surfaceContainerLow rounded-2xl border border-sys-outlineVariant">
            <Dumbbell size={48} className="mx-auto text-sys-onSurfaceVar/50 mb-3" />
            <p className="text-sys-onSurfaceVar">No programs available</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SAMPLE PROGRAM CARD COMPONENT
// ============================================================================

interface SampleProgramCardProps {
  sample: SampleProgramInfo;
  onImport: () => Promise<void>;
}

function SampleProgramCard({ sample, onImport }: SampleProgramCardProps): React.ReactElement {
  const [isImporting, setIsImporting] = useState(false);
  const haptic = useHaptic();

  const handleImport = async () => {
    setIsImporting(true);
    haptic.bump();
    try {
      await onImport();
      haptic.success();
    } catch {
      haptic.error();
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <button
      onClick={handleImport}
      disabled={isImporting}
      className={`w-full p-4 rounded-2xl border text-left transition-all bg-sys-surfaceContainerLow border-sys-outlineVariant hover:border-sys-primary/30 active:scale-[0.98] ${
        isImporting ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-sys-onSurface truncate">{sample.name}</h4>
          </div>
          <p className="text-sm text-sys-onSurfaceVar line-clamp-2 mb-3">
            {sample.description}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-sys-onSurfaceVar">
              <Clock size={12} aria-hidden="true" />
              {sample.durationWeeks} weeks
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTargetLevelColor(sample.targetLevel)}`}>
              {getTargetLevelLabel(sample.targetLevel)}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sys-primaryContainer flex items-center justify-center">
          {isImporting ? (
            <Loader2 size={20} className="text-sys-primary animate-spin" />
          ) : (
            <Plus size={20} className="text-sys-primary" />
          )}
        </div>
      </div>
    </button>
  );
}
