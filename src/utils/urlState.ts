/**
 * URL and State Management Utilities
 *
 * Functions for managing app state via URL parameters and localStorage.
 */

import { safeGetJSON, safeSetJSON } from './storage';
import type { WeekNumber, TrainingDay, TabId, ViewMode, AppState } from '../types';
import {
  DEFAULT_WEEK as CONST_DEFAULT_WEEK,
  DEFAULT_DAY as CONST_DEFAULT_DAY,
  DEFAULT_TAB as CONST_DEFAULT_TAB,
  VALID_DAYS as CONST_VALID_DAYS,
  VALID_TABS as CONST_VALID_TABS,
  VALID_VIEW_MODES as CONST_VALID_VIEW_MODES,
} from '../constants';

// ============================================================================
// CONSTANTS (re-exported from constants.ts for backward compatibility)
// ============================================================================

/**
 * Default week number
 */
export const DEFAULT_WEEK: WeekNumber = CONST_DEFAULT_WEEK as WeekNumber;

/**
 * Default training day
 */
export const DEFAULT_DAY: TrainingDay = CONST_DEFAULT_DAY;

/**
 * Default tab
 */
export const DEFAULT_TAB: TabId = CONST_DEFAULT_TAB;

/**
 * Default view mode
 */
export const DEFAULT_VIEW_MODE: ViewMode = 'tab';

/**
 * Valid training days (Day 4 is rest)
 */
export const VALID_DAYS: readonly TrainingDay[] = CONST_VALID_DAYS;

/**
 * Valid tab names
 */
export const VALID_TABS: readonly TabId[] = CONST_VALID_TABS as readonly TabId[];

/**
 * Valid view modes
 */
export const VALID_VIEW_MODES: readonly ViewMode[] = CONST_VALID_VIEW_MODES;

/**
 * Storage key for app state
 */
export const APP_STATE_KEY = 'tracker_app_state';

// ============================================================================
// TYPES
// ============================================================================

/**
 * URL parameters parsed from the query string
 */
export interface UrlParams {
    view: ViewMode | null;
    tab: TabId | null;
    week: WeekNumber | null;
    day: TrainingDay | null;
    /** Program ID for multi-program support */
    programId: string | null;
}

// ============================================================================
// URL PARAMETER FUNCTIONS
// ============================================================================

/**
 * Parse URL parameters from the current location
 */
export function getUrlParams(): UrlParams {
    const params = new URLSearchParams(window.location.search);
    const weekParam = params.get('week');
    const dayParam = params.get('day');
    const viewParam = params.get('view');
    const tabParam = params.get('tab');
    const programParam = params.get('program');

    // Parse and validate week (1-21)
    let week: WeekNumber | null = null;
    if (weekParam) {
        const parsed = parseInt(weekParam, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 21) {
            week = parsed as WeekNumber;
        }
    }

    // Parse and validate day (valid workout days from VALID_DAYS)
    let day: TrainingDay | null = null;
    if (dayParam) {
        const parsed = parseInt(dayParam, 10);
        if (!isNaN(parsed) && (VALID_DAYS as readonly number[]).includes(parsed)) {
            day = parsed as TrainingDay;
        }
    }

    // Parse and validate view
    let view: ViewMode | null = null;
    if (viewParam && (VALID_VIEW_MODES as readonly string[]).includes(viewParam)) {
        view = viewParam as ViewMode;
    }

    // Parse and validate tab
    let tab: TabId | null = null;
    if (tabParam && (VALID_TABS as readonly string[]).includes(tabParam)) {
        tab = tabParam as TabId;
    }

    // Parse program ID (no validation needed - any string is valid)
    const programId = programParam && programParam.trim().length > 0 ? programParam : null;

    return { view, tab, week, day, programId };
}

/**
 * Build a URL string from app state
 */
export function buildUrl(state: AppState): string {
    const params = new URLSearchParams();

    // Always include program ID if present (for multi-program support)
    if (state.programId) {
        params.set('program', state.programId);
    }

    if (state.viewMode === 'workout') {
        params.set('view', 'workout');
        params.set('week', String(state.currentWeek));
        params.set('day', String(state.activeDay));
    } else if (state.viewMode === 'empty-workout') {
        params.set('view', 'empty-workout');
    } else {
        params.set('tab', state.activeTab);
        // Only include week in URL if it's not the default
        if (state.currentWeek !== DEFAULT_WEEK) {
            params.set('week', String(state.currentWeek));
        }
    }

    return `${window.location.pathname}?${params.toString()}`;
}

/**
 * Update the browser URL without triggering navigation
 */
export function updateUrl(state: AppState, replace = false): void {
    const newUrl = buildUrl(state);
    if (replace) {
        window.history.replaceState(state, '', newUrl);
    } else {
        window.history.pushState(state, '', newUrl);
    }
}

