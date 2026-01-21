/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Noto Sans JP"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Hiragino Sans"',
          '"Hiragino Kaku Gothic ProN"',
          '"Yu Gothic"',
          'Meiryo',
          'sans-serif',
        ],
      },
      colors: {
        // ウォームグレー（柔らかく高級感のある色調）
        gray: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },
      },
      boxShadow: {
        // 繊細で上品な影
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.06), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
      },
      borderRadius: {
        // 少し大きめの角丸で柔らかい印象
        'lg': '0.625rem',
        'xl': '0.875rem',
        '2xl': '1.125rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
