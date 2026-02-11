/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6c5ce7',
          hover: '#5a4bd1',
          light: '#a29bfe',
        },
        dark: {
          DEFAULT: '#0f0f23', // --bg
          card: '#1a1a2e',    // --bg-card
          sidebar: '#16213e', // --bg-sidebar
          input: '#1a1a2e',   // --bg-input
          lighter: '#1e272e', // --darker in old css, confusing naming map
        },
        text: {
            DEFAULT: '#e0e0e0', // --text
            muted: '#8b95a2',   // --text-muted
        },
        border: {
            DEFAULT: '#2a2a4a' // --border
        },
        danger: '#e17055',
        success: '#00b894',
        warning: '#fdcb6e',
      }
    },
  },
  plugins: [],
}
