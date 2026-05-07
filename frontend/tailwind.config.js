/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef7ff',
          100: '#d8ecff',
          200: '#b6dcff',
          400: '#7fb8ff',
          500: '#4f8cff',
          600: '#2f72e4',
          700: '#1f54b8',
        },
        secondary: {
          50: '#ecfbf0',
          100: '#c5f0d8',
          200: '#9ce2bb',
          500: '#22c55e',
          600: '#16a34a',
        },
        accent: {
          50: '#e8f2ff',
          100: '#c9d9ff',
          500: '#2563eb',
          600: '#1d4ed8',
        },
        moss: {
          50: '#edf9ef',
          100: '#d8f2d6',
          500: '#4f8f5f',
          600: '#356a44',
        },
        surface: {
          DEFAULT: '#f7f8fb',
          soft: '#e7eef7',
        },
      },
      boxShadow: {
        glass: '0 24px 80px rgba(15, 23, 42, 0.08)',
        glow: '0 0 0 18px rgba(37, 99, 235, 0.08)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      transitionDuration: {
        350: '350ms',
      },
    },
  },
  plugins: [],
};

