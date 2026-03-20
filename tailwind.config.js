/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['Trebuchet MS', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fdf8ee',
          100: '#f9edcc',
          200: '#f2d88a',
          300: '#ebc048',
          400: '#e4a91f',
          500: '#c8880f',
          600: '#a06608',
          700: '#7a4c09',
          800: '#65400e',
          900: '#563611',
          950: '#311c05',
        },
        earth: {
          50: '#f6f3ee',
          100: '#e8e0d0',
          200: '#d2c2a3',
          300: '#b89d70',
          400: '#a48050',
          500: '#8f6a3e',
          600: '#7a5534',
          700: '#62422b',
          800: '#523828',
          900: '#463025',
          950: '#261812',
        },
      },
    },
  },
  plugins: [],
}
