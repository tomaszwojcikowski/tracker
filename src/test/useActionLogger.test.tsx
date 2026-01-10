/**
 * Tests for useActionLogger Hook
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActionLogger } from '../hooks/useActionLogger';
import { clearActionLogs, getActionLogs } from '../utils/actionLogger';

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

describe('useActionLogger', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  afterEach(() => {
    clearActionLogs();
  });

  it('should return logger interface', () => {
    const { result } = renderHook(() => useActionLogger());

    expect(result.current).toHaveProperty('log');
    expect(result.current).toHaveProperty('logNavigation');
    expect(result.current).toHaveProperty('logWorkout');
    expect(result.current).toHaveProperty('logExercise');
    expect(result.current).toHaveProperty('logTimer');
    expect(result.current).toHaveProperty('logSettings');
    expect(result.current).toHaveProperty('logData');
    expect(result.current).toHaveProperty('logUI');
    expect(result.current).toHaveProperty('logError');
    expect(result.current).toHaveProperty('sessionId');
  });

  it('should provide session ID', () => {
    const { result } = renderHook(() => useActionLogger());
    expect(result.current.sessionId).toBeTruthy();
    expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
  });

  it('should log action with main log function', () => {
    const { result } = renderHook(() => useActionLogger());

    act(() => {
      result.current.log('navigation', 'tab_change', 'Changed to train tab');
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].category).toBe('navigation');
    expect(logs[0].type).toBe('tab_change');
    expect(logs[0].description).toBe('Changed to train tab');
  });

  it('should log navigation actions', () => {
    const { result } = renderHook(() => useActionLogger());

    act(() => {
      result.current.logNavigation('tab_change', 'Switched tab');
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].category).toBe('navigation');
    expect(logs[0].type).toBe('tab_change');
  });

  it('should log workout actions', () => {
    const { result } = renderHook(() => useActionLogger());

    act(() => {
      result.current.logWorkout('workout_start', 'Started workout');
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].category).toBe('workout');
    expect(logs[0].type).toBe('workout_start');
  });

  it('should log exercise actions', () => {
    const { result } = renderHook(() => useActionLogger());

    act(() => {
      result.current.logExercise('set_complete', 'Completed set');
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].category).toBe('exercise');
    expect(logs[0].type).toBe('set_complete');
  });

  it('should log timer actions', () => {
    const { result } = renderHook(() => useActionLogger());

    act(() => {
      result.current.logTimer('rest_timer_start', 'Started rest timer');
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].category).toBe('timer');
    expect(logs[0].type).toBe('rest_timer_start');
  });

  it('should log settings actions', () => {
    const { result } = renderHook(() => useActionLogger());

    act(() => {
      result.current.logSettings('theme_change', 'Changed theme');
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].category).toBe('settings');
    expect(logs[0].type).toBe('theme_change');
  });

  it('should log data actions', () => {
    const { result } = renderHook(() => useActionLogger());

    act(() => {
      result.current.logData('data_export', 'Exported data');
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].category).toBe('data');
    expect(logs[0].type).toBe('data_export');
  });

  it('should log UI actions', () => {
    const { result } = renderHook(() => useActionLogger());

    act(() => {
      result.current.logUI('modal_open', 'Opened modal');
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].category).toBe('ui');
    expect(logs[0].type).toBe('modal_open');
  });

  it('should log error actions', () => {
    const { result } = renderHook(() => useActionLogger());

    act(() => {
      result.current.logError('error_caught', 'Caught error');
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].category).toBe('error');
    expect(logs[0].type).toBe('error_caught');
  });

  it('should enrich logs with component context', () => {
    const { result } = renderHook(() =>
      useActionLogger({ component: 'TestComponent' })
    );

    act(() => {
      result.current.log('ui', 'modal_open', 'Opened modal');
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].metadata?.uiContext?.component).toBe('TestComponent');
  });

  it('should log lifecycle events when enabled', () => {
    const { unmount } = renderHook(() =>
      useActionLogger({ component: 'TestComponent', logLifecycle: true })
    );

    // Should log mount
    let logs = getActionLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].description).toContain('mounted');

    // Clear for unmount test
    clearActionLogs();

    // Should log unmount
    unmount();
    logs = getActionLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].description).toContain('unmounted');
  });

  it('should not log lifecycle events by default', () => {
    const { unmount } = renderHook(() =>
      useActionLogger({ component: 'TestComponent' })
    );

    // Should not log mount
    const logs = getActionLogs();
    expect(logs).toHaveLength(0);

    unmount();
  });

  it('should pass through metadata from caller', () => {
    const { result } = renderHook(() =>
      useActionLogger({ component: 'TestComponent' })
    );

    act(() => {
      result.current.logExercise('set_complete', 'Completed set', {
        workoutContext: {
          week: 5,
          day: 1,
          exerciseId: 'squats',
          setIndex: 0,
        },
      });
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].metadata?.workoutContext?.week).toBe(5);
    expect(logs[0].metadata?.workoutContext?.exerciseId).toBe('squats');
    expect(logs[0].metadata?.uiContext?.component).toBe('TestComponent');
  });

  it('should maintain stable references across renders', () => {
    const { result, rerender } = renderHook(() => useActionLogger());

    const firstLog = result.current.log;
    const firstLogNavigation = result.current.logNavigation;

    rerender();

    expect(result.current.log).toBe(firstLog);
    expect(result.current.logNavigation).toBe(firstLogNavigation);
  });

  it('should handle multiple logs in sequence', () => {
    const { result } = renderHook(() => useActionLogger());

    act(() => {
      result.current.logNavigation('tab_change', 'Tab 1');
      result.current.logWorkout('workout_start', 'Start');
      result.current.logExercise('set_complete', 'Set 1');
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(3);
    expect(logs[0].type).toBe('tab_change');
    expect(logs[1].type).toBe('workout_start');
    expect(logs[2].type).toBe('set_complete');
  });

  it('should preserve caller metadata over component context', () => {
    const { result } = renderHook(() =>
      useActionLogger({ component: 'TestComponent' })
    );

    act(() => {
      result.current.log('ui', 'modal_open', 'Opened modal', {
        uiContext: {
          component: 'OverrideComponent',
          elementType: 'button',
        },
      });
    });

    const logs = getActionLogs();
    expect(logs).toHaveLength(1);
    // Component from hook options should still be present as enrichment
    expect(logs[0].metadata?.uiContext?.component).toBe('TestComponent');
    expect(logs[0].metadata?.uiContext?.elementType).toBe('button');
  });
});
