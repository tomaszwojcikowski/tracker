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
        // MD3 Display - Extra large, expressive text
        'display-lg': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px', fontWeight: '400' }],
        'display-md': ['45px', { lineHeight: '52px', letterSpacing: '0px', fontWeight: '400' }],
        'display-sm': ['36px', { lineHeight: '44px', letterSpacing: '0px', fontWeight: '400' }],
        // MD3 Headline - Large, prominent text
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '0px', fontWeight: '400' }],
        'headline-md': ['28px', { lineHeight: '36px', letterSpacing: '0px', fontWeight: '400' }],
        'headline-sm': ['24px', { lineHeight: '32px', letterSpacing: '0px', fontWeight: '400' }],
        // MD3 Title - Medium emphasis for section headers
        'title-lg': ['22px', { lineHeight: '28px', letterSpacing: '0px', fontWeight: '500' }],
        'title-md': ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '500' }],
        'title-sm': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        // MD3 Body - Default text for reading
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '0.5px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0.25px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.4px', fontWeight: '400' }],
        // MD3 Label - UI elements and buttons
        'label-lg': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
      },
      colors: {
        // MD3 sys tokens migrated to src/main.css @theme (Tailwind v4 CSS-first)
        // Workout section colors (Tailwind v4 with RGB channels for opacity support)
        // Migrated to src/main.css @theme block

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
        // MD3 elevation shadows
        'elevation-0': 'none',
        'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 6px 2px rgba(0, 0, 0, 0.15)',
        'elevation-3': '0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.3)',
        'elevation-4': '0 6px 10px 4px rgba(0, 0, 0, 0.15), 0 2px 3px rgba(0, 0, 0, 0.3)',
        'elevation-5': '0 8px 12px 6px rgba(0, 0, 0, 0.15), 0 4px 4px rgba(0, 0, 0, 0.3)',
      },
      spacing: {
        // MD3 spacing scale (4dp grid)
        '0.5': '2px',   // 0.5 * 4dp
        '1': '4px',     // 1 * 4dp
        '2': '8px',     // 2 * 4dp
        '3': '12px',    // 3 * 4dp
        '4': '16px',    // 4 * 4dp
        '5': '20px',    // 5 * 4dp
        '6': '24px',    // 6 * 4dp
        '8': '32px',    // 8 * 4dp
        '10': '40px',   // 10 * 4dp
        '12': '48px',   // 12 * 4dp
        '16': '64px',   // 16 * 4dp
        '20': '80px',   // 20 * 4dp
      },
      borderRadius: {
        // MD3 corner radius system
        'none': '0',
        'xs': '4px',    // Extra small
        'sm': '8px',    // Small
        'md': '12px',   // Medium
        'lg': '16px',   // Large
        'xl': '20px',   // Extra large
        '2xl': '24px',  // 2X large
        '3xl': '28px',  // 3X large
        'full': '9999px', // Full/pill
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
