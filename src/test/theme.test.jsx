import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme, THEMES } from '../hooks/useTheme';

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
        // Reset document classes
        document.documentElement.className = '';
    });

    afterEach(() => {
        document.documentElement.className = '';
    });

    describe('initialization', () => {
        it('should return classic theme by default', () => {
            const { result } = renderHook(() => useTheme());
            expect(result.current.theme).toBe('classic');
        });

        it('should load saved theme from localStorage', () => {
            localStorageMock.getItem.mockReturnValueOnce('modern');
            const { result } = renderHook(() => useTheme());
            expect(result.current.theme).toBe('modern');
        });

        it('should fall back to classic for invalid saved theme', () => {
            localStorageMock.getItem.mockReturnValueOnce('invalid-theme');
            const { result } = renderHook(() => useTheme());
            expect(result.current.theme).toBe('classic');
        });

        it('should apply theme class to document root', () => {
            renderHook(() => useTheme());
            expect(document.documentElement.classList.contains('theme-classic')).toBe(true);
        });
    });

    describe('setTheme', () => {
        it('should change theme when setTheme is called', () => {
            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('modern');
            });

            expect(result.current.theme).toBe('modern');
        });

        it('should save theme to localStorage', () => {
            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('ocean');
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith('tracker_theme', 'ocean');
        });

        it('should update document class when theme changes', () => {
            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('sunset');
            });

            expect(document.documentElement.classList.contains('theme-sunset')).toBe(true);
            expect(document.documentElement.classList.contains('theme-classic')).toBe(false);
        });

        it('should remove previous theme class when changing themes', () => {
            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('modern');
            });

            act(() => {
                result.current.setTheme('ocean');
            });

            expect(document.documentElement.classList.contains('theme-ocean')).toBe(true);
            expect(document.documentElement.classList.contains('theme-modern')).toBe(false);
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

    describe('currentThemeInfo', () => {
        it('should return info for current theme', () => {
            const { result } = renderHook(() => useTheme());
            expect(result.current.currentThemeInfo).toEqual(
                expect.objectContaining({
                    id: 'classic',
                    name: 'Classic Dark',
                })
            );
        });

        it('should update currentThemeInfo when theme changes', () => {
            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('modern');
            });

            expect(result.current.currentThemeInfo).toEqual(
                expect.objectContaining({
                    id: 'modern',
                    name: 'Modern Neon',
                })
            );
        });
    });

    describe('getThemeInfo', () => {
        it('should return theme info for given id', () => {
            const { result } = renderHook(() => useTheme());
            const oceanTheme = result.current.getThemeInfo('ocean');
            expect(oceanTheme).toEqual(
                expect.objectContaining({
                    id: 'ocean',
                    name: 'Deep Ocean',
                })
            );
        });

        it('should return undefined for invalid theme id', () => {
            const { result } = renderHook(() => useTheme());
            const invalidTheme = result.current.getThemeInfo('invalid');
            expect(invalidTheme).toBeUndefined();
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
