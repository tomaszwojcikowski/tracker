/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-lg': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px' }],
        'display-md': ['45px', { lineHeight: '52px', letterSpacing: '0px' }],
        'display-sm': ['36px', { lineHeight: '44px', letterSpacing: '0px' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '0px' }],
        'headline-md': ['28px', { lineHeight: '36px', letterSpacing: '0px' }],
        'headline-sm': ['24px', { lineHeight: '32px', letterSpacing: '0px' }],
        'title-lg': ['22px', { lineHeight: '28px', letterSpacing: '0px' }],
        'title-md': ['16px', { lineHeight: '24px', letterSpacing: '0.15px' }],
        'title-sm': ['14px', { lineHeight: '20px', letterSpacing: '0.1px' }],
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '0.5px' }],
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0.25px' }],
        'body-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.4px' }],
        'label-lg': ['14px', { lineHeight: '20px', letterSpacing: '0.1px' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.5px' }],
        'label-sm': ['11px', { lineHeight: '16px', letterSpacing: '0.5px' }],
      },
      colors: {
        sys: {
          black: 'var(--color-black)',
          surface: 'var(--color-surface-dark)',
          surfaceHigh: 'var(--color-surface-elevated)',
          surfaceVariant: 'var(--color-surface-variant)',
          onSurface: 'var(--color-neutral-50)',
          onSurfaceVar: 'var(--color-on-surface-variant)',
          onSurfaceVariant: 'var(--color-on-surface-variant)',
          primary: 'var(--color-primary-500)',
          primaryDim: 'var(--color-neutral-600)',
          accent: 'var(--color-primary-600)',
          tertiary: 'var(--color-tertiary-500)',
          success: 'var(--color-success-500)',
          outline: 'var(--color-outline)',
          outlineVar: 'var(--color-outline-variant)',
          outlineVariant: 'var(--color-outline-variant)',

          // MD3 Extended Roles
          primaryContainer: 'var(--color-primary-container)',
          onPrimaryContainer: 'var(--color-on-primary-container)',
          secondary: 'var(--color-secondary)',
          onSecondary: 'var(--color-on-secondary)',
          secondaryContainer: 'var(--color-secondary-container)',
          onSecondaryContainer: 'var(--color-on-secondary-container)',
          tertiaryContainer: 'var(--color-tertiary-container)',
          onTertiaryContainer: 'var(--color-on-tertiary-container)',
          error: 'var(--color-error)',
          onError: 'var(--color-on-error)',
          errorContainer: 'var(--color-error-container)',
          onErrorContainer: 'var(--color-on-error-container)',
          background: 'var(--color-background)',
          onBackground: 'var(--color-on-background)',
          inverseSurface: 'var(--color-inverse-surface)',
          inverseOnSurface: 'var(--color-inverse-on-surface)',
          inversePrimary: 'var(--color-inverse-primary)',
          scrim: 'var(--color-scrim)',
          shadow: 'var(--color-shadow)',
        },
        // Workout section colors (using rgb values for opacity support)
        warmup: {
          500: 'rgb(251 146 60 / <alpha-value>)',
          600: 'rgb(249 115 22 / <alpha-value>)',
          700: 'rgb(234 88 12 / <alpha-value>)',
        },
        skill: {
          500: 'rgb(167 139 250 / <alpha-value>)',
          600: 'rgb(139 92 246 / <alpha-value>)',
          700: 'rgb(124 58 237 / <alpha-value>)',
        },
        main: {
          500: 'rgb(52 211 153 / <alpha-value>)',
          600: 'rgb(16 185 129 / <alpha-value>)',
          700: 'rgb(5 150 105 / <alpha-value>)',
        },
        accessory: {
          500: 'rgb(96 165 250 / <alpha-value>)',
          600: 'rgb(59 130 246 / <alpha-value>)',
          700: 'rgb(37 99 235 / <alpha-value>)',
        },
        core: {
          500: 'rgb(251 191 36 / <alpha-value>)',
          600: 'rgb(245 158 11 / <alpha-value>)',
          700: 'rgb(217 119 6 / <alpha-value>)',
        },
        cooldown: {
          500: 'rgb(45 212 191 / <alpha-value>)',
          600: 'rgb(20 184 166 / <alpha-value>)',
          700: 'rgb(13 148 136 / <alpha-value>)',
        },
        // Error palette for direct access
        error: {
          50: 'var(--color-error-50)',
          100: 'var(--color-error-100)',
          200: 'var(--color-error-200)',
          300: 'var(--color-error-300)',
          400: 'var(--color-error-400)',
          500: 'var(--color-error-500)',
          600: 'var(--color-error-600)',
          700: 'var(--color-error-700)',
          800: 'var(--color-error-800)',
          900: 'var(--color-error-900)',
        },
        // Warning palette for direct access
        warning: {
          50: 'var(--color-warning-50)',
          100: 'var(--color-warning-100)',
          200: 'var(--color-warning-200)',
          300: 'var(--color-warning-300)',
          400: 'var(--color-warning-400)',
          500: 'var(--color-warning-500)',
          600: 'var(--color-warning-600)',
          700: 'var(--color-warning-700)',
          800: 'var(--color-warning-800)',
          900: 'var(--color-warning-900)',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'scale-bounce': 'scaleBounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: 0 },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        scaleBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59,130,246,0.6)' },
          '50%': { boxShadow: '0 0 30px rgba(59,130,246,0.8)' },
        }
      }
    }
  },
  plugins: [],
}
