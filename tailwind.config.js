/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'macos-sidebar': 'rgba(40, 40, 40, 0.7)',
        'macos-bg': '#1e1e1e',
        'macos-card': '#2d2d2d',
        primary: '#0A84FF', // macOS Blue
        success: '#30D158', // macOS Green
        danger: '#FF453A', // macOS Red
        warning: '#FF9F0A', // macOS Orange
        'secondary-text': '#98989D'
      },
      fontFamily: {
        display: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ]
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
}
