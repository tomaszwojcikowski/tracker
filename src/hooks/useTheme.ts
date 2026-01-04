import { useEffect } from 'react';

/**
 * Theme switching has been removed.
 * The app always renders using the new light theme (mockup design system).
 */
export type ThemeId = 'light';

export interface ThemeInfo {
    id: ThemeId;
    name: string;
    description: string;
    isDark: false;
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
        description: 'Vibrant light theme (mockup design system)',
        isDark: false,
        preview: {
            primary: '#7c3aed',
            accent: '#6d28d9',
            surface: '#faf9fc',
        },
    },
];

export function useTheme() {
    useEffect(() => {
        const root = document.documentElement;

        // Hard-force light theme.
        root.classList.remove('theme-classic', 'theme-modern', 'theme-ocean', 'theme-sunset');
        root.classList.add('theme-light');

        // Keep browser chrome aligned with the theme.
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const bg = getComputedStyle(root).getPropertyValue('--color-surface').trim() || '#fef7ff';
            metaThemeColor.setAttribute('content', bg);
        }
    }, []);

    // Simplified return - setTheme is now a no-op since theme is fixed
    return {
        currentTheme: 'light' as const,
        // Intentionally a no-op; theme switching is removed.
        setTheme: (_theme: ThemeId) => {
            // no-op
        },
        themes: THEMES,
    };
}
