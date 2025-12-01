import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for URL routing and state management utilities
 * Tests URL parameter parsing, state persistence, and navigation
 */

describe('URL Routing & State Management', () => {
  const DEFAULT_WEEK = 1;
  const DEFAULT_DAY = 1;
  const VALID_DAYS = [1, 2, 3, 5]; // Day 4 is rest day
  const VALID_TABS = ['train', 'library', 'history', 'coach', 'profile'];
  const VALID_VIEW_MODES = ['tab', 'workout'];

  beforeEach(() => {
    // Reset window.location mock
    delete window.location;
    window.location = { search: '' };
  });

  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    
    const view = params.get('view');
    const tab = params.get('tab');
    const weekParam = params.get('week');
    const dayParam = params.get('day');
    const programParam = params.get('program');
    
    const week = weekParam ? parseInt(weekParam, 10) : null;
    const day = dayParam ? parseInt(dayParam, 10) : null;
    
    const isValidWeek = week !== null && week >= 1 && week <= 21;
    const isValidDay = day !== null && VALID_DAYS.includes(day);
    
    // Parse program ID (no validation needed - any non-empty string is valid)
    const programId = programParam && programParam.trim().length > 0 ? programParam : null;
    
    return {
      view: VALID_VIEW_MODES.includes(view) ? view : null,
      tab: VALID_TABS.includes(tab) ? tab : null,
      week: isValidWeek ? week : null,
      day: isValidDay ? day : null,
      programId,
    };
  };

  const updateUrl = (state) => {
    const params = new URLSearchParams();
    
    if (state.viewMode === 'workout') {
      params.set('view', 'workout');
      params.set('week', state.currentWeek);
      params.set('day', state.activeDay);
    } else {
      params.set('tab', state.activeTab);
      if (state.currentWeek && state.currentWeek !== DEFAULT_WEEK) {
        params.set('week', state.currentWeek);
      }
    }
    
    return `?${params.toString()}`;
  };

  const saveAppState = (state) => {
    const stateToSave = {
      viewMode: state.viewMode,
      activeTab: state.activeTab,
      currentWeek: state.currentWeek,
      activeDay: state.activeDay,
      programId: state.programId,
    };
    try {
      localStorage.setItem('tracker_app_state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save app state:', error);
    }
  };

  const loadAppState = () => {
    try {
      const saved = localStorage.getItem('tracker_app_state');
      if (!saved) return null;
      
      const state = JSON.parse(saved);
      
      // Validate loaded state
      if (!VALID_VIEW_MODES.includes(state.viewMode)) return null;
      if (state.activeTab && !VALID_TABS.includes(state.activeTab)) return null;
      if (state.currentWeek && (state.currentWeek < 1 || state.currentWeek > 21)) return null;
      if (state.activeDay && !VALID_DAYS.includes(state.activeDay)) return null;
      
      // Validate programId - must be non-empty string if present
      if (state.programId !== undefined) {
        if (typeof state.programId !== 'string' || state.programId.trim().length === 0) {
          state.programId = undefined;
        }
      }
      
      return state;
    } catch (error) {
      console.error('Failed to load app state:', error);
      return null;
    }
  };

  describe('getUrlParams', () => {
    it('should parse workout view URL correctly', () => {
      window.location.search = '?view=workout&week=5&day=1';

      const params = getUrlParams();

      expect(params.view).toBe('workout');
      expect(params.week).toBe(5);
      expect(params.day).toBe(1);
      expect(params.tab).toBe(null);
    });

    it('should parse tab view URL correctly', () => {
      window.location.search = '?tab=library&week=10';

      const params = getUrlParams();

      expect(params.tab).toBe('library');
      expect(params.week).toBe(10);
      expect(params.view).toBe(null);
      expect(params.day).toBe(null);
    });

    it('should parse simple tab URL without week', () => {
      window.location.search = '?tab=history';

      const params = getUrlParams();

      expect(params.tab).toBe('history');
      expect(params.week).toBe(null);
      expect(params.day).toBe(null);
    });

    it('should return null for invalid tab names', () => {
      window.location.search = '?tab=invalid_tab';

      const params = getUrlParams();

      expect(params.tab).toBe(null);
    });

    it('should return null for invalid view modes', () => {
      window.location.search = '?view=invalid_view&week=5&day=1';

      const params = getUrlParams();

      expect(params.view).toBe(null);
    });

    it('should validate week range (1-21)', () => {
      window.location.search = '?view=workout&week=0&day=1';
      let params = getUrlParams();
      expect(params.week).toBe(null);

      window.location.search = '?view=workout&week=22&day=1';
      params = getUrlParams();
      expect(params.week).toBe(null);

      window.location.search = '?view=workout&week=10&day=1';
      params = getUrlParams();
      expect(params.week).toBe(10);
    });

    it('should validate day values (1, 2, 3, 5 only)', () => {
      // Valid days
      [1, 2, 3, 5].forEach(day => {
        window.location.search = `?view=workout&week=5&day=${day}`;
        const params = getUrlParams();
        expect(params.day).toBe(day);
      });

      // Invalid days (including rest day 4)
      [0, 4, 6, 7].forEach(day => {
        window.location.search = `?view=workout&week=5&day=${day}`;
        const params = getUrlParams();
        expect(params.day).toBe(null);
      });
    });

    it('should handle empty search string', () => {
      window.location.search = '';

      const params = getUrlParams();

      expect(params.view).toBe(null);
      expect(params.tab).toBe(null);
      expect(params.week).toBe(null);
      expect(params.day).toBe(null);
    });

    it('should handle malformed numbers', () => {
      window.location.search = '?week=abc&day=xyz';

      const params = getUrlParams();

      expect(params.week).toBe(null);
      expect(params.day).toBe(null);
    });
  });

  describe('updateUrl', () => {
    it('should generate workout view URL', () => {
      const state = {
        viewMode: 'workout',
        currentWeek: 5,
        activeDay: 1,
        activeTab: 'train',
      };

      const url = updateUrl(state);

      expect(url).toBe('?view=workout&week=5&day=1');
    });

    it('should generate tab view URL with week', () => {
      const state = {
        viewMode: 'tab',
        activeTab: 'library',
        currentWeek: 10,
        activeDay: 1,
      };

      const url = updateUrl(state);

      expect(url).toBe('?tab=library&week=10');
    });

    it('should generate tab view URL without week for default week', () => {
      const state = {
        viewMode: 'tab',
        activeTab: 'history',
        currentWeek: DEFAULT_WEEK,
        activeDay: 1,
      };

      const url = updateUrl(state);

      expect(url).toBe('?tab=history');
    });

    it('should generate URLs for all valid tabs', () => {
      VALID_TABS.forEach(tab => {
        const state = {
          viewMode: 'tab',
          activeTab: tab,
          currentWeek: 1,
          activeDay: 1,
        };

        const url = updateUrl(state);

        expect(url).toContain(`tab=${tab}`);
      });
    });

    it('should include day parameter in workout view', () => {
      const state = {
        viewMode: 'workout',
        currentWeek: 3,
        activeDay: 5,
        activeTab: 'train',
      };

      const url = updateUrl(state);

      expect(url).toContain('day=5');
    });
  });

  describe('saveAppState', () => {
    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem.mockClear();
      localStorage.setItem.mockImplementation(() => {});
    });

    it('should save complete app state', () => {
      const state = {
        viewMode: 'workout',
        activeTab: 'train',
        currentWeek: 5,
        activeDay: 2,
      };

      saveAppState(state);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'tracker_app_state',
        expect.any(String)
      );

      const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedData).toEqual(state);
    });

    it('should save tab view state', () => {
      const state = {
        viewMode: 'tab',
        activeTab: 'history',
        currentWeek: 10,
        activeDay: 1,
      };

      saveAppState(state);

      const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedData.viewMode).toBe('tab');
      expect(savedData.activeTab).toBe('history');
    });

    it('should handle storage errors gracefully', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const state = {
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 1,
        activeDay: 1,
      };

      // Should not throw
      expect(() => saveAppState(state)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadAppState', () => {
    beforeEach(() => {
      localStorage.clear();
      localStorage.getItem.mockClear();
    });

    it('should load saved state correctly', () => {
      const savedState = {
        viewMode: 'workout',
        activeTab: 'train',
        currentWeek: 7,
        activeDay: 3,
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      const loaded = loadAppState();

      expect(loaded).toEqual(savedState);
    });

    it('should return null when no saved state exists', () => {
      localStorage.getItem.mockReturnValue(null);

      const loaded = loadAppState();

      expect(loaded).toBe(null);
    });

    it('should return null for invalid JSON', () => {
      localStorage.getItem.mockReturnValue('invalid json {');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const loaded = loadAppState();

      expect(loaded).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should validate viewMode', () => {
      const invalidState = {
        viewMode: 'invalid_mode',
        activeTab: 'train',
        currentWeek: 5,
        activeDay: 1,
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(invalidState));

      const loaded = loadAppState();

      expect(loaded).toBe(null);
    });

    it('should validate activeTab', () => {
      const invalidState = {
        viewMode: 'tab',
        activeTab: 'invalid_tab',
        currentWeek: 5,
        activeDay: 1,
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(invalidState));

      const loaded = loadAppState();

      expect(loaded).toBe(null);
    });

    it('should validate week range', () => {
      // Week 0 should be invalid if validation is strict
      // However, the actual implementation only validates if week is set
      // Let's test with explicit invalid weeks
      let invalidState = {
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 22, // Out of range
        activeDay: 1,
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(invalidState));
      expect(loadAppState()).toBe(null);

      invalidState.currentWeek = -1; // Negative
      localStorage.getItem.mockReturnValue(JSON.stringify(invalidState));
      expect(loadAppState()).toBe(null);

      invalidState.currentWeek = 10; // Valid
      localStorage.getItem.mockReturnValue(JSON.stringify(invalidState));
      expect(loadAppState()).not.toBe(null);
    });

    it('should validate day values', () => {
      const invalidState = {
        viewMode: 'workout',
        activeTab: 'train',
        currentWeek: 5,
        activeDay: 4, // Rest day, invalid
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(invalidState));

      const loaded = loadAppState();

      expect(loaded).toBe(null);
    });
  });

  describe('Integration: State persistence flow', () => {
    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem.mockClear();
      localStorage.getItem.mockClear();
      localStorage.setItem.mockImplementation((key, value) => {
        localStorage[key] = value;
      });
      localStorage.getItem.mockImplementation((key) => {
        return localStorage[key] || null;
      });
    });

    it('should persist and restore workout view state', () => {
      const originalState = {
        viewMode: 'workout',
        activeTab: 'train',
        currentWeek: 8,
        activeDay: 2,
      };

      // Save state
      saveAppState(originalState);

      // Load state
      const restoredState = loadAppState();

      expect(restoredState).toEqual(originalState);
    });

    it('should persist and restore tab view state', () => {
      const originalState = {
        viewMode: 'tab',
        activeTab: 'library',
        currentWeek: 15,
        activeDay: 1,
      };

      // Save state
      saveAppState(originalState);

      // Load state
      const restoredState = loadAppState();

      expect(restoredState).toEqual(originalState);
    });

    it('should handle URL priority over saved state', () => {
      // Saved state
      const savedState = {
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 5,
        activeDay: 1,
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      // URL has different state
      window.location.search = '?view=workout&week=10&day=3';

      const urlParams = getUrlParams();
      const loadedState = loadAppState();

      // URL params should be used over saved state
      expect(urlParams.view).toBe('workout');
      expect(urlParams.week).toBe(10);
      expect(urlParams.day).toBe(3);
      
      // Saved state should still be valid but not prioritized
      expect(loadedState).toEqual(savedState);
    });
  });

  // ============================================================================
  // PROGRAM ID SUPPORT TESTS
  // ============================================================================
  describe('Program ID support', () => {
    describe('getUrlParams with programId', () => {
      it('should parse programId from URL', () => {
        window.location.search = '?program=my-program-id&tab=train';
        
        const params = getUrlParams();
        
        expect(params.programId).toBe('my-program-id');
        expect(params.tab).toBe('train');
      });

      it('should return null for missing programId', () => {
        window.location.search = '?tab=train';
        
        const params = getUrlParams();
        
        expect(params.programId).toBe(null);
      });

      it('should handle programId with workout view', () => {
        window.location.search = '?program=oneplus-strength&view=workout&week=5&day=1';
        
        const params = getUrlParams();
        
        expect(params.programId).toBe('oneplus-strength');
        expect(params.view).toBe('workout');
        expect(params.week).toBe(5);
        expect(params.day).toBe(1);
      });

      it('should trim whitespace from programId', () => {
        window.location.search = '?program=  &tab=train';
        
        const params = getUrlParams();
        
        expect(params.programId).toBe(null);
      });

      it('should handle complex programId with special characters', () => {
        window.location.search = '?program=beginner-bodyweight-4week&tab=train';
        
        const params = getUrlParams();
        
        expect(params.programId).toBe('beginner-bodyweight-4week');
      });
    });

    describe('updateUrl with programId', () => {
      // Mock the updateUrl function to include programId
      const updateUrlWithProgram = (state) => {
        const params = new URLSearchParams();
        
        // Always include program ID if present
        if (state.programId) {
          params.set('program', state.programId);
        }
        
        if (state.viewMode === 'workout') {
          params.set('view', 'workout');
          params.set('week', state.currentWeek);
          params.set('day', state.activeDay);
        } else {
          params.set('tab', state.activeTab);
          if (state.currentWeek && state.currentWeek !== DEFAULT_WEEK) {
            params.set('week', state.currentWeek);
          }
        }
        
        return `?${params.toString()}`;
      };

      it('should include programId in workout URL', () => {
        const state = {
          viewMode: 'workout',
          currentWeek: 5,
          activeDay: 1,
          activeTab: 'train',
          programId: 'my-program',
        };

        const url = updateUrlWithProgram(state);

        expect(url).toBe('?program=my-program&view=workout&week=5&day=1');
      });

      it('should include programId in tab URL', () => {
        const state = {
          viewMode: 'tab',
          activeTab: 'history',
          currentWeek: 10,
          activeDay: 1,
          programId: 'beginner-program',
        };

        const url = updateUrlWithProgram(state);

        expect(url).toBe('?program=beginner-program&tab=history&week=10');
      });

      it('should not include programId when undefined', () => {
        const state = {
          viewMode: 'tab',
          activeTab: 'train',
          currentWeek: 1,
          activeDay: 1,
        };

        const url = updateUrlWithProgram(state);

        expect(url).not.toContain('program=');
      });
    });

    describe('saveAppState with programId', () => {
      beforeEach(() => {
        localStorage.clear();
        localStorage.setItem.mockClear();
        localStorage.setItem.mockImplementation(() => {});
      });

      it('should save programId in app state', () => {
        const state = {
          viewMode: 'workout',
          activeTab: 'train',
          currentWeek: 5,
          activeDay: 2,
          programId: 'my-program',
        };

        saveAppState(state);

        const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
        expect(savedData.programId).toBe('my-program');
      });

      it('should save state without programId when not provided', () => {
        const state = {
          viewMode: 'tab',
          activeTab: 'history',
          currentWeek: 10,
          activeDay: 1,
        };

        saveAppState(state);

        const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
        expect(savedData.programId).toBeUndefined();
      });
    });

    describe('loadAppState with programId', () => {
      beforeEach(() => {
        localStorage.clear();
        localStorage.getItem.mockClear();
      });

      it('should load programId from saved state', () => {
        const savedState = {
          viewMode: 'tab',
          activeTab: 'train',
          currentWeek: 5,
          activeDay: 1,
          programId: 'saved-program',
        };
        localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

        const loadedState = loadAppState();

        expect(loadedState.programId).toBe('saved-program');
      });

      it('should handle missing programId in saved state', () => {
        const savedState = {
          viewMode: 'tab',
          activeTab: 'train',
          currentWeek: 5,
          activeDay: 1,
        };
        localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

        const loadedState = loadAppState();

        expect(loadedState.programId).toBeUndefined();
      });

      it('should validate programId as string', () => {
        const savedState = {
          viewMode: 'tab',
          activeTab: 'train',
          currentWeek: 5,
          activeDay: 1,
          programId: 123, // Invalid - should be string
        };
        localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

        const loadedState = loadAppState();

        expect(loadedState.programId).toBeUndefined();
      });

      it('should reject empty string programId', () => {
        const savedState = {
          viewMode: 'tab',
          activeTab: 'train',
          currentWeek: 5,
          activeDay: 1,
          programId: '  ', // Empty/whitespace only
        };
        localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

        const loadedState = loadAppState();

        expect(loadedState.programId).toBeUndefined();
      });
    });
  });
});
