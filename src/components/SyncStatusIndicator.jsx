/**
 * Sync Status Indicator Component
 *
 * Displays the current cloud sync status with visual feedback.
 * Shows syncing animation, success checkmark, or error state.
 */

import React from 'react';
import { SyncStatus } from '../hooks/useOptimisticSync';

/**
 * Get icon and color based on sync status
 */
function getStatusDisplay(status, pendingChanges) {
  switch (status) {
    case SyncStatus.SYNCING:
      return {
        icon: 'cloud',
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        label: 'Syncing...',
        animate: true,
      };
    case SyncStatus.SUCCESS:
      return {
        icon: 'cloud-check',
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        label: 'Synced',
        animate: false,
      };
    case SyncStatus.ERROR:
      return {
        icon: 'cloud-off',
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        label: 'Sync failed',
        animate: false,
      };
    case SyncStatus.OFFLINE:
      return {
        icon: 'cloud-off',
        color: 'text-gray-400',
        bgColor: 'bg-gray-400/10',
        label: 'Offline',
        animate: false,
      };
    case SyncStatus.IDLE:
    default:
      if (pendingChanges) {
        return {
          icon: 'cloud',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          label: 'Pending sync',
          animate: false,
        };
      }
      return {
        icon: 'cloud',
        color: 'text-sys-onSurfaceVar',
        bgColor: 'bg-sys-surface',
        label: 'Cloud sync',
        animate: false,
      };
  }
}

/**
 * Sync Status Indicator
 * @param {Object} props
 * @param {string} props.status - Current sync status
 * @param {boolean} props.pendingChanges - Whether there are unsaved changes
 * @param {string} props.lastError - Last error message if any
 * @param {Function} props.onRetry - Callback to retry sync
 * @param {boolean} props.compact - Show compact version
 */
export function SyncStatusIndicator({
  status = SyncStatus.IDLE,
  pendingChanges = false,
  lastError = null,
  onRetry = null,
  compact = false,
}) {
  const display = getStatusDisplay(status, pendingChanges);

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${display.color}`}>
        <i
          data-lucide={display.icon}
          className={`w-4 h-4 ${display.animate ? 'animate-pulse' : ''}`}
        />
        {status === SyncStatus.SYNCING && (
          <span className="text-xs">Syncing</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${display.bgColor}`}
      >
        <i
          data-lucide={display.icon}
          className={`w-4 h-4 ${display.color} ${display.animate ? 'animate-pulse' : ''}`}
        />
        <span className={`text-xs font-medium ${display.color}`}>
          {display.label}
        </span>
      </div>

      {status === SyncStatus.ERROR && onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-red-400 hover:text-red-300 underline"
          title={lastError}
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Inline sync status for headers
 */
export function InlineSyncStatus({ status, pendingChanges }) {
  if (status === SyncStatus.IDLE && !pendingChanges) {
    return null;
  }

  const display = getStatusDisplay(status, pendingChanges);

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${display.color}`}
      title={display.label}
    >
      <i
        data-lucide={display.icon}
        className={`w-3 h-3 ${display.animate ? 'animate-pulse' : ''}`}
      />
    </span>
  );
}

export default SyncStatusIndicator;
