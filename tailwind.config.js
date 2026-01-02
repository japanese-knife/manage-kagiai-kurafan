/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f3fb',
          100: '#e5e7f7',
          200: '#caceef',
          300: '#a5aee3',
          400: '#7d88d4',
          500: '#5f6bc8',
          600: '#383e86',
          700: '#2f3670',
          800: '#292e5e',
          900: '#26294f',
        },
        neutral: {
          50: '#fafbfc',
          100: '#f5f6f8',
          200: '#e9ecef',
          300: '#dde1e6',
          400: '#bfc5cd',
          500: '#8f969e',
          600: '#697077',
          700: '#4a5159',
          800: '#2d3238',
          900: '#1a1d21',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Hiragino Sans', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'soft-xl': '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
      },
    },
  },
  plugins: [],
};
