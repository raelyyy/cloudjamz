/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          black: '#121212',
          dark: '#000000',
          green: '#1DB954',
          light: '#535353',
          lighter: '#B3B3B3',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}

