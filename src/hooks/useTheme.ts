import { useState, useEffect, useCallback } from 'react';

export type ThemeId = 'classic' | 'modern' | 'ocean' | 'sunset' | 'light';

export interface ThemeInfo {
    id: ThemeId;
    name: string;
    description: string;
    preview: {
        primary: string;
        accent: string;
        surface: string;
    };
}

export const THEMES: ThemeInfo[] = [
    {
        id: 'classic',
        name: 'Classic Dark',
        description: 'Original OLED-optimized dark theme',
        preview: {
            primary: '#0ea5e9',
            accent: '#22c55e',
            surface: '#0f0f0f',
        },
    },
    {
        id: 'modern',
        name: 'Modern Neon',
        description: 'Vibrant gradients with electric accents',
        preview: {
            primary: '#8b5cf6',
            accent: '#06b6d4',
            surface: '#0c0a1a',
        },
    },
    {
        id: 'ocean',
        name: 'Deep Ocean',
        description: 'Calm blues with teal highlights',
        preview: {
            primary: '#0891b2',
            accent: '#2dd4bf',
            surface: '#0a1628',
        },
    },
    {
        id: 'sunset',
        name: 'Sunset Fire',
        description: 'Warm oranges and vibrant magentas',
        preview: {
            primary: '#f97316',
            accent: '#ec4899',
            surface: '#1a0a0a',
        },
    },
    {
        id: 'light',
        name: 'Clean Light',
        description: 'Bright and minimal for daytime use',
        preview: {
            primary: '#2563eb',
            accent: '#059669',
            surface: '#ffffff',
        },
    },
];

const THEME_STORAGE_KEY = 'tracker_theme';
const DEFAULT_THEME: ThemeId = 'classic';

/**
 * Custom hook for theme management
 * Persists theme preference to localStorage and applies CSS class to document
 */
export function useTheme() {
    const [theme, setThemeState] = useState<ThemeId>(() => {
        if (typeof window === 'undefined') return DEFAULT_THEME;
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved && THEMES.some(t => t.id === saved)) {
            return saved as ThemeId;
        }
        return DEFAULT_THEME;
    });

    // Apply theme class to document root
    useEffect(() => {
        const root = document.documentElement;
        
        // Remove all theme classes
        THEMES.forEach(t => {
            root.classList.remove(`theme-${t.id}`);
        });
        
        // Add current theme class
        root.classList.add(`theme-${theme}`);
        
        // Also update meta theme-color for PWA
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        const themeInfo = THEMES.find(t => t.id === theme);
        if (metaTheme && themeInfo) {
            metaTheme.setAttribute('content', themeInfo.preview.surface);
        }
    }, [theme]);

    const setTheme = useCallback((newTheme: ThemeId) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }, []);

    const getThemeInfo = useCallback((id: ThemeId): ThemeInfo | undefined => {
        return THEMES.find(t => t.id === id);
    }, []);

    const currentThemeInfo = THEMES.find(t => t.id === theme);

    return {
        theme,
        setTheme,
        themes: THEMES,
        currentThemeInfo,
        getThemeInfo,
    };
}

export default useTheme;
