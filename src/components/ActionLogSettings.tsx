/**
 * Action Log Settings Component
 *
 * UI for managing user action logs, viewing statistics, and exporting to CSV.
 */

import { useState, useEffect } from 'react';
import { useHaptic } from '../hooks';
import {
  getActionLogStats,
  getActionLogConfig,
  updateActionLogConfig,
  downloadLogsAsCSV,
  clearActionLogs,
  clearOldLogs,
} from '../utils/actionLogger';
import type { ActionLogStats, ActionLogConfig } from '../types';
import { Download, Trash2, Info, ToggleLeft, ToggleRight } from './icons';
import { ConfirmDialog } from './Dialog';

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date to relative time
 */
function formatRelativeDate(dateString: string | undefined): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function ActionLogSettings() {
  const haptic = useHaptic();
  const [stats, setStats] = useState<ActionLogStats | null>(null);
  const [config, setConfig] = useState<ActionLogConfig | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportIncludeMetadata, setExportIncludeMetadata] = useState(true);

  // Load stats and config
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStats(getActionLogStats());
    setConfig(getActionLogConfig());
  };

  const handleToggleLogging = () => {
    if (!config) return;
    haptic.tick();
    updateActionLogConfig({ enabled: !config.enabled });
    refreshData();
  };

  const handleExport = () => {
    haptic.bump();
    downloadLogsAsCSV(undefined, undefined, exportIncludeMetadata);
    setShowExportOptions(false);
  };

  const handleClearOld = () => {
    haptic.bump();
    if (!config) return;
    const removed = clearOldLogs(config.maxAgeDays);
    refreshData();
    alert(`Removed ${removed} old logs`);
  };

  const handleClearAll = () => {
    haptic.bump();
    clearActionLogs();
    refreshData();
    setShowClearConfirm(false);
  };

  if (!stats || !config) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-sys-onSurface mb-1">Action Logs</h3>
          <p className="text-xs text-sys-onSurfaceVar">
            Track user interactions for UX analysis. Logs are stored locally and can be exported for review.
          </p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="bg-sys-surfaceContainerHigh rounded-xl p-4">
        <button
          onClick={handleToggleLogging}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {config.enabled ? (
              <ToggleRight className="text-sys-primary" size={24} />
            ) : (
              <ToggleLeft className="text-sys-onSurfaceVar" size={24} />
            )}
            <div className="text-left">
              <div className="text-sm font-medium text-sys-onSurface">
                {config.enabled ? 'Logging Enabled' : 'Logging Disabled'}
              </div>
              <div className="text-xs text-sys-onSurfaceVar">
                {config.enabled
                  ? 'User actions are being recorded'
                  : 'No actions will be recorded'}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Statistics */}
      <div className="bg-sys-surface rounded-2xl border border-sys-outlineVariant p-4 space-y-3">
        <h4 className="text-sm font-bold text-sys-onSurface uppercase tracking-wider">Statistics</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sys-surfaceContainerHigh rounded-xl p-3">
            <div className="text-xs text-sys-onSurfaceVar mb-1">Total Logs</div>
            <div className="text-2xl font-bold text-sys-onSurface">{stats.totalLogs}</div>
          </div>
          <div className="bg-sys-surfaceContainerHigh rounded-xl p-3">
            <div className="text-xs text-sys-onSurfaceVar mb-1">Storage Used</div>
            <div className="text-2xl font-bold text-sys-onSurface">{formatBytes(stats.storageBytes)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-sys-onSurfaceVar">Oldest Log</span>
            <span className="text-sys-onSurface font-medium">{formatRelativeDate(stats.oldestLog)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-sys-onSurfaceVar">Newest Log</span>
            <span className="text-sys-onSurface font-medium">{formatRelativeDate(stats.newestLog)}</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {stats.totalLogs > 0 && (
        <div className="bg-sys-surface rounded-2xl border border-sys-outlineVariant p-4 space-y-3">
          <h4 className="text-sm font-bold text-sys-onSurface uppercase tracking-wider">By Category</h4>
          <div className="space-y-2">
            {Object.entries(stats.byCategory)
              .filter(([_, count]) => (count as number) > 0)
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 5)
              .map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-xs text-sys-onSurfaceVar capitalize">{category}</span>
                  <span className="text-xs text-sys-onSurface font-medium">{count as number}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Top Actions */}
      {stats.topTypes.length > 0 && (
        <div className="bg-sys-surface rounded-2xl border border-sys-outlineVariant p-4 space-y-3">
          <h4 className="text-sm font-bold text-sys-onSurface uppercase tracking-wider">Top Actions</h4>
          <div className="space-y-2">
            {stats.topTypes.slice(0, 5).map(({ type, count }: { type: string; count: number }) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-xs text-sys-onSurfaceVar">{type.replace(/_/g, ' ')}</span>
                <span className="text-xs text-sys-onSurface font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Info */}
      <div className="bg-sys-surfaceContainerHigh rounded-xl p-4 space-y-2">
        <div className="flex items-start gap-2">
          <Info className="text-sys-primary flex-shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-sys-onSurfaceVar">
            <div>Max logs: {config.maxLogs.toLocaleString()}</div>
            <div>Max age: {config.maxAgeDays} days</div>
            <div>Sampling: {(config.samplingRate * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Export Button */}
        {stats.totalLogs > 0 && (
          <button
            onClick={() => setShowExportOptions(true)}
            className="w-full h-12 rounded-xl bg-sys-primaryContainer text-sys-onPrimaryContainer font-medium flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Download size={18} />
            <span>Export to CSV</span>
          </button>
        )}

        {/* Clear Actions */}
        {stats.totalLogs > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClearOld}
              className="h-12 rounded-xl bg-sys-surfaceContainerHigh text-sys-onSurface font-medium flex items-center justify-center gap-2 transition-transform border border-sys-outlineVariant active:scale-95 text-sm"
            >
              <Trash2 size={16} />
              <span>Clear Old</span>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="h-12 rounded-xl bg-sys-errorContainer text-sys-onErrorContainer font-medium flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm"
            >
              <Trash2 size={16} />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Export Options Dialog */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-sys-surface rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-sys-onSurface">Export Options</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setExportIncludeMetadata(!exportIncludeMetadata)}
                className="w-full flex items-center justify-between p-3 bg-sys-surfaceContainerHigh rounded-xl"
              >
                <span className="text-sm text-sys-onSurface">Include Metadata</span>
                {exportIncludeMetadata ? (
                  <ToggleRight className="text-sys-primary" size={24} />
                ) : (
                  <ToggleLeft className="text-sys-onSurfaceVar" size={24} />
                )}
              </button>
              <p className="text-xs text-sys-onSurfaceVar px-3">
                {exportIncludeMetadata
                  ? 'Full export with all context and metadata columns'
                  : 'Basic export with only essential columns'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowExportOptions(false)}
                className="flex-1 h-12 rounded-xl bg-sys-surfaceContainerHigh text-sys-onSurface font-medium transition-transform active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 h-12 rounded-xl bg-sys-primaryContainer text-sys-onPrimaryContainer font-medium transition-transform active:scale-95"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        title="Clear All Logs?"
        message="This will permanently delete all action logs. This action cannot be undone."
        onConfirm={handleClearAll}
        onClose={() => setShowClearConfirm(false)}
        isOpen={showClearConfirm}
        destructive={true}
        confirmLabel="Clear All"
        cancelLabel="Cancel"
      />
    </div>
  );
}
