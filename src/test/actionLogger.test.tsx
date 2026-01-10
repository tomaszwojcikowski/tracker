/**
 * Tests for Action Logger Utility
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  logAction,
  logActions,
  getActionLogs,
  getLogsByCategory,
  getLogsByType,
  getLogsBySession,
  getLogsByDateRange,
  getActionLogStats,
  clearActionLogs,
  clearOldLogs,
  pruneLogs,
  exportLogsToCSV,
  getActionLogConfig,
  updateActionLogConfig,
  resetActionLogConfig,
  getSessionId,
  startNewSession,
} from '../utils/actionLogger';
import type { ActionLogEntry, ActionCategory, ActionType } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('Action Logger', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearActionLogs();
  });

  describe('Configuration', () => {
    it('should return default configuration', () => {
      const config = getActionLogConfig();
      expect(config.enabled).toBe(true);
      expect(config.maxLogs).toBe(10000);
      expect(config.maxAgeDays).toBe(30);
      expect(config.includeSensitiveData).toBe(false);
      expect(config.excludeCategories).toEqual([]);
      expect(config.samplingRate).toBe(1.0);
    });

    it('should update configuration', () => {
      updateActionLogConfig({ enabled: false, maxLogs: 5000 });
      const config = getActionLogConfig();
      expect(config.enabled).toBe(false);
      expect(config.maxLogs).toBe(5000);
    });

    it('should reset configuration to defaults', () => {
      updateActionLogConfig({ enabled: false, maxLogs: 5000 });
      resetActionLogConfig();
      const config = getActionLogConfig();
      expect(config.enabled).toBe(true);
      expect(config.maxLogs).toBe(10000);
    });
  });

  describe('Session Management', () => {
    it('should generate and return session ID', () => {
      const sessionId = getSessionId();
      expect(sessionId).toBeTruthy();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should return same session ID on subsequent calls', () => {
      const sessionId1 = getSessionId();
      const sessionId2 = getSessionId();
      expect(sessionId1).toBe(sessionId2);
    });

    it('should generate new session ID when explicitly started', () => {
      const sessionId1 = getSessionId();
      const sessionId2 = startNewSession();
      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('Basic Logging', () => {
    it('should log a simple action', () => {
      const entry = logAction('navigation', 'tab_change', 'Changed to train tab');
      expect(entry).toBeTruthy();
      expect(entry?.category).toBe('navigation');
      expect(entry?.type).toBe('tab_change');
      expect(entry?.description).toBe('Changed to train tab');
      expect(entry?.timestamp).toBeTruthy();
      expect(entry?.id).toBeTruthy();
      expect(entry?.sessionId).toBeTruthy();
    });

    it('should log action with metadata', () => {
      const entry = logAction('workout', 'set_complete', 'Completed set 1', {
        workoutContext: {
          week: 5,
          day: 1,
          exerciseId: 'squats',
          setIndex: 0,
        },
      });
      expect(entry?.metadata?.workoutContext?.week).toBe(5);
      expect(entry?.metadata?.workoutContext?.exerciseId).toBe('squats');
    });

    it('should store logs in localStorage', () => {
      logAction('ui', 'modal_open', 'Opened exercise modal');
      const logs = getActionLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('modal_open');
    });

    it('should not log when disabled', () => {
      updateActionLogConfig({ enabled: false });
      const entry = logAction('navigation', 'tab_change');
      expect(entry).toBeNull();
      expect(getActionLogs()).toHaveLength(0);
    });

    it('should not log excluded categories', () => {
      updateActionLogConfig({ excludeCategories: ['navigation'] });
      const entry = logAction('navigation', 'tab_change');
      expect(entry).toBeNull();
      expect(getActionLogs()).toHaveLength(0);
    });

    it('should respect sampling rate', () => {
      updateActionLogConfig({ samplingRate: 0 }); // Never log
      const entry = logAction('ui', 'modal_open');
      expect(entry).toBeNull();
    });
  });

  describe('Batch Logging', () => {
    it('should log multiple actions at once', () => {
      const count = logActions([
        { category: 'navigation', type: 'tab_change', description: 'Tab 1' },
        { category: 'navigation', type: 'tab_change', description: 'Tab 2' },
        { category: 'ui', type: 'modal_open', description: 'Modal' },
      ]);
      expect(count).toBe(3);
      expect(getActionLogs()).toHaveLength(3);
    });

    it('should apply filters to batch logs', () => {
      updateActionLogConfig({ excludeCategories: ['navigation'] });
      const count = logActions([
        { category: 'navigation', type: 'tab_change' },
        { category: 'ui', type: 'modal_open' },
      ]);
      expect(count).toBe(1);
      expect(getActionLogs()).toHaveLength(1);
    });
  });

  describe('Querying Logs', () => {
    beforeEach(() => {
      // Create sample logs
      logAction('navigation', 'tab_change', 'Tab 1');
      logAction('navigation', 'view_change', 'View 1');
      logAction('workout', 'set_complete', 'Set 1');
      logAction('workout', 'set_complete', 'Set 2');
      logAction('ui', 'modal_open', 'Modal 1');
    });

    it('should get all logs', () => {
      const logs = getActionLogs();
      expect(logs).toHaveLength(5);
    });

    it('should filter logs by category', () => {
      const navigationLogs = getLogsByCategory('navigation');
      expect(navigationLogs).toHaveLength(2);
      expect(navigationLogs.every((log) => log.category === 'navigation')).toBe(true);
    });

    it('should filter logs by type', () => {
      const setLogs = getLogsByType('set_complete');
      expect(setLogs).toHaveLength(2);
      expect(setLogs.every((log) => log.type === 'set_complete')).toBe(true);
    });

    it('should filter logs by session', () => {
      const sessionId = getSessionId();
      const sessionLogs = getLogsBySession(sessionId);
      expect(sessionLogs).toHaveLength(5);
      expect(sessionLogs.every((log) => log.sessionId === sessionId)).toBe(true);
    });

    it('should filter logs by date range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const logs = getLogsByDateRange(oneHourAgo, now);
      expect(logs).toHaveLength(5);
    });

    it('should return empty array for future date range', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const logs = getLogsByDateRange(tomorrow, dayAfter);
      expect(logs).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      logAction('navigation', 'tab_change');
      logAction('navigation', 'view_change');
      logAction('workout', 'set_complete');
      logAction('workout', 'set_complete');
      logAction('workout', 'workout_start');
      logAction('ui', 'modal_open');
    });

    it('should calculate correct statistics', () => {
      const stats = getActionLogStats();
      expect(stats.totalLogs).toBe(6);
      expect(stats.byCategory.navigation).toBe(2);
      expect(stats.byCategory.workout).toBe(3);
      expect(stats.byCategory.ui).toBe(1);
      expect(stats.oldestLog).toBeTruthy();
      expect(stats.newestLog).toBeTruthy();
      expect(stats.storageBytes).toBeGreaterThan(0);
    });

    it('should return top types', () => {
      const stats = getActionLogStats();
      expect(stats.topTypes).toHaveLength(5); // All 5 unique types
      expect(stats.topTypes[0].type).toBe('set_complete');
      expect(stats.topTypes[0].count).toBe(2);
    });

    it('should handle empty logs', () => {
      clearActionLogs();
      const stats = getActionLogStats();
      expect(stats.totalLogs).toBe(0);
      expect(stats.storageBytes).toBe(0);
      expect(stats.oldestLog).toBeUndefined();
      expect(stats.newestLog).toBeUndefined();
    });
  });

  describe('Log Management', () => {
    beforeEach(() => {
      // Create multiple logs
      for (let i = 0; i < 10; i++) {
        logAction('navigation', 'tab_change', `Action ${i}`);
      }
    });

    it('should clear all logs', () => {
      expect(getActionLogs()).toHaveLength(10);
      clearActionLogs();
      expect(getActionLogs()).toHaveLength(0);
    });

    it('should prune logs to max count', () => {
      const removed = pruneLogs(5);
      expect(removed).toBe(5);
      expect(getActionLogs()).toHaveLength(5);
    });

    it('should keep most recent logs when pruning', () => {
      pruneLogs(3);
      const logs = getActionLogs();
      expect(logs[0].description).toBe('Action 7');
      expect(logs[2].description).toBe('Action 9');
    });

    it('should not prune if under limit', () => {
      const removed = pruneLogs(20);
      expect(removed).toBe(0);
      expect(getActionLogs()).toHaveLength(10);
    });
  });

  describe('Old Log Cleanup', () => {
    it('should remove logs older than specified days', () => {
      // Create old logs by manipulating storage directly
      const oldLogs: ActionLogEntry[] = [
        {
          id: 'old1',
          timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'navigation' as ActionCategory,
          type: 'tab_change' as ActionType,
          sessionId: 'test',
        },
        {
          id: 'old2',
          timestamp: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'navigation' as ActionCategory,
          type: 'tab_change' as ActionType,
          sessionId: 'test',
        },
        {
          id: 'recent',
          timestamp: new Date().toISOString(),
          category: 'navigation' as ActionCategory,
          type: 'tab_change' as ActionType,
          sessionId: 'test',
        },
      ];
      localStorage.setItem('tracker_action_logs', JSON.stringify(oldLogs));

      const removed = clearOldLogs(30);
      expect(removed).toBe(2);
      const remaining = getActionLogs();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('recent');
    });
  });

  describe('CSV Export', () => {
    beforeEach(() => {
      logAction('navigation', 'tab_change', 'Changed tab', {
        viewContext: { activeTab: 'train', currentWeek: 5 },
      });
      logAction('workout', 'set_complete', 'Completed set', {
        workoutContext: { week: 5, day: 1, exerciseId: 'squats', setIndex: 0 },
      });
    });

    it('should export logs to CSV format', () => {
      const csv = exportLogsToCSV();
      expect(csv).toContain('ID,Timestamp,Session ID,Category,Type,Description');
      expect(csv).toContain('navigation');
      expect(csv).toContain('tab_change');
      expect(csv).toContain('workout');
      expect(csv).toContain('set_complete');
    });

    it('should include metadata columns when requested', () => {
      const csv = exportLogsToCSV(undefined, true);
      expect(csv).toContain('View Mode');
      expect(csv).toContain('Active Tab');
      expect(csv).toContain('Exercise ID');
      expect(csv).toContain('Metadata JSON');
    });

    it('should exclude metadata columns when not requested', () => {
      const csv = exportLogsToCSV(undefined, false);
      expect(csv).not.toContain('View Mode');
      expect(csv).not.toContain('Metadata JSON');
    });

    it('should escape CSV special characters', () => {
      logAction('ui', 'modal_open', 'Description with, comma');
      const csv = exportLogsToCSV();
      expect(csv).toContain('"Description with, comma"');
    });

    it('should handle empty logs', () => {
      clearActionLogs();
      const csv = exportLogsToCSV();
      expect(csv).toBe('No logs to export');
    });

    it('should export specific logs subset', () => {
      const navigationLogs = getLogsByCategory('navigation');
      const csv = exportLogsToCSV(navigationLogs);
      expect(csv.split('\n').length).toBe(2); // Header + 1 log
      expect(csv).toContain('navigation');
      expect(csv).not.toContain('workout');
    });
  });

  describe('PII Filtering', () => {
    it('should sanitize metadata by default', () => {
      const entry = logAction('settings', 'setting_change', 'Changed setting', {
        settingsContext: {
          setting: 'geminiApiKey',
          oldValue: 'secret-key-123',
          newValue: 'new-secret-key',
        },
      });
      expect(entry?.metadata?.settingsContext?.setting).toBe('geminiApiKey');
      // Values should be converted to type strings
      expect(entry?.metadata?.settingsContext?.oldValue).toBe('string');
      expect(entry?.metadata?.settingsContext?.newValue).toBe('string');
    });

    it('should include sensitive data when configured', () => {
      updateActionLogConfig({ includeSensitiveData: true });
      const entry = logAction('settings', 'setting_change', 'Changed setting', {
        settingsContext: {
          setting: 'theme',
          oldValue: 'dark',
          newValue: 'light',
        },
      });
      expect(entry?.metadata?.settingsContext?.oldValue).toBe('dark');
      expect(entry?.metadata?.settingsContext?.newValue).toBe('light');
    });

    it('should exclude error stack traces', () => {
      const entry = logAction('error', 'error_caught', 'Error occurred', {
        errorContext: {
          message: 'Test error',
          stack: 'Error: Test\n  at file.js:123',
          severity: 'high',
        },
      });
      expect(entry?.metadata?.errorContext?.severity).toBe('high');
      expect(entry?.metadata?.errorContext?.stack).toBeUndefined();
    });

    it('should keep safe workout context', () => {
      const entry = logAction('exercise', 'set_complete', 'Set done', {
        workoutContext: {
          week: 5,
          day: 1,
          exerciseId: 'squats',
          exerciseName: 'Back Squats',
          setIndex: 0,
        },
      });
      expect(entry?.metadata?.workoutContext?.week).toBe(5);
      expect(entry?.metadata?.workoutContext?.exerciseId).toBe('squats');
      // Exercise name is excluded as potentially custom/PII
      expect(entry?.metadata?.workoutContext?.exerciseName).toBeUndefined();
    });
  });

  describe('Automatic Cleanup', () => {
    it('should enforce max logs limit', () => {
      updateActionLogConfig({ maxLogs: 5 });
      // Log more than max
      for (let i = 0; i < 10; i++) {
        logAction('navigation', 'tab_change', `Action ${i}`);
      }
      const logs = getActionLogs();
      expect(logs).toHaveLength(5);
      // Should keep most recent
      expect(logs[0].description).toBe('Action 5');
      expect(logs[4].description).toBe('Action 9');
    });

    it('should enforce max age limit', () => {
      // This test requires manual manipulation of timestamps
      // since we can't easily create logs in the past through the API
      const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
      const recentDate = new Date().toISOString();

      const logs: ActionLogEntry[] = [
        {
          id: 'old',
          timestamp: oldDate,
          category: 'navigation',
          type: 'tab_change',
          sessionId: 'test',
        },
        {
          id: 'recent',
          timestamp: recentDate,
          category: 'navigation',
          type: 'tab_change',
          sessionId: 'test',
        },
      ];

      localStorage.setItem('tracker_action_logs', JSON.stringify(logs));
      updateActionLogConfig({ maxAgeDays: 30 });

      // Log new action to trigger cleanup
      logAction('navigation', 'tab_change', 'Trigger cleanup');

      const remaining = getActionLogs();
      expect(remaining.length).toBeLessThan(3);
      expect(remaining.find((log) => log.id === 'old')).toBeUndefined();
      expect(remaining.find((log) => log.id === 'recent')).toBeTruthy();
    });
  });
});