// ============================================================================
// STATE PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Save app state to localStorage
 */
export function saveAppState(state: AppState): boolean {
    return safeSetJSON(APP_STATE_KEY, {
        viewMode: state.viewMode,
        activeTab: state.activeTab,
        currentWeek: state.currentWeek,
        activeDay: state.activeDay,
        programId: state.programId,
    });
}

/**
 * Load and validate app state from localStorage
 */
export function loadAppState(): AppState | null {
    const loaded = safeGetJSON<Partial<AppState> | null>(APP_STATE_KEY, null);
    if (!loaded || typeof loaded !== 'object') return null;

    // Create a new validated state object (avoid mutation)
    const validatedState: AppState = {
        viewMode:
            loaded.viewMode && (VALID_VIEW_MODES as readonly string[]).includes(loaded.viewMode)
                ? loaded.viewMode
                : DEFAULT_VIEW_MODE,
        activeTab:
            loaded.activeTab && (VALID_TABS as readonly string[]).includes(loaded.activeTab)
                ? loaded.activeTab
                : DEFAULT_TAB,
        currentWeek:
            loaded.currentWeek && loaded.currentWeek >= 1 && loaded.currentWeek <= 21
                ? loaded.currentWeek
                : DEFAULT_WEEK,
        activeDay:
            loaded.activeDay && (VALID_DAYS as readonly number[]).includes(loaded.activeDay)
                ? loaded.activeDay
                : DEFAULT_DAY,
        // Program ID is optional and can be any valid string
        programId: loaded.programId && typeof loaded.programId === 'string' && loaded.programId.trim().length > 0
            ? loaded.programId
            : undefined,
    };

    return validatedState;
}

/**
 * Clear saved app state from localStorage
 */
export function clearAppState(): boolean {
    try {
        localStorage.removeItem(APP_STATE_KEY);
        return true;
    } catch {
        return false;
    }
}

// ============================================================================
// STATE INITIALIZATION
// ============================================================================

/**
 * Initialize app state from URL params or saved state
 * Priority: URL params > saved state > defaults
 */
export function initializeAppState(): AppState {
    const urlParams = getUrlParams();
    const savedState = loadAppState();

    // Start with defaults
    let state: AppState = {
        viewMode: DEFAULT_VIEW_MODE,
        activeTab: DEFAULT_TAB,
        currentWeek: DEFAULT_WEEK,
        activeDay: DEFAULT_DAY,
    };

    // Apply saved state if available
    if (savedState) {
        state = { ...state, ...savedState };
    }

    // URL params take priority
    if (urlParams.view === 'workout' && urlParams.week && urlParams.day) {
        state.viewMode = 'workout';
        state.currentWeek = urlParams.week;
        state.activeDay = urlParams.day;
    } else if (urlParams.view === 'empty-workout') {
        state.viewMode = 'empty-workout';
    } else if (urlParams.tab) {
        state.viewMode = 'tab';
        state.activeTab = urlParams.tab;
        if (urlParams.week) {
            state.currentWeek = urlParams.week;
        }
    }

    // Program ID from URL takes priority over saved state
    if (urlParams.programId) {
        state.programId = urlParams.programId;
    }

    return state;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a week number is valid (1-21)
 */
export function isValidWeek(week: number): week is WeekNumber {
    return Number.isInteger(week) && week >= 1 && week <= 21;
}

/**
 * Check if a day is a valid training day
 */
export function isValidDay(day: number): day is TrainingDay {
    return (VALID_DAYS as readonly number[]).includes(day);
}

/**
 * Check if a tab name is valid
 */
export function isValidTab(tab: string): tab is TabId {
    return (VALID_TABS as readonly string[]).includes(tab);
}

/**
 * Check if a view mode is valid
 */
export function isValidViewMode(mode: string): mode is ViewMode {
    return (VALID_VIEW_MODES as readonly string[]).includes(mode);
}

/**
 * Clamp a week number to valid range
 */
export function clampWeek(week: number): WeekNumber {
    return Math.max(1, Math.min(21, Math.round(week))) as WeekNumber;
}

/**
 * Get the next valid training day
 */
export function getNextDay(currentDay: TrainingDay): TrainingDay {
    const currentIndex = VALID_DAYS.indexOf(currentDay);
    const nextIndex = (currentIndex + 1) % VALID_DAYS.length;
    return VALID_DAYS[nextIndex];
}

/**
 * Get the previous valid training day
 */
export function getPrevDay(currentDay: TrainingDay): TrainingDay {
    const currentIndex = VALID_DAYS.indexOf(currentDay);
    const prevIndex = (currentIndex - 1 + VALID_DAYS.length) % VALID_DAYS.length;
    return VALID_DAYS[prevIndex];
}
