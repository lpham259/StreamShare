/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          primary: '#651FFF',
          'primary-dark': '#4615B2',
          'primary-light': '#7C4DFF',
          dark: {
            bg: '#0F0F0F',
            surface: '#1F1F1F',
            card: '#2A2A2A',
            border: '#404040',
            text: '#FFFFFF',
            'text-secondary': '#AAAAAA',
          }
        },
      },
    },
    plugins: [],
  }