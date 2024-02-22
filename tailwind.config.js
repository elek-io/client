import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    './node_modules/@elek-io/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: colors.cyan,
      },
    },
  },
  plugins: [],
};
