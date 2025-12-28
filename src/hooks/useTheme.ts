import { useEffect } from 'react';

export type ThemeId = 'light';

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

// Only light theme is available
export const THEMES: ThemeInfo[] = [
    {
        id: 'light',
        name: 'Light Mode',
        description: 'Clean and bright interface',
        sourceColor: '#3b82f6',
        isDark: false,
        preview: {
            primary: '#3b82f6',
            accent: '#10b981',
            surface: '#ffffff',
        },
    },
];

/**
 * useTheme hook - simplified to only support light theme
 * Theme switching has been removed, the app now uses a fixed light theme
 */
export function useTheme() {
    // Always use light theme
    const currentTheme: ThemeId = 'light';

    // Apply light theme on mount
    useEffect(() => {
        // Set theme class on root element
        document.documentElement.classList.remove('theme-classic', 'theme-modern', 'theme-ocean', 'theme-sunset');
        document.documentElement.classList.add('theme-light');

        // Update meta theme-color for light theme
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#ffffff');
        }
    }, []);

    // Simplified return - setTheme is now a no-op since theme is fixed
    return {
        currentTheme,
        setTheme: () => {}, // No-op function for backward compatibility
        themes: THEMES,
    };
}
