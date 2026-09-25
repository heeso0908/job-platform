/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F4FBEA',
          100: '#E4F6CC',
          200: '#CBEDA0',
          500: '#4CB944',
          600: '#3FA139',
          700: '#2F7F2C',
        },
        ink: { 900: '#191F28', 700: '#333D4B', 500: '#6B7684', 400: '#8B95A1', 200: '#E5E8EB', 100: '#F2F4F6' },
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Segoe UI', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
