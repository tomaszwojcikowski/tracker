import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
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
        
        // Reset document element classes
        document.documentElement.classList.remove('theme-classic', 'theme-modern', 'theme-ocean', 'theme-sunset', 'theme-light');
    });

    describe('initialization', () => {
        it('should always return light theme (theme switching removed)', () => {
            const { result } = renderHook(() => useTheme());
            expect(result.current.currentTheme).toBe('light');
        });

        it('should apply light theme class to document element', () => {
            renderHook(() => useTheme());
            expect(document.documentElement.classList.contains('theme-light')).toBe(true);
        });

        it('should remove other theme classes', () => {
            // Add other theme classes before render
            document.documentElement.classList.add('theme-classic', 'theme-modern');
            
            renderHook(() => useTheme());
            
            expect(document.documentElement.classList.contains('theme-classic')).toBe(false);
            expect(document.documentElement.classList.contains('theme-modern')).toBe(false);
            expect(document.documentElement.classList.contains('theme-light')).toBe(true);
        });
    });

    describe('setTheme', () => {
        it('should be a no-op function (theme is now fixed)', () => {
            const { result } = renderHook(() => useTheme());
            
            // setTheme should exist but do nothing
            expect(result.current.setTheme).toBeDefined();
            expect(typeof result.current.setTheme).toBe('function');
            
            // Calling setTheme should not change the theme
            result.current.setTheme('modern' as any);
            expect(result.current.currentTheme).toBe('light');
        });
    });

    describe('themes', () => {
        it('should return only light theme', () => {
            const { result } = renderHook(() => useTheme());
            expect(result.current.themes).toEqual(THEMES);
            expect(result.current.themes).toHaveLength(1);
        });

        it('should only include light theme', () => {
            const { result } = renderHook(() => useTheme());
            const themeIds = result.current.themes.map((t) => t.id);
            expect(themeIds).toContain('light');
            expect(themeIds).toHaveLength(1);
        });
    });

    describe('theme preview colors', () => {
        it('light theme should have preview colors defined', () => {
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
