/**
 * TopAppBar Component
 *
 * Enhanced sticky header bar with:
 * - Back button (optional)
 * - Title and subtitle
 * - Workout timer (in workout mode)
 * - Quick menu for settings, theme, and app info
 * - Sync status indicator (when Firebase is configured)
 */

import { ArrowLeft } from 'lucide-react';
import { WorkoutTimerDisplay } from './WorkoutTimerDisplay';
import { QuickMenu } from './QuickMenu';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { useOptimisticSync } from '../hooks/useOptimisticSync';
import { clsx } from 'clsx';

export interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  /** Workout timer props - when provided, shows timer in the header */
  workoutTimer?: {
    elapsedSeconds: number;
    isRunning: boolean;
    onToggle: () => void;
  };
  /** Callback to navigate to settings */
  onNavigateToSettings?: () => void;
  /** Whether to show the quick menu and sync status */
  showActions?: boolean;
}

export function TopAppBar({
  title,
  subtitle,
  onBack,
  showBack = false,
  workoutTimer,
  onNavigateToSettings,
  showActions = true,
}: TopAppBarProps) {
  // Get sync status for display (only check when actions should be shown and not in workout mode)
  const shouldCheckSync = showActions && !workoutTimer;
  const { syncStatus, pendingChanges } = useOptimisticSync({ enabled: false });
  const showSyncStatus = shouldCheckSync && (syncStatus !== 'idle' || pendingChanges);

  return (
    <header className="bg-sys-surface sticky top-0 z-40 safe-pt border-b border-sys-outlineVariant transition-colors duration-200">
      <div className="h-16 flex items-center px-4 gap-3">
        {/* Back Button */}
        {showBack ? (
          <button
            onClick={onBack}
            className="h-12 w-12 -ml-2 text-sys-onSurface rounded-full hover:bg-sys-surfaceVariant/30 active:bg-sys-surfaceVariant/50 transition-colors flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
        ) : null}

        {/* Title and Subtitle */}
        <div className={clsx("flex-1 min-w-0 flex flex-col justify-center", !showBack && "pl-2")}>
          <h1 className="text-title-lg text-sys-onSurface truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-title-sm text-sys-onSurfaceVariant mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Workout Timer - shows when in workout mode */}
          {workoutTimer && (
            <WorkoutTimerDisplay
              elapsedSeconds={workoutTimer.elapsedSeconds}
              isRunning={workoutTimer.isRunning}
              onToggle={workoutTimer.onToggle}
            />
          )}

          {/* Sync Status - shows when Firebase is configured and has activity */}
          {showActions && !workoutTimer && showSyncStatus && (
            <SyncStatusIndicator
              status={syncStatus}
              pendingChanges={pendingChanges}
              compact
            />
          )}

          {/* Quick Menu - shows when not in workout mode */}
          {showActions && !workoutTimer && (
            <QuickMenu onNavigateToSettings={onNavigateToSettings} />
          )}
        </div>
      </div>
    </header>
  );
}
