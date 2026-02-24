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
    },
  },
  plugins: [],
}
