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
          DEFAULT: '#4CAF50',
          dark: '#45a049',
          light: '#66bb6a',
        },
        danger: {
          DEFAULT: '#dc3545',
          dark: '#c82333',
          light: '#e4606d',
        },
      },
    },
  },
  plugins: [],
}

