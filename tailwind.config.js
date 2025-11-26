/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        spotify: {
          black: '#121212',
          dark: '#000000',
          green: '#1DB954',
          light: '#535353',
          lighter: '#B3B3B3',
          white: '#FFFFFF',
        },
        // Light mode colors
        light: {
          black: '#FFFFFF',
          dark: '#F8F9FA',
          green: '#1DB954',
          light: '#E9ECEF',
          lighter: '#6C757D',
          white: '#000000',
        },
      },
    },
  },
  plugins: [],
}

