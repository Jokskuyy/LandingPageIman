/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './parallax.js'],
  theme: {
    extend: {
      colors: {
        ink: '#161A22',
        surface: '#1D2430',
        raised: '#242C3A',
        paper: '#F2EEE6',
        lime: '#B5C98B',
        cobalt: '#5267A6',
        steel: '#AAB2C0',
        signal: '#CC826A',
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
