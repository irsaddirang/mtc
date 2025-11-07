/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f7f7f8',
          100: '#e1e4e8',
          200: '#c4c9d4',
          300: '#a7aebe',
          400: '#8a93a8',
          500: '#6f7a92',
          600: '#5c6578',
          700: '#4a505e',
          800: '#383b45',
          900: '#25262c',
        },
        aurora: {
          teal: '#5efce8',
          blue: '#65c7f7',
          purple: '#845efc',
          pink: '#fc5efc',
          gold: '#f7ce68',
        },
      },
      boxShadow: {
        'frosted':
          '0 25px 45px rgba(15, 23, 42, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'soft-glow': '0 10px 40px rgba(94, 252, 232, 0.25)',
      },
      backdropBlur: {
        xl: '30px',
      },
    },
  },
  plugins: [],
}
