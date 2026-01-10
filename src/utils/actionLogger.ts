/**
 * Action Logger Utility
 *
 * Comprehensive user action logging system for UX analysis and improvement.
 * Logs user interactions, navigation, workout activities, and system events
 * with detailed metadata for later analysis by AI agents.
 *
 * Features:
 * - Automatic log rotation (circular buffer)
 * - Configurable sampling and filtering
 * - Privacy-aware (PII filtering)
 * - CSV export capability
 * - Session grouping
 * - Storage management
 */

import type {
  ActionCategory,
  ActionType,
  ActionLogEntry,
  ActionLogConfig,
  ActionLogStats,
  ActionMetadata,
} from '../types';
import { safeGetJSON, safeSetJSON, safeRemove } from './storage';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'tracker_action_logs';
const CONFIG_KEY = 'tracker_action_log_config';
const SESSION_ID_KEY = 'tracker_action_log_session';

const DEFAULT_CONFIG: ActionLogConfig = {
  enabled: true,
  maxLogs: 10000,
  maxAgeDays: 30,
  includeSensitiveData: false,
  excludeCategories: [],
  samplingRate: 1.0,
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

let currentSessionId: string | null = null;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create current session ID
 */
export function getSessionId(): string {
  if (!currentSessionId) {
    // Try to restore from sessionStorage (not localStorage)
    currentSessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!currentSessionId) {
      currentSessionId = generateSessionId();
      sessionStorage.setItem(SESSION_ID_KEY, currentSessionId);
    }
  }
  return currentSessionId;
}

/**
 * Start a new session (useful for testing or forced session boundaries)
 */
export function startNewSession(): string {
  currentSessionId = generateSessionId();
  sessionStorage.setItem(SESSION_ID_KEY, currentSessionId);
  return currentSessionId;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get current action log configuration
 */
export function getActionLogConfig(): ActionLogConfig {
  return safeGetJSON<ActionLogConfig>(CONFIG_KEY, DEFAULT_CONFIG);
}

/**
 * Update action log configuration
 */
export function updateActionLogConfig(updates: Partial<ActionLogConfig>): boolean {
  const current = getActionLogConfig();
  const updated = { ...current, ...updates };
  return safeSetJSON(CONFIG_KEY, updated);
}

/**
 * Reset action log configuration to defaults
 */
export function resetActionLogConfig(): boolean {
  return safeSetJSON(CONFIG_KEY, DEFAULT_CONFIG);
}

// ============================================================================
// LOG STORAGE
// ============================================================================

/**
 * Get all action logs from storage
 */
function getStoredLogs(): ActionLogEntry[] {
  return safeGetJSON<ActionLogEntry[]>(STORAGE_KEY, []);
}

/**
 * Save action logs to storage
 */
function saveStoredLogs(logs: ActionLogEntry[]): boolean {
  return safeSetJSON(STORAGE_KEY, logs);
}

/**
 * Clean old logs based on configuration
 */
function cleanOldLogs(logs: ActionLogEntry[], config: ActionLogConfig): ActionLogEntry[] {
  const now = Date.now();
  const maxAge = config.maxAgeDays * 24 * 60 * 60 * 1000;

  // Filter by age
  let filtered = logs.filter((log) => {
    const logTime = new Date(log.timestamp).getTime();
    return now - logTime <= maxAge;
  });

  // Enforce max logs (keep most recent)
  if (filtered.length > config.maxLogs) {
    filtered = filtered.slice(-config.maxLogs);
  }

  return filtered;
}

// ============================================================================
// PII FILTERING
// ============================================================================

/**
 * Remove potentially sensitive data from metadata
 * Strips PII while preserving useful analytical data
 */
function sanitizeMetadata(metadata: ActionMetadata | undefined, includeSensitive: boolean): ActionMetadata | undefined {
  if (!metadata || includeSensitive) {
    return metadata;
  }

  const sanitized: ActionMetadata = {};

  // Keep view context (no PII)
  if (metadata.viewContext) {
    sanitized.viewContext = { ...metadata.viewContext };
  }

  // Keep workout context (exercise IDs and indices are safe)
  if (metadata.workoutContext) {
    sanitized.workoutContext = {
      week: metadata.workoutContext.week,
      day: metadata.workoutContext.day,
      exerciseId: metadata.workoutContext.exerciseId,
      setIndex: metadata.workoutContext.setIndex,
      elapsedTime: metadata.workoutContext.elapsedTime,
      // Exclude exercise name as it might be custom/PII
    };
  }

  // Keep UI context (safe)
  if (metadata.uiContext) {
    sanitized.uiContext = { ...metadata.uiContext };
  }

  // Keep timer context (safe)
  if (metadata.timerContext) {
    sanitized.timerContext = { ...metadata.timerContext };
  }

  // Keep settings context but sanitize values
  if (metadata.settingsContext) {
    sanitized.settingsContext = {
      setting: metadata.settingsContext.setting,
      // Convert values to type strings only
      oldValue: typeof metadata.settingsContext.oldValue,
      newValue: typeof metadata.settingsContext.newValue,
    };
  }

  // Keep error context but sanitize stack traces
  if (metadata.errorContext) {
    sanitized.errorContext = {
      message: metadata.errorContext.message ? '[ERROR]' : undefined,
      component: metadata.errorContext.component,
      severity: metadata.errorContext.severity,
      // Exclude stack trace (may contain paths/data)
    };
  }

  // Keep performance context (safe)
  if (metadata.performanceContext) {
    sanitized.performanceContext = { ...metadata.performanceContext };
  }

  // Exclude extra data entirely (likely to contain PII)

  return sanitized;
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log a user action with metadata
 *
 * @param category - Action category
 * @param type - Specific action type
 * @param description - Optional human-readable description
 * @param metadata - Optional detailed metadata
 *
 * @returns The created log entry, or null if logging is disabled/filtered
 *
 * @example
 * ```typescript
 * logAction('workout', 'set_complete', 'Completed set 3 of squats', {
 *   workoutContext: {
 *     week: 5,
 *     day: 1,
 *     exerciseId: 'squats',
 *     setIndex: 2
 *   }
 * });
 * ```
 */
export function logAction(
  category: ActionCategory,
  type: ActionType,
  description?: string,
  metadata?: ActionMetadata
): ActionLogEntry | null {
  try {
    const config = getActionLogConfig();

    // Check if logging is enabled
    if (!config.enabled) {
      return null;
    }

    // Check category exclusion
    if (config.excludeCategories.includes(category)) {
      return null;
    }

    // Apply sampling rate
    if (config.samplingRate < 1.0 && Math.random() > config.samplingRate) {
      return null;
    }

    // Create log entry
    const entry: ActionLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      category,
      type,
      description,
      metadata: sanitizeMetadata(metadata, config.includeSensitiveData),
      sessionId: getSessionId(),
    };

    // Get existing logs
    let logs = getStoredLogs();

    // Add new entry
    logs.push(entry);

    // Clean old logs
    logs = cleanOldLogs(logs, config);

    // Save back to storage
    const success = saveStoredLogs(logs);

    return success ? entry : null;
  } catch (error) {
    console.error('Failed to log action:', error);
    return null;
  }
}

/**
 * Batch log multiple actions (more efficient than individual calls)
 */
export function logActions(entries: Array<{
  category: ActionCategory;
  type: ActionType;
  description?: string;
  metadata?: ActionMetadata;
}>): number {
  try {
    const config = getActionLogConfig();

    if (!config.enabled) {
      return 0;
    }

    let logs = getStoredLogs();
    const sessionId = getSessionId();
    let count = 0;

    for (const entry of entries) {
      // Apply filters
      if (config.excludeCategories.includes(entry.category)) {
        continue;
      }
      if (config.samplingRate < 1.0 && Math.random() > config.samplingRate) {
        continue;
      }

      logs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        category: entry.category,
        type: entry.type,
        description: entry.description,
        metadata: sanitizeMetadata(entry.metadata, config.includeSensitiveData),
        sessionId,
      });
      count++;
    }

    // Clean and save
    logs = cleanOldLogs(logs, config);
    saveStoredLogs(logs);

    return count;
  } catch (error) {
    console.error('Failed to batch log actions:', error);
    return 0;
  }
}

