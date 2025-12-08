import { useState, useEffect, useCallback } from 'react';
import { generateTheme, applyThemeToDom } from '../utils/theme';

export type ThemeId = 'classic' | 'modern' | 'ocean' | 'sunset' | 'light';

export interface ThemeInfo {
    id: ThemeId;
    name: string;
    description: string;
    sourceColor: string; // Hex color to generate theme from
    isDark: boolean;
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
        sourceColor: '#0ea5e9', // Sky blue
        isDark: true,
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
        sourceColor: '#8b5cf6', // Violet
        isDark: true,
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
        sourceColor: '#0891b2', // Cyan
        isDark: true,
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
        sourceColor: '#f97316', // Orange
        isDark: true,
        preview: {
            primary: '#f97316',
            accent: '#db2777',
            surface: '#1a0b0b',
        },
    },
    {
        id: 'light',
        name: 'Light Mode',
        description: 'Clean and bright interface',
        sourceColor: '#0ea5e9',
        isDark: false,
        preview: {
            primary: '#0ea5e9',
            accent: '#0284c7',
            surface: '#ffffff',
        },
    },
];

const THEME_STORAGE_KEY = 'tracker_theme_v2';

export function useTheme() {
    const [currentTheme, setCurrentTheme] = useState<ThemeId>('classic');

    // Load saved theme
    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId;
        if (savedTheme && THEMES.find(t => t.id === savedTheme)) {
            setTheme(savedTheme);
        } else {
            setTheme('classic');
        }
    }, []);

    const setTheme = useCallback((themeId: ThemeId) => {
        const themeInfo = THEMES.find(t => t.id === themeId);
        if (!themeInfo) return;

        // Generate and apply dynamic theme
        const themeColors = generateTheme(themeInfo.sourceColor, themeInfo.isDark);
        applyThemeToDom(themeColors);

        // Update state and storage
        setCurrentTheme(themeId);
        localStorage.setItem(THEME_STORAGE_KEY, themeId);

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeColors.surface);
        }
    }, []);

    return {
        currentTheme,
        setTheme,
        themes: THEMES,
    };
}
