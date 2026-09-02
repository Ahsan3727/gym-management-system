/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14171A',
          soft: '#1E2226',
          line: '#2B3036',
        },
        bone: {
          DEFAULT: '#F6F5F1',
          dim: '#EAE8E1',
        },
        steel: {
          DEFAULT: '#545B62',
          light: '#8A9099',
        },
        ember: {
          DEFAULT: '#E1553A',
          dark: '#C43F27',
          light: '#F2A18E',
        },
        chalk: {
          DEFAULT: '#A8C23A',
          dark: '#7E9528',
        },
        iron: {
          DEFAULT: '#2F5D8A',
          dark: '#234764',
          light: '#6C93B8',
        },
      },
      fontFamily: {
        display: ['"Oswald"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
