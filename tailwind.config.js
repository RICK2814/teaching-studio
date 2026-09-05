/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{html,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#0b0d12',
          panel: '#12151c',
          panel2: '#171b24',
          border: '#242938',
          accent: '#5b8cff',
          accent2: '#8b6bff',
          text: '#e7e9ee',
          muted: '#8a90a2',
          rec: '#ff4d4f'
        }
      },
      borderRadius: {
        xl2: '1.1rem'
      }
    }
  },
  plugins: []
}
