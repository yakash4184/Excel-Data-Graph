/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5fbff',
          100: '#e6f4ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
      boxShadow: {
        panel: '0 10px 30px rgba(2, 132, 199, 0.08)',
      },
    },
  },
  plugins: [],
};
