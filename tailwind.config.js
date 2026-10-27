/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        repo: {
          paper: '#f5f4ef',
          ink: '#20342f',
          forest: '#17382f',
          lime: '#d8ef7a',
          coral: '#ed7657',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
