/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe7ff',
          200: '#b8cfff',
          300: '#8bafff',
          400: '#5c8aff',
          500: '#3566f5',
          600: '#254dd1',
          700: '#1f3dab',
          800: '#1e3488',
          900: '#1d2f6c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
