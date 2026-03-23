/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        surface: {
          600: '#1e293b',
          700: '#1a2235',
          800: '#131929',
          900: '#0d1117',
        },
        accent: {
          green:  '#22c55e',
          yellow: '#eab308',
          red:    '#ef4444',
          orange: '#f97316',
        },
      },
      boxShadow: {
        glow: '0 0 15px rgba(14, 165, 233, 0.25)',
        'glow-green': '0 0 15px rgba(34, 197, 94, 0.25)',
      },
      keyframes: {
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.15s ease-out',
        'fade-in':  'fade-in  0.2s ease-out',
      },
    },
  },
  plugins: [],
}
