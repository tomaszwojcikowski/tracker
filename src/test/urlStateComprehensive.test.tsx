/**
 * Comprehensive tests for URL state utilities
 * Tests the actual urlState.ts module exports
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getUrlParams,
  buildUrl,
  updateUrl,
  saveAppState,
  loadAppState,
  clearAppState,
  initializeAppState,
  isValidWeek,
  isValidDay,
  isValidTab,
  isValidViewMode,
  clampWeek,
  getNextDay,
  getPrevDay,
  DEFAULT_WEEK,
  DEFAULT_DAY,
  DEFAULT_TAB,
  DEFAULT_VIEW_MODE,
  VALID_DAYS,
  VALID_TABS,
  VALID_VIEW_MODES,
  APP_STATE_KEY,
} from '../utils/urlState';
import type { AppState } from '../types';

describe('URL State Comprehensive Tests', () => {
  const originalLocation = window.location;
  const mockPushState = vi.fn();
  const mockReplaceState = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        search: '',
        pathname: '/',
      },
      writable: true,
      configurable: true,
    });

    // Mock history
    window.history.pushState = mockPushState;
    window.history.replaceState = mockReplaceState;
    mockPushState.mockClear();
    mockReplaceState.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('Constants', () => {
    it('should export correct default values', () => {
      expect(DEFAULT_WEEK).toBe(1);
      expect(DEFAULT_DAY).toBe(1);
      expect(DEFAULT_TAB).toBe('train');
      expect(DEFAULT_VIEW_MODE).toBe('tab');
    });

    it('should export valid days', () => {
      expect(VALID_DAYS).toEqual([1, 2, 3, 4, 5, 7]);
    });

    it('should export valid tabs', () => {
      expect(VALID_TABS).toContain('train');
      expect(VALID_TABS).toContain('library');
      expect(VALID_TABS).toContain('history');
      expect(VALID_TABS).toContain('profile');
    });

    it('should export valid view modes', () => {
      expect(VALID_VIEW_MODES).toContain('tab');
      expect(VALID_VIEW_MODES).toContain('workout');
      expect(VALID_VIEW_MODES).toContain('empty-workout');
    });
  });

  describe('getUrlParams', () => {
    it('should parse workout view params', () => {
      window.location.search = '?view=workout&week=5&day=2';

      const params = getUrlParams();

      expect(params.view).toBe('workout');
      expect(params.week).toBe(5);
      expect(params.day).toBe(2);
    });

    it('should parse tab view params', () => {
      window.location.search = '?tab=library';

      const params = getUrlParams();

      expect(params.tab).toBe('library');
    });

    it('should validate week range (1-21)', () => {
      window.location.search = '?week=0';
      expect(getUrlParams().week).toBeNull();

      window.location.search = '?week=22';
      expect(getUrlParams().week).toBeNull();

      window.location.search = '?week=21';
      expect(getUrlParams().week).toBe(21);

      window.location.search = '?week=1';
      expect(getUrlParams().week).toBe(1);
    });

    it('should validate day (only valid training days)', () => {
      window.location.search = '?day=4';
      expect(getUrlParams().day).toBe(4);

      window.location.search = '?day=6';
      expect(getUrlParams().day).toBeNull();

      window.location.search = '?day=5';
      expect(getUrlParams().day).toBe(5);
    });

    it('should validate view mode', () => {
      window.location.search = '?view=invalid';
      expect(getUrlParams().view).toBeNull();

      window.location.search = '?view=workout';
      expect(getUrlParams().view).toBe('workout');

      window.location.search = '?view=empty-workout';
      expect(getUrlParams().view).toBe('empty-workout');
    });

    it('should validate tab name', () => {
      window.location.search = '?tab=invalid';
      expect(getUrlParams().tab).toBeNull();
    });

    it('should parse program ID', () => {
      window.location.search = '?program=my-program';

      const params = getUrlParams();

      expect(params.programId).toBe('my-program');
    });

    it('should return null for empty program ID', () => {
      window.location.search = '?program=';

      const params = getUrlParams();

      expect(params.programId).toBeNull();
    });

    it('should return null for whitespace-only program ID', () => {
      window.location.search = '?program=%20%20';

      const params = getUrlParams();

      expect(params.programId).toBeNull();
    });

    it('should handle non-numeric week/day', () => {
      window.location.search = '?week=abc&day=xyz';

      const params = getUrlParams();

      expect(params.week).toBeNull();
      expect(params.day).toBeNull();
    });
  });

  describe('buildUrl', () => {
    it('should build workout view URL', () => {
      const state: AppState = {
        viewMode: 'workout',
        currentWeek: 5,
        activeDay: 2,
        activeTab: 'train',
      };

      const url = buildUrl(state);

      expect(url).toContain('view=workout');
      expect(url).toContain('week=5');
      expect(url).toContain('day=2');
    });

    it('should build tab view URL', () => {
      const state: AppState = {
        viewMode: 'tab',
        activeTab: 'library',
        currentWeek: 1,
        activeDay: 1,
      };

      const url = buildUrl(state);

      expect(url).toContain('tab=library');
      expect(url).not.toContain('view=workout');
    });

    it('should only include week in tab view if not default', () => {
      const stateDefault: AppState = {
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 1,
        activeDay: 1,
      };

      const stateNonDefault: AppState = {
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 5,
        activeDay: 1,
      };

      const urlDefault = buildUrl(stateDefault);
      const urlNonDefault = buildUrl(stateNonDefault);

      expect(urlDefault).not.toContain('week=');
      expect(urlNonDefault).toContain('week=5');
    });

    it('should include program ID if present', () => {
      const state: AppState = {
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 1,
        activeDay: 1,
        programId: 'my-program',
      };

      const url = buildUrl(state);

      expect(url).toContain('program=my-program');
    });
  });

  describe('updateUrl', () => {
    it('should push state by default', () => {
      const state: AppState = {
        viewMode: 'workout',
        currentWeek: 3,
        activeDay: 1,
        activeTab: 'train',
      };

      updateUrl(state);

      expect(mockPushState).toHaveBeenCalled();
      expect(mockReplaceState).not.toHaveBeenCalled();
    });

    it('should replace state when replace=true', () => {
      const state: AppState = {
        viewMode: 'tab',
        activeTab: 'history',
        currentWeek: 1,
        activeDay: 1,
      };

      updateUrl(state, true);

      expect(mockReplaceState).toHaveBeenCalled();
      expect(mockPushState).not.toHaveBeenCalled();
    });
  });

  describe('saveAppState', () => {
    it('should save state to localStorage', () => {
      const state: AppState = {
        viewMode: 'workout',
        activeTab: 'train',
        currentWeek: 5,
        activeDay: 2,
      };

      const result = saveAppState(state);

      expect(result).toBe(true);
      const saved = JSON.parse(localStorage.getItem(APP_STATE_KEY)!);
      expect(saved.viewMode).toBe('workout');
      expect(saved.currentWeek).toBe(5);
    });

    it('should include programId when present', () => {
      const state: AppState = {
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 1,
        activeDay: 1,
        programId: 'test-program',
      };

      saveAppState(state);

      const saved = JSON.parse(localStorage.getItem(APP_STATE_KEY)!);
      expect(saved.programId).toBe('test-program');
    });
  });

  describe('loadAppState', () => {
    it('should load valid state from localStorage', () => {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify({
        viewMode: 'workout',
        activeTab: 'library',
        currentWeek: 10,
        activeDay: 3,
      }));

      const state = loadAppState();

      expect(state).not.toBeNull();
      expect(state?.viewMode).toBe('workout');
      expect(state?.currentWeek).toBe(10);
    });

    it('should return null for empty localStorage', () => {
      expect(loadAppState()).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem(APP_STATE_KEY, 'invalid json');

      expect(loadAppState()).toBeNull();
    });

    it('should use defaults for invalid view mode', () => {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify({
        viewMode: 'invalid',
        activeTab: 'train',
        currentWeek: 1,
        activeDay: 1,
      }));

      const state = loadAppState();

      expect(state?.viewMode).toBe(DEFAULT_VIEW_MODE);
    });

    it('should use defaults for invalid week', () => {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify({
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 100,
        activeDay: 1,
      }));

      const state = loadAppState();

      expect(state?.currentWeek).toBe(DEFAULT_WEEK);
    });

    it('should use defaults for invalid day', () => {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify({
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 1,
        activeDay: 6,
      }));

      const state = loadAppState();

      expect(state?.activeDay).toBe(DEFAULT_DAY);
    });

    it('should exclude empty programId', () => {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify({
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 1,
        activeDay: 1,
        programId: '',
      }));

      const state = loadAppState();

      expect(state?.programId).toBeUndefined();
    });

    it('should include valid programId', () => {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify({
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 1,
        activeDay: 1,
        programId: 'valid-id',
      }));

      const state = loadAppState();

      expect(state?.programId).toBe('valid-id');
    });
  });

  describe('clearAppState', () => {
    it('should remove state from localStorage', () => {
      localStorage.setItem(APP_STATE_KEY, '{"test": true}');

      const result = clearAppState();

      expect(result).toBe(true);
      expect(localStorage.getItem(APP_STATE_KEY)).toBeNull();
    });
  });

  describe('initializeAppState', () => {
    it('should return defaults when no URL or saved state', () => {
      const state = initializeAppState();

      expect(state.viewMode).toBe(DEFAULT_VIEW_MODE);
      expect(state.activeTab).toBe(DEFAULT_TAB);
      expect(state.currentWeek).toBe(DEFAULT_WEEK);
      expect(state.activeDay).toBe(DEFAULT_DAY);
    });

    it('should use saved state when available', () => {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify({
        viewMode: 'tab',
        activeTab: 'history',
        currentWeek: 5,
        activeDay: 2,
      }));

      const state = initializeAppState();

      expect(state.activeTab).toBe('history');
      expect(state.currentWeek).toBe(5);
    });

    it('should prioritize URL params over saved state', () => {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify({
        viewMode: 'tab',
        activeTab: 'history',
        currentWeek: 5,
        activeDay: 2,
      }));
      window.location.search = '?view=workout&week=10&day=3';

      const state = initializeAppState();

      expect(state.viewMode).toBe('workout');
      expect(state.currentWeek).toBe(10);
      expect(state.activeDay).toBe(3);
    });

    it('should prioritize URL tab over saved state', () => {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify({
        viewMode: 'tab',
        activeTab: 'history',
        currentWeek: 1,
        activeDay: 1,
      }));
      window.location.search = '?tab=library';

      const state = initializeAppState();

      expect(state.activeTab).toBe('library');
    });

    it('should prioritize URL program ID over saved state', () => {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify({
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 1,
        activeDay: 1,
        programId: 'saved-program',
      }));
      window.location.search = '?program=url-program';

      const state = initializeAppState();

      expect(state.programId).toBe('url-program');
    });
  });

  describe('Validation Helpers', () => {
    describe('isValidWeek', () => {
      it('should return true for valid weeks 1-21', () => {
        expect(isValidWeek(1)).toBe(true);
        expect(isValidWeek(10)).toBe(true);
        expect(isValidWeek(21)).toBe(true);
      });

      it('should return false for invalid weeks', () => {
        expect(isValidWeek(0)).toBe(false);
        expect(isValidWeek(22)).toBe(false);
        expect(isValidWeek(-1)).toBe(false);
        expect(isValidWeek(1.5)).toBe(false);
      });
    });

    describe('isValidDay', () => {
      it('should return true for valid training days', () => {
        expect(isValidDay(1)).toBe(true);
        expect(isValidDay(2)).toBe(true);
        expect(isValidDay(3)).toBe(true);
        expect(isValidDay(4)).toBe(true);
        expect(isValidDay(5)).toBe(true);
        expect(isValidDay(7)).toBe(true);
      });

      it('should return false for invalid days', () => {
        expect(isValidDay(0)).toBe(false);
        expect(isValidDay(6)).toBe(false);
        expect(isValidDay(8)).toBe(false);
      });
    });

    describe('isValidTab', () => {
      it('should return true for valid tabs', () => {
        expect(isValidTab('train')).toBe(true);
        expect(isValidTab('library')).toBe(true);
        expect(isValidTab('history')).toBe(true);
        expect(isValidTab('profile')).toBe(true);
      });

      it('should return false for invalid tabs', () => {
        expect(isValidTab('invalid')).toBe(false);
        expect(isValidTab('')).toBe(false);
        expect(isValidTab('settings')).toBe(false);
      });
    });

    describe('isValidViewMode', () => {
      it('should return true for valid view modes', () => {
        expect(isValidViewMode('tab')).toBe(true);
        expect(isValidViewMode('workout')).toBe(true);
        expect(isValidViewMode('empty-workout')).toBe(true);
      });

      it('should return false for invalid view modes', () => {
        expect(isValidViewMode('invalid')).toBe(false);
        expect(isValidViewMode('')).toBe(false);
      });
    });

    describe('clampWeek', () => {
      it('should clamp to valid range', () => {
        expect(clampWeek(0)).toBe(1);
        expect(clampWeek(-5)).toBe(1);
        expect(clampWeek(25)).toBe(21);
        expect(clampWeek(10)).toBe(10);
      });

      it('should round decimal values', () => {
        expect(clampWeek(5.4)).toBe(5);
        expect(clampWeek(5.6)).toBe(6);
      });
    });

    describe('getNextDay', () => {
      it('should cycle through valid days', () => {
        expect(getNextDay(1)).toBe(2);
        expect(getNextDay(2)).toBe(3);
        expect(getNextDay(3)).toBe(4);
        expect(getNextDay(4)).toBe(5);
        expect(getNextDay(5)).toBe(7);
        expect(getNextDay(7)).toBe(1); // wrap around
      });
    });

    describe('getPrevDay', () => {
      it('should cycle through valid days in reverse', () => {
        expect(getPrevDay(1)).toBe(7); // wrap around
        expect(getPrevDay(2)).toBe(1);
        expect(getPrevDay(3)).toBe(2);
        expect(getPrevDay(4)).toBe(3);
        expect(getPrevDay(5)).toBe(4);
        expect(getPrevDay(7)).toBe(5);
      });
    });
  });
});
