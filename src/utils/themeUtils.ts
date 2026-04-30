/**
 * Theme Utilities
 *
 * Shared helper functions for retrieving theme colors based on exercise types or categories.
 * Ensures consistent visual language across Dashboard, Workout Player, and other views.
 */

interface ThemeColors {
    bg: string;
    border: string;
    text: string;
    container: string; // Combined bg + border for cards
}

/**
 * Returns consistent color classes for different workout sections/categories.
 * Handles both ID-based types ('prep', 'main') and capitalized Display Names ('Prepare', 'Train').
 *
 * Brutalist (Phase 2): the `container` no longer washes the whole card with the
 * section colour. Instead it pairs a neutral surface + hairline outline with a
 * 3px left accent rail in the section colour. This dramatically reduces visual
 * noise while keeping section identity scannable.
 */
export const getSectionTheme = (typeOrCategory?: string): ThemeColors => {
    // Normalize input to lower case for comparison
    const key = typeOrCategory?.toLowerCase() || '';

    // Brutalist neutral surface + hairline border, shared across sections.
    const SURFACE = 'bg-sys-surfaceContainerLow border-sys-outlineVariant';

    if (key.includes('prep') || key.includes('warmup')) {
        return {
            bg: 'bg-warmup-500/15',
            border: 'border-warmup-500/50', // Higher opacity for borders in cards
            text: 'text-warmup-500',
            container: `${SURFACE} border-l-[3px] border-l-warmup-500`,
        };
    }

    if (key.includes('skill') || key.includes('practice')) {
        return {
            bg: 'bg-skill-500/15',
            border: 'border-skill-500/45',
            text: 'text-skill-500',
            container: `${SURFACE} border-l-[3px] border-l-skill-500`,
        };
    }

    if (key.includes('main') || key.includes('train')) {
        return {
            bg: 'bg-main-500/15',
            border: 'border-main-500/40',
            text: 'text-main-500',
            container: `${SURFACE} border-l-[3px] border-l-main-500`,
        };
    }

    if (key.includes('access') || key.includes('develop')) {
        return {
            bg: 'bg-accessory-500/15',
            border: 'border-accessory-500/40',
            text: 'text-accessory-500',
            container: `${SURFACE} border-l-[3px] border-l-accessory-500`,
        };
    }

    if (key.includes('cool') || key.includes('finish')) {
        return {
            bg: 'bg-cooldown-500/15',
            border: 'border-cooldown-500/50',
            text: 'text-cooldown-500',
            container: `${SURFACE} border-l-[3px] border-l-cooldown-500`,
        };
    }

    // Default / Unknown
    return {
        bg: 'bg-sys-surface',
        border: 'border-sys-outlineVariant',
        text: 'text-sys-onSurface',
        container: SURFACE,
    };
};
