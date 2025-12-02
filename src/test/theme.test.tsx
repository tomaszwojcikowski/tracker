import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme, THEMES } from '../hooks/useTheme';
import * as themeUtils from '../utils/theme';

// Mock the theme utils
vi.mock('../utils/theme', () => ({
    generateTheme: vi.fn(() => ({
        primary: '#000000',
        surface: '#ffffff',
    })),
    applyThemeToDom: vi.fn(),
}));

describe('useTheme', () => {
    const localStorageMock = (() => {
        let store = {};
        return {
            getItem: vi.fn((key) => store[key] || null),
            setItem: vi.fn((key, value) => {
                store[key] = value.toString();
            }),
            removeItem: vi.fn((key) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            }),
        };
    })();

    beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true,
        });
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should return classic theme by default', () => {
            const { result } = renderHook(() => useTheme());
            expect(result.current.currentTheme).toBe('classic');
        });

        it('should load saved theme from localStorage', () => {
            localStorageMock.getItem.mockReturnValueOnce('modern');
            const { result } = renderHook(() => useTheme());
            expect(result.current.currentTheme).toBe('modern');
        });

        it('should fall back to classic for invalid saved theme', () => {
            localStorageMock.getItem.mockReturnValueOnce('invalid-theme');
            const { result } = renderHook(() => useTheme());
            expect(result.current.currentTheme).toBe('classic');
        });

        it('should apply theme to DOM on init', () => {
             // Setup a valid saved theme to ensure effect runs with a known value
            localStorageMock.getItem.mockReturnValueOnce('classic');
            renderHook(() => useTheme());
            expect(themeUtils.generateTheme).toHaveBeenCalled();
            expect(themeUtils.applyThemeToDom).toHaveBeenCalled();
        });
    });

    describe('setTheme', () => {
        it('should change theme when setTheme is called', () => {
            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('modern');
            });

            expect(result.current.currentTheme).toBe('modern');
        });

        it('should save theme to localStorage', () => {
            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('ocean');
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith('tracker_theme_v2', 'ocean');
        });

        it('should apply new theme to DOM when theme changes', () => {
            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('sunset');
            });

            expect(themeUtils.generateTheme).toHaveBeenCalled();
            expect(themeUtils.applyThemeToDom).toHaveBeenCalled();
        });
    });

    describe('themes', () => {
        it('should return all available themes', () => {
            const { result } = renderHook(() => useTheme());
            expect(result.current.themes).toEqual(THEMES);
            expect(result.current.themes).toHaveLength(5);
        });

        it('should include classic, modern, ocean, sunset, and light themes', () => {
            const { result } = renderHook(() => useTheme());
            const themeIds = result.current.themes.map((t) => t.id);
            expect(themeIds).toContain('classic');
            expect(themeIds).toContain('modern');
            expect(themeIds).toContain('ocean');
            expect(themeIds).toContain('sunset');
            expect(themeIds).toContain('light');
        });
    });

    describe('theme preview colors', () => {
        it('each theme should have preview colors defined', () => {
            THEMES.forEach((theme) => {
                expect(theme.preview).toBeDefined();
                expect(theme.preview.primary).toBeDefined();
                expect(theme.preview.accent).toBeDefined();
                expect(theme.preview.surface).toBeDefined();
            });
        });

        it('all preview colors should be valid hex colors', () => {
            const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
            THEMES.forEach((theme) => {
                expect(theme.preview.primary).toMatch(hexColorRegex);
                expect(theme.preview.accent).toMatch(hexColorRegex);
                expect(theme.preview.surface).toMatch(hexColorRegex);
            });
        });
    });
});
