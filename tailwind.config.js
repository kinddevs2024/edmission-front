/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#0F172A',
          accent: '#84CC16',
        },
        secondary: '#1E293B',
        surface: {
          light: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E5E7EB',
        },
        dark: {
          bg: '#0F172A',
          card: '#111827',
          border: '#1F2937',
          text: '#F9FAFB',
          muted: '#CBD5E1',
        },
        status: {
          accepted: '#22C55E',
          'under-review': '#3B82F6',
          'offer-sent': '#84CC16',
          rejected: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['2rem', { lineHeight: '2.5rem' }],
        h2: ['1.5rem', { lineHeight: '2rem' }],
        h3: ['1.125rem', { lineHeight: '1.75rem' }],
      },
      spacing: {
        sidebar: '260px',
      },
      borderRadius: {
        card: '16px',
        input: '12px',
      },
      maxWidth: {
        content: '1400px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'drawer-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'page-enter': 'fade-in 0.35s ease-out forwards',
        'card-enter': 'fade-in-up 0.4s ease-out forwards',
        'modal-enter': 'scale-in 0.25s ease-out',
        'list-enter': 'slide-in-right 0.3s ease-out forwards',
        'drawer-enter': 'drawer-in 0.25s ease-out forwards',
      },
      transitionProperty: {
        'press': 'transform, box-shadow',
      },
    },
  },
  plugins: [],
}
