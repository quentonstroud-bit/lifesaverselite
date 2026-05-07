/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080d17',
        surface: '#0d1321',
        nav: '#0a0e1a',
        primary: '#C01428',
        success: '#4ade80',
        warning: '#f59e0b',
        indigo: 'rgba(99,102,241,1)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
