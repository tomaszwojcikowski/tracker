/**
 * useWorkoutTimer Hook Tests
 *
 * Tests for the workout timer functionality including start, pause, resume, and stop.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkoutTimer, formatTimerTime, MAX_TIMER_SECONDS } from '../hooks/useWorkoutTimer';
import type { WorkoutSessionData } from '../types/workout';

// Mock the sync service
vi.mock('../services/SyncService', () => ({
  syncService: {
    scheduleSync: vi.fn(),
  },
}));

// Mock the storage namespace service
vi.mock('../services/storageNamespace', () => ({
  getSessionKey: (week: number, day: number) => `program_default_session_w${week}d${day}`,
}));

// Mock localStorage
const createMockLocalStorage = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
};

let mockLocalStorage;

describe('useWorkoutTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should start with 0 elapsed seconds by default', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, false));
      expect(result.current.elapsedSeconds).toBe(0);
    });

    it('should not be running when autoStart is false', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, false));
      expect(result.current.isRunning).toBe(false);
    });

    it('should be running when autoStart is true', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, true));
      expect(result.current.isRunning).toBe(true);
    });

    it('should format time as MM:SS for times less than an hour', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, false));
      expect(result.current.formattedTime).toBe('00:00');
    });
  });

  describe('timer controls', () => {
    it('should start the timer when start() is called', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, false));
      
      act(() => {
        result.current.start();
      });
      
      expect(result.current.isRunning).toBe(true);
    });

    it('should pause the timer when pause() is called', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, true));
      
      act(() => {
        result.current.pause();
      });
      
      expect(result.current.isRunning).toBe(false);
    });

    it('should toggle between running and paused', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, false));
      
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isRunning).toBe(true);
      
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isRunning).toBe(false);
    });

    it('should return elapsed seconds when stop() is called', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, true));
      
      act(() => {
        vi.advanceTimersByTime(5000); // 5 seconds
      });
      
      let finalDuration;
      act(() => {
        finalDuration = result.current.stop();
      });
      
      expect(finalDuration).toBe(5);
      expect(result.current.isRunning).toBe(false);
    });

    it('should reset the timer when reset() is called', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, true));
      
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.elapsedSeconds).toBe(0);
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('timer counting', () => {
    it('should increment elapsed seconds when running', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, true));
      
      act(() => {
        vi.advanceTimersByTime(3000); // 3 seconds
      });
      
      expect(result.current.elapsedSeconds).toBe(3);
    });

    it('should not increment when paused', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, false));
      
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      expect(result.current.elapsedSeconds).toBe(0);
    });

    it('should stop at MAX_TIMER_SECONDS (3 hours)', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, true));
      
      // Advance beyond 3 hours
      act(() => {
        vi.advanceTimersByTime((MAX_TIMER_SECONDS + 100) * 1000);
      });
      
      expect(result.current.elapsedSeconds).toBe(MAX_TIMER_SECONDS);
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, true));
      
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const calls = mockLocalStorage.setItem.mock.calls;
      
      // Find the timer storage key (workout_timer_w1d1)
      const timerCalls = calls.filter((call) => call[0] === 'workout_timer_w1d1');
      expect(timerCalls.length).toBeGreaterThan(0);
      
      const lastTimerCall = timerCalls[timerCalls.length - 1];
      const savedData = JSON.parse(lastTimerCall[1] || '{}');
      expect(savedData.elapsedSeconds).toBe(5);
      expect(savedData.isRunning).toBe(true);
      expect(savedData.week).toBe(1);
      expect(savedData.day).toBe(1);
    });

    it('should use different storage keys for different week/day combinations', () => {
      renderHook(() => useWorkoutTimer(1, 1, false));
      renderHook(() => useWorkoutTimer(2, 3, false));
      
      const calls = mockLocalStorage.setItem.mock.calls;
      const keys = calls.map((call) => call[0]);
      
      expect(keys).toContain('workout_timer_w1d1');
      expect(keys).toContain('workout_timer_w2d3');
    });

    it('should save timer state to session data for cloud sync', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, true));
      
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      // Check that session data was updated with timer state
      const sessionCalls = mockLocalStorage.setItem.mock.calls.filter(
        (call) => call[0] === 'program_default_session_w1d1'
      );
      expect(sessionCalls.length).toBeGreaterThan(0);
      
      const lastSessionCall = sessionCalls[sessionCalls.length - 1];
      const sessionData = JSON.parse(lastSessionCall[1] || '{}') as WorkoutSessionData;
      
      expect(sessionData.timerState).toBeDefined();
      expect(sessionData.timerState?.elapsedSeconds).toBe(5);
      expect(sessionData.timerState?.isRunning).toBe(true);
      expect(sessionData.lastModified).toBeDefined();
    });

    it('should load timer state from session data if dedicated timer key is missing', () => {
      // Pre-populate session data with timer state
      const sessionData: WorkoutSessionData = {
        timerState: {
          elapsedSeconds: 120,
          isRunning: false,
          startedAt: null,
        },
      };
      mockLocalStorage.setItem('program_default_session_w2d2', JSON.stringify(sessionData));
      
      const { result } = renderHook(() => useWorkoutTimer(2, 2, false));
      
      expect(result.current.elapsedSeconds).toBe(120);
      expect(result.current.isRunning).toBe(false);
    });

    it('should prioritize dedicated timer storage over session data', () => {
      // Pre-populate both storage locations with different values
      const timerState = {
        elapsedSeconds: 100,
        isRunning: true,
        startedAt: Date.now(),
        week: 3,
        day: 1,
      };
      mockLocalStorage.setItem('workout_timer_w3d1', JSON.stringify(timerState));
      
      const sessionData: WorkoutSessionData = {
        timerState: {
          elapsedSeconds: 50,
          isRunning: false,
          startedAt: null,
        },
      };
      mockLocalStorage.setItem('program_default_session_w3d1', JSON.stringify(sessionData));
      
      const { result } = renderHook(() => useWorkoutTimer(3, 1, false));
      
      // Should use the dedicated timer storage
      expect(result.current.elapsedSeconds).toBe(100);
      expect(result.current.isRunning).toBe(true);
    });
  });

  describe('formatted time', () => {
    it('should format correctly under an hour', () => {
      const { result } = renderHook(() => useWorkoutTimer(1, 1, true));
      
      act(() => {
        vi.advanceTimersByTime(125000); // 2 minutes 5 seconds
      });
      
      expect(result.current.formattedTime).toBe('02:05');
    });
  });
});

describe('formatTimerTime', () => {
  it('should format 0 seconds as 00:00', () => {
    expect(formatTimerTime(0)).toBe('00:00');
  });

  it('should format 65 seconds as 01:05', () => {
    expect(formatTimerTime(65)).toBe('01:05');
  });

  it('should format 3600 seconds as 1:00:00', () => {
    expect(formatTimerTime(3600)).toBe('1:00:00');
  });

  it('should format 3661 seconds as 1:01:01', () => {
    expect(formatTimerTime(3661)).toBe('1:01:01');
  });

  it('should format 10800 seconds (3 hours) as 3:00:00', () => {
    expect(formatTimerTime(10800)).toBe('3:00:00');
  });
});
