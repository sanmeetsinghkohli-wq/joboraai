import type { Config } from 'tailwindcss';

/**
 * Jobora design tokens.
 *
 * Brand identity: ivory canvas, plum for text and primary actions,
 * coral as the single accent, green for success only.
 * Coral (#E76F72) does not meet 4.5:1 on white, so text uses coral-700
 * and coral fills carry plum text.
 */
const config: Config = {
  content: ['./apps/web/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F8F5F0',
        paper: '#FFFFFF',
        sand: '#F1EBE4',
        line: '#E9E1DB',
        ink: {
          DEFAULT: '#1D1A21',
          muted: '#5F525B',
          subtle: '#7C7079',
        },
        plum: {
          DEFAULT: '#351B32',
          50: '#F7F1F6',
          100: '#EDE2EB',
          200: '#D9C4D5',
          600: '#4A2A46',
          900: '#261224',
        },
        coral: {
          DEFAULT: '#E76F72',
          50: '#FEF4F3',
          100: '#FBE4E3',
          200: '#F6C6C5',
          600: '#D4585B',
          700: '#A93C41',
        },
        success: {
          DEFAULT: '#268566',
          100: '#DDF1EA',
          700: '#1B6850',
        },
        warn: {
          DEFAULT: '#8A5300',
          100: '#FBEFD9',
        },
        danger: {
          DEFAULT: '#A8261F',
          100: '#FBE7E5',
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
