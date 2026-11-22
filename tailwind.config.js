/** @type {import('tailwindcss').Config} */
// Theme matches the LifeSavers Elite website (lifesaverselite.com): warm black, oxblood red, gold, Playfair Display headings.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0a0c',
        surface: '#121014',
        nav: '#0b0a0c',
        primary: '#c41e3a',       // text accent; .bg-primary is painted with the site's oxblood gradient in index.css
        oxblood: '#8b0f24',
        gold: { DEFAULT: '#c9a45c', light: '#e8cf94' },
        success: '#4ade80',
        warning: '#f59e0b',
        indigo: 'rgba(99,102,241,1)',
        // Warm neutrals instead of Tailwind's blue-greys, to match the site
        gray: {
          100: '#f4efe9', 200: '#e6dfd8', 300: '#ddd5cf', 400: '#b3a9a6', 500: '#8f8582',
          600: '#6b6260', 700: '#3a3335', 800: '#241f21', 900: '#171315',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
}
