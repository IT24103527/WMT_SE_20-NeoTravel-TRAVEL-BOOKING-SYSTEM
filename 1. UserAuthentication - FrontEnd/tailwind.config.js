/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F6EF7',
        dark:    '#1A1A2E',
        danger:  '#FF3B30',
      },
    },
  },
  plugins: [],
};
