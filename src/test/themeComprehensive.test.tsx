/**
 * Comprehensive tests for theme utilities
 * Tests the actual theme.ts module exports
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateTheme, applyThemeToDom, type ThemeColors } from '../utils/theme';

describe('Theme Utilities Comprehensive Tests', () => {
  beforeEach(() => {
    // Reset document styles
    document.documentElement.style.cssText = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateTheme', () => {
    it('should generate dark theme colors from source color', () => {
      const colors = generateTheme('#6750A4');

      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('onPrimary');
      expect(colors).toHaveProperty('primaryContainer');
      expect(colors).toHaveProperty('onPrimaryContainer');
      expect(colors).toHaveProperty('surface');
      expect(colors).toHaveProperty('background');
    });

    it('should return hex color strings', () => {
      const colors = generateTheme('#6750A4');

      // All colors should be hex strings
      expect(colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.surface).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should generate light theme when isDark is false', () => {
      const darkColors = generateTheme('#6750A4', true);
      const lightColors = generateTheme('#6750A4', false);

      // Light and dark themes should have different surface colors
      expect(darkColors.surface).not.toBe(lightColors.surface);
      expect(darkColors.background).not.toBe(lightColors.background);
    });

    it('should default to dark theme', () => {
      const defaultColors = generateTheme('#6750A4');
      const darkColors = generateTheme('#6750A4', true);

      expect(defaultColors.surface).toBe(darkColors.surface);
      expect(defaultColors.primary).toBe(darkColors.primary);
    });

    it('should generate all required theme colors', () => {
      const colors = generateTheme('#6750A4');

      const requiredKeys: (keyof ThemeColors)[] = [
        'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
        'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
        'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
        'error', 'onError', 'errorContainer', 'onErrorContainer',
        'background', 'onBackground',
        'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant',
        'outline', 'outlineVariant',
        'inverseSurface', 'inverseOnSurface', 'inversePrimary',
        'scrim', 'shadow',
      ];

      for (const key of requiredKeys) {
        expect(colors).toHaveProperty(key);
        expect(colors[key]).toBeTruthy();
      }
    });

    it('should generate different themes for different source colors', () => {
      const blueTheme = generateTheme('#0000FF');
      const redTheme = generateTheme('#FF0000');
      const greenTheme = generateTheme('#00FF00');

      expect(blueTheme.primary).not.toBe(redTheme.primary);
      expect(redTheme.primary).not.toBe(greenTheme.primary);
    });

    it('should handle various hex formats', () => {
      // Standard 6-char hex
      const colors1 = generateTheme('#6750A4');
      expect(colors1.primary).toBeTruthy();

      // Lowercase hex
      const colors2 = generateTheme('#6750a4');
      expect(colors2.primary).toBeTruthy();

      // Different colors
      const colors3 = generateTheme('#FF5722');
      expect(colors3.primary).toBeTruthy();
    });
  });

  describe('applyThemeToDom', () => {
    it('should set CSS custom properties on document root', () => {
      const colors = generateTheme('#6750A4');

      applyThemeToDom(colors);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary-500')).toBe(colors.primary);
      expect(root.style.getPropertyValue('--color-secondary')).toBe(colors.secondary);
      expect(root.style.getPropertyValue('--color-background')).toBe(colors.background);
    });

    it('should apply all primary colors', () => {
      const colors = generateTheme('#6750A4');

      applyThemeToDom(colors);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary-500')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-primary-600')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-primary-container')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-on-primary-container')).toBeTruthy();
    });

    it('should apply secondary colors', () => {
      const colors = generateTheme('#6750A4');

      applyThemeToDom(colors);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-secondary')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-on-secondary')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-secondary-container')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-on-secondary-container')).toBeTruthy();
    });

    it('should apply tertiary colors', () => {
      const colors = generateTheme('#6750A4');

      applyThemeToDom(colors);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-tertiary-500')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-tertiary-container')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-on-tertiary-container')).toBeTruthy();
    });

    it('should apply error colors', () => {
      const colors = generateTheme('#6750A4');

      applyThemeToDom(colors);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-error')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-on-error')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-error-container')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-on-error-container')).toBeTruthy();
    });

    it('should apply surface and background colors', () => {
      const colors = generateTheme('#6750A4');

      applyThemeToDom(colors);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-background')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-on-background')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-surface-dark')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-surface-variant')).toBeTruthy();
    });

    it('should apply outline colors', () => {
      const colors = generateTheme('#6750A4');

      applyThemeToDom(colors);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-outline')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-outline-variant')).toBeTruthy();
    });

    it('should apply inverse colors', () => {
      const colors = generateTheme('#6750A4');

      applyThemeToDom(colors);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-inverse-surface')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-inverse-on-surface')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-inverse-primary')).toBeTruthy();
    });

    it('should apply scrim and shadow colors', () => {
      const colors = generateTheme('#6750A4');

      applyThemeToDom(colors);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-scrim')).toBeTruthy();
      expect(root.style.getPropertyValue('--color-shadow')).toBeTruthy();
    });

    it('should overwrite existing theme', () => {
      const blueTheme = generateTheme('#0000FF');
      const redTheme = generateTheme('#FF0000');

      applyThemeToDom(blueTheme);
      const blueValue = document.documentElement.style.getPropertyValue('--color-primary-500');

      applyThemeToDom(redTheme);
      const redValue = document.documentElement.style.getPropertyValue('--color-primary-500');

      expect(blueValue).not.toBe(redValue);
      expect(redValue).toBe(redTheme.primary);
    });

    it('should handle custom color objects', () => {
      const customColors: ThemeColors = {
        primary: '#FF0000',
        onPrimary: '#FFFFFF',
        primaryContainer: '#FFE0E0',
        onPrimaryContainer: '#400000',
        secondary: '#00FF00',
        onSecondary: '#000000',
        secondaryContainer: '#E0FFE0',
        onSecondaryContainer: '#004000',
        tertiary: '#0000FF',
        onTertiary: '#FFFFFF',
        tertiaryContainer: '#E0E0FF',
        onTertiaryContainer: '#000040',
        error: '#B00020',
        onError: '#FFFFFF',
        errorContainer: '#FFE0E0',
        onErrorContainer: '#400000',
        background: '#121212',
        onBackground: '#FFFFFF',
        surface: '#121212',
        onSurface: '#FFFFFF',
        surfaceVariant: '#333333',
        onSurfaceVariant: '#CCCCCC',
        outline: '#888888',
        outlineVariant: '#444444',
        inverseSurface: '#FFFFFF',
        inverseOnSurface: '#000000',
        inversePrimary: '#FF0000',
        scrim: '#000000',
        shadow: '#000000',
      };

      applyThemeToDom(customColors);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary-500')).toBe('#FF0000');
      expect(root.style.getPropertyValue('--color-secondary')).toBe('#00FF00');
    });
  });

  describe('Integration', () => {
    it('should generate and apply theme in one flow', () => {
      const colors = generateTheme('#4CAF50'); // Material Green

      applyThemeToDom(colors);

      const root = document.documentElement;
      // Verify some colors were applied
      expect(root.style.getPropertyValue('--color-primary-500')).toBe(colors.primary);
    });

    it('should support theme switching', () => {
      const theme1 = generateTheme('#F44336'); // Red
      const theme2 = generateTheme('#2196F3'); // Blue

      applyThemeToDom(theme1);
      expect(document.documentElement.style.getPropertyValue('--color-primary-500')).toBe(theme1.primary);

      applyThemeToDom(theme2);
      expect(document.documentElement.style.getPropertyValue('--color-primary-500')).toBe(theme2.primary);
    });
  });
});
