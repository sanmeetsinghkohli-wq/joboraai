import type { Config } from 'tailwindcss';

/**
 * Jobora design tokens.
 *
 * Brand identity: ivory canvas, plum for text and primary actions,
 * coral as the single accent, green for success only.
 * Coral (#E76F72) does not meet 4.5:1 on white, so text uses coral-700
 * and coral fills carry plum text.
 *
 * Colours are CSS variables (apps/web/src/app/globals.css) so the workspace
 * can switch to dark mode: <html data-theme="dark">.
 */
const config: Config = {
  content: ['./apps/web/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: 'rgb(var(--c-ivory) / <alpha-value>)',
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        sand: 'rgb(var(--c-sand) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          muted: 'rgb(var(--c-ink-muted) / <alpha-value>)',
          subtle: 'rgb(var(--c-ink-subtle) / <alpha-value>)',
        },
        plum: {
          DEFAULT: 'rgb(var(--c-plum) / <alpha-value>)',
          50: 'rgb(var(--c-plum-50) / <alpha-value>)',
          100: 'rgb(var(--c-plum-100) / <alpha-value>)',
          200: 'rgb(var(--c-plum-200) / <alpha-value>)',
          600: 'rgb(var(--c-plum-600) / <alpha-value>)',
          900: 'rgb(var(--c-plum-900) / <alpha-value>)',
        },
        coral: {
          DEFAULT: 'rgb(var(--c-coral) / <alpha-value>)',
          50: 'rgb(var(--c-coral-50) / <alpha-value>)',
          100: 'rgb(var(--c-coral-100) / <alpha-value>)',
          200: 'rgb(var(--c-coral-200) / <alpha-value>)',
          600: 'rgb(var(--c-coral-600) / <alpha-value>)',
          700: 'rgb(var(--c-coral-700) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--c-success) / <alpha-value>)',
          100: 'rgb(var(--c-success-100) / <alpha-value>)',
          700: 'rgb(var(--c-success-700) / <alpha-value>)',
        },
        warn: {
          DEFAULT: 'rgb(var(--c-warn) / <alpha-value>)',
          100: 'rgb(var(--c-warn-100) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--c-danger) / <alpha-value>)',
          100: 'rgb(var(--c-danger-100) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.1rem' }],
        sm: ['0.875rem', { lineHeight: '1.35rem' }],
        base: ['1rem', { lineHeight: '1.6rem' }],
        lg: ['1.125rem', { lineHeight: '1.7rem' }],
        xl: ['1.375rem', { lineHeight: '1.8rem' }],
        '2xl': ['1.75rem', { lineHeight: '2.15rem', letterSpacing: '-0.01em' }],
        '3xl': ['2.25rem', { lineHeight: '2.6rem', letterSpacing: '-0.015em' }],
        '4xl': ['3rem', { lineHeight: '3.25rem', letterSpacing: '-0.02em' }],
        '5xl': ['3.75rem', { lineHeight: '3.9rem', letterSpacing: '-0.025em' }],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(53,27,50,0.04), 0 4px 16px rgba(53,27,50,0.04)',
        raised: '0 2px 4px rgba(53,27,50,0.05), 0 12px 32px rgba(53,27,50,0.08)',
        float: '0 24px 60px -12px rgba(53,27,50,0.28)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-10px,0)' },
        },
        orbit: {
          from: { transform: 'rotateX(68deg) rotateZ(0deg)' },
          to: { transform: 'rotateX(68deg) rotateZ(360deg)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 240ms cubic-bezier(0.16,1,0.3,1) both',
        float: 'float 7s ease-in-out infinite',
        orbit: 'orbit 26s linear infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
