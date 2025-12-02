import {
  argbFromHex,
  themeFromSourceColor,
  hexFromArgb
} from "@material/material-color-utilities";

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  scrim: string;
  shadow: string;
}

export const generateTheme = (sourceColor: string, isDark: boolean = true) => {
  const theme = themeFromSourceColor(argbFromHex(sourceColor));
  const scheme = isDark ? theme.schemes.dark : theme.schemes.light;

  const colors: ThemeColors = {
    primary: hexFromArgb(scheme.primary),
    onPrimary: hexFromArgb(scheme.onPrimary),
    primaryContainer: hexFromArgb(scheme.primaryContainer),
    onPrimaryContainer: hexFromArgb(scheme.onPrimaryContainer),
    secondary: hexFromArgb(scheme.secondary),
    onSecondary: hexFromArgb(scheme.onSecondary),
    secondaryContainer: hexFromArgb(scheme.secondaryContainer),
    onSecondaryContainer: hexFromArgb(scheme.onSecondaryContainer),
    tertiary: hexFromArgb(scheme.tertiary),
    onTertiary: hexFromArgb(scheme.onTertiary),
    tertiaryContainer: hexFromArgb(scheme.tertiaryContainer),
    onTertiaryContainer: hexFromArgb(scheme.onTertiaryContainer),
    error: hexFromArgb(scheme.error),
    onError: hexFromArgb(scheme.onError),
    errorContainer: hexFromArgb(scheme.errorContainer),
    onErrorContainer: hexFromArgb(scheme.onErrorContainer),
    background: hexFromArgb(scheme.background),
    onBackground: hexFromArgb(scheme.onBackground),
    surface: hexFromArgb(scheme.surface),
    onSurface: hexFromArgb(scheme.onSurface),
    surfaceVariant: hexFromArgb(scheme.surfaceVariant),
    onSurfaceVariant: hexFromArgb(scheme.onSurfaceVariant),
    outline: hexFromArgb(scheme.outline),
    outlineVariant: hexFromArgb(scheme.outlineVariant),
    inverseSurface: hexFromArgb(scheme.inverseSurface),
    inverseOnSurface: hexFromArgb(scheme.inverseOnSurface),
    inversePrimary: hexFromArgb(scheme.inversePrimary),
    scrim: hexFromArgb(scheme.scrim),
    shadow: hexFromArgb(scheme.shadow),
  };

  return colors;
};

export const applyThemeToDom = (colors: ThemeColors) => {
  const root = document.documentElement;

  // Map to our CSS variables
  root.style.setProperty('--color-primary-500', colors.primary);
  root.style.setProperty('--color-primary-600', colors.primary); // Mapping accent to primary for now
  root.style.setProperty('--color-primary-container', colors.primaryContainer);
  root.style.setProperty('--color-on-primary-container', colors.onPrimaryContainer);

  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-on-secondary', colors.onSecondary);
  root.style.setProperty('--color-secondary-container', colors.secondaryContainer);
  root.style.setProperty('--color-on-secondary-container', colors.onSecondaryContainer);

  root.style.setProperty('--color-tertiary-500', colors.tertiary);
  root.style.setProperty('--color-tertiary-container', colors.tertiaryContainer);
  root.style.setProperty('--color-on-tertiary-container', colors.onTertiaryContainer);

  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-on-error', colors.onError);
  root.style.setProperty('--color-error-container', colors.errorContainer);
  root.style.setProperty('--color-on-error-container', colors.onErrorContainer);

  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-on-background', colors.onBackground);

  root.style.setProperty('--color-surface-dark', colors.surface);
  root.style.setProperty('--color-neutral-50', colors.onSurface);
  root.style.setProperty('--color-surface-variant', colors.surfaceVariant);
  root.style.setProperty('--color-on-surface-variant', colors.onSurfaceVariant);

  root.style.setProperty('--color-outline', colors.outline);
  root.style.setProperty('--color-outline-variant', colors.outlineVariant);

  root.style.setProperty('--color-inverse-surface', colors.inverseSurface);
  root.style.setProperty('--color-inverse-on-surface', colors.inverseOnSurface);
  root.style.setProperty('--color-inverse-primary', colors.inversePrimary);

  root.style.setProperty('--color-scrim', colors.scrim);
  root.style.setProperty('--color-shadow', colors.shadow);
};