// ============================================================================
// QUERYING
// ============================================================================

/**
 * Get all action logs
 */
export function getActionLogs(): ActionLogEntry[] {
  return getStoredLogs();
}

/**
 * Get logs filtered by category
 */
export function getLogsByCategory(category: ActionCategory): ActionLogEntry[] {
  return getStoredLogs().filter((log) => log.category === category);
}

/**
 * Get logs filtered by type
 */
export function getLogsByType(type: ActionType): ActionLogEntry[] {
  return getStoredLogs().filter((log) => log.type === type);
}

/**
 * Get logs for a specific session
 */
export function getLogsBySession(sessionId: string): ActionLogEntry[] {
  return getStoredLogs().filter((log) => log.sessionId === sessionId);
}

/**
 * Get logs within a date range
 */
export function getLogsByDateRange(startDate: Date, endDate: Date): ActionLogEntry[] {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return getStoredLogs().filter((log) => {
    const time = new Date(log.timestamp).getTime();
    return time >= start && time <= end;
  });
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get statistics about stored action logs
 */
export function getActionLogStats(): ActionLogStats {
  const logs = getStoredLogs();
  
  if (logs.length === 0) {
    return {
      totalLogs: 0,
      storageBytes: 0,
      byCategory: {
        navigation: 0,
        workout: 0,
        exercise: 0,
        timer: 0,
        settings: 0,
        data: 0,
        ui: 0,
        error: 0,
        performance: 0,
        other: 0,
      },
      topTypes: [],
    };
  }

  // Calculate storage size
  const storageBytes = JSON.stringify(logs).length * 2; // UTF-16 estimate

  // Count by category
  const byCategory: Record<ActionCategory, number> = {
    navigation: 0,
    workout: 0,
    exercise: 0,
    timer: 0,
    settings: 0,
    data: 0,
    ui: 0,
    error: 0,
    performance: 0,
    other: 0,
  };

  // Count by type
  const typeCounts: Record<string, number> = {};

  logs.forEach((log) => {
    byCategory[log.category]++;
    typeCounts[log.type] = (typeCounts[log.type] || 0) + 1;
  });

  // Get top 10 types
  const topTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({ type: type as ActionType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalLogs: logs.length,
    storageBytes,
    oldestLog: logs[0]?.timestamp,
    newestLog: logs[logs.length - 1]?.timestamp,
    byCategory,
    topTypes,
  };
}

// ============================================================================
// MANAGEMENT
// ============================================================================

/**
 * Clear all action logs
 */
export function clearActionLogs(): boolean {
  return safeRemove(STORAGE_KEY);
}

/**
 * Clear logs older than specified days
 */
export function clearOldLogs(days: number): number {
  const logs = getStoredLogs();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const filtered = logs.filter((log) => {
    const time = new Date(log.timestamp).getTime();
    return time >= cutoff;
  });
  const removed = logs.length - filtered.length;
  saveStoredLogs(filtered);
  return removed;
}

/**
 * Prune logs to fit within max count
 */
export function pruneLogs(maxCount: number): number {
  const logs = getStoredLogs();
  if (logs.length <= maxCount) {
    return 0;
  }
  const pruned = logs.slice(-maxCount);
  const removed = logs.length - pruned.length;
  saveStoredLogs(pruned);
  return removed;
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Convert logs to CSV format
 *
 * @param logs - Logs to export (defaults to all logs)
 * @param includeMetadata - Whether to include metadata columns (default: true)
 * @returns CSV string
 */
export function exportLogsToCSV(logs?: ActionLogEntry[], includeMetadata = true): string {
  const logsToExport = logs || getStoredLogs();

  if (logsToExport.length === 0) {
    return 'No logs to export';
  }

  // CSV headers
  const headers = [
    'ID',
    'Timestamp',
    'Session ID',
    'Category',
    'Type',
    'Description',
  ];

  if (includeMetadata) {
    headers.push(
      'View Mode',
      'Active Tab',
      'Current Week',
      'Active Day',
      'Exercise ID',
      'Set Index',
      'Component',
      'Timer Type',
      'Error Severity',
      'Metadata JSON'
    );
  }

  // Build CSV rows
  const rows: string[] = [headers.join(',')];

  for (const log of logsToExport) {
    const row: string[] = [
      escapeCSV(log.id),
      escapeCSV(log.timestamp),
      escapeCSV(log.sessionId || ''),
      escapeCSV(log.category),
      escapeCSV(log.type),
      escapeCSV(log.description || ''),
    ];

    if (includeMetadata) {
      row.push(
        escapeCSV(log.metadata?.viewContext?.viewMode || ''),
        escapeCSV(log.metadata?.viewContext?.activeTab || ''),
        escapeCSV(log.metadata?.viewContext?.currentWeek?.toString() || ''),
        escapeCSV(log.metadata?.viewContext?.activeDay?.toString() || ''),
        escapeCSV(log.metadata?.workoutContext?.exerciseId || ''),
        escapeCSV(log.metadata?.workoutContext?.setIndex?.toString() || ''),
        escapeCSV(log.metadata?.uiContext?.component || ''),
        escapeCSV(log.metadata?.timerContext?.timerType || ''),
        escapeCSV(log.metadata?.errorContext?.severity || ''),
        escapeCSV(log.metadata ? JSON.stringify(log.metadata) : '')
      );
    }

    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: string): string {
  if (typeof value !== 'string') {
    value = String(value);
  }
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download logs as CSV file
 *
 * @param filename - Filename for the download (default: 'action-logs-YYYY-MM-DD.csv')
 * @param logs - Logs to export (defaults to all logs)
 * @param includeMetadata - Whether to include metadata columns (default: true)
 */
export function downloadLogsAsCSV(
  filename?: string,
  logs?: ActionLogEntry[],
  includeMetadata = true
): void {
  const csv = exportLogsToCSV(logs, includeMetadata);
  
  // Generate filename with date
  const defaultFilename = `action-logs-${new Date().toISOString().split('T')[0]}.csv`;
  const finalFilename = filename || defaultFilename;

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Configuration
  getConfig: getActionLogConfig,
  updateConfig: updateActionLogConfig,
  resetConfig: resetActionLogConfig,

  // Session
  getSessionId,
  startNewSession,

  // Logging
  logAction,
  logActions,

  // Querying
  getLogs: getActionLogs,
  getByCategory: getLogsByCategory,
  getByType: getLogsByType,
  getBySession: getLogsBySession,
  getByDateRange: getLogsByDateRange,

  // Statistics
  getStats: getActionLogStats,

  // Management
  clearLogs: clearActionLogs,
  clearOldLogs,
  pruneLogs,

  // Export
  exportToCSV: exportLogsToCSV,
  downloadCSV: downloadLogsAsCSV,
};
