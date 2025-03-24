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
        primary: '#3626A7',
        'primary-hover': '#2B1F85',
        secondary: '#B80C09',
        'secondary-hover': '#940A07',
        bgCoal: '#000000',
        txtWhite: '#EFEFEF',
      },
      fontFamily: {
        maven: ['Maven Pro', 'sans-serif'],
      },
      keyframes: {
        'draw-circle-1': {
          '0%': { strokeDashoffset: '120' },
          '100%': { strokeDashoffset: '0' },
        },
        'draw-lines': {
          '0%': { strokeDashoffset: '180' },
          '100%': { strokeDashoffset: '0' },
        },
        'draw-top-lines': {
          '0%': { strokeDashoffset: '60' },
          '100%': { strokeDashoffset: '0' },
        },
        'draw-horizontal-lines': {
          '0%': { strokeDashoffset: '180' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'draw-circle-1': 'draw-circle-1 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'draw-lines': 'draw-lines 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.6s forwards',
        'draw-top-lines': 'draw-top-lines 0.3s cubic-bezier(0.4, 0, 0.2, 1) 1s forwards',
        'draw-horizontal-lines': 'draw-horizontal-lines 0.4s cubic-bezier(0.4, 0, 0.2, 1) 1.3s forwards',
      },
    },
  },
  plugins: [],
} 