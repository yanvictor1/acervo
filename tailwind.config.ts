import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f6f6f7',
          100: '#e2e3e6',
          200: '#c5c7cd',
          300: '#a1a3ad',
          400: '#7d808e',
          500: '#636672',
          600: '#4e515b',
          700: '#40424a',
          800: '#373940',
          900: '#1a1b1f',
          950: '#0e0f12',
        },
        paper: {
          50: '#fcfbf8',
          100: '#f7f4ed',
          200: '#efe9da',
          300: '#e4d9bc',
          400: '#d7c69a',
          500: '#ccb47d',
          600: '#bfa163',
          700: '#a88a4f',
          800: '#8b6f44',
          900: '#725b3a',
          950: '#3d2f1d',
        },
        amber: {
          50: '#fff8ed',
          100: '#fdefd6',
          200: '#f9dbac',
          300: '#f4c278',
          400: '#eda23e',
          500: '#e98a17',
          600: '#da6e0c',
          700: '#b5520c',
          800: '#904112',
          900: '#743612',
          950: '#3f1a07',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.35s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
