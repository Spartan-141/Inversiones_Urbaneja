/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          300: '#d9f99d',
          400: '#bef264',
          500: '#a3e635', /* The vibrant lime */
          600: '#84cc16',
          700: '#65a30d',
          900: '#3f6212',
        },
        surface: {
          500: '#e5e7eb',
          600: '#f3f4f6', /* Elevated hover */
          700: '#ffffff', /* Main white cards */
          800: '#e9ebf0', /* Sidebar/Subtle backgrounds */
          900: '#d9dce3', /* App Root background */
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
