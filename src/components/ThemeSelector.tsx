import React from 'react';
import { Check, Palette } from '../icons';

interface ThemePreview {
    surface: string;
    primary: string;
    accent: string;
}

interface Theme {
    id: string;
    name: string;
    description?: string;
    preview: ThemePreview;
}

interface ThemePreviewButtonProps {
    theme: Theme;
    isSelected: boolean;
    onClick: () => void;
}

/**
 * Theme preview button component
 * Shows a visual preview of the theme colors
 */
const ThemePreviewButton: React.FC<ThemePreviewButtonProps> = ({
    theme,
    isSelected,
    onClick,
}) => {
    const { name, description, preview } = theme;

    return (
        <button
            onClick={onClick}
            className={`relative w-full p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] ${
                isSelected
                    ? 'border-sys-primary bg-sys-primary/10'
                    : 'border-white/10 bg-sys-surfaceHigh hover:border-white/20'
            }`}
            aria-pressed={isSelected}
            aria-label={`Select ${name} theme`}
        >
            {/* Color preview circles */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2">
                    <div
                        className="w-8 h-8 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: preview.surface }}
                    />
                    <div
                        className="w-8 h-8 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: preview.primary }}
                    />
                    <div
                        className="w-8 h-8 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: preview.accent }}
                    />
                </div>
                {isSelected && (
                    <div className="ml-auto w-6 h-6 rounded-full bg-sys-primary flex items-center justify-center">
                        <Check size={14} className="text-white" />
                    </div>
                )}
            </div>

            {/* Theme info */}
            <div className="text-left">
                <h4 className="text-sm font-semibold text-white mb-0.5">{name}</h4>
                {description && <p className="text-xs text-sys-onSurfaceVar">{description}</p>}
            </div>
        </button>
    );
};

export interface ThemeSelectorProps {
    theme: string;
    setTheme: (theme: string) => void;
    themes: Theme[];
}

/**
 * Theme selector component for Settings view
 * Displays all available themes with visual previews
 */
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, setTheme, themes }) => {
    return (
        <div className="bg-sys-surface rounded-2xl border border-white/5 p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sys-primary/20 to-sys-accent/20 flex items-center justify-center">
                    <Palette size={24} className="text-sys-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Theme</h3>
                    <p className="text-xs text-sys-onSurfaceVar">Customize your app's appearance</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {themes.map((t) => (
                    <ThemePreviewButton
                        key={t.id}
                        theme={t}
                        isSelected={theme === t.id}
                        onClick={() => setTheme(t.id)}
                    />
                ))}
            </div>
        </div>
    );
};
