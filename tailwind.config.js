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
        primary: '#7e25ea',
        'primary-hover': '#6a1fd0',
        'primary-light': '#9b4df2',
        'primary-dark': '#5a19b0',
        'primary-bg': '#f3eaff',
        secondary: '#06c8b5',
        'secondary-hover': '#05a69a',
        'secondary-light': '#21e6d3',
        'secondary-dark': '#049086',
        'secondary-bg': '#e0faf8',
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
        'pulse-slow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
      },
      animation: {
        'draw-circle-1': 'draw-circle-1 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'draw-lines': 'draw-lines 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.6s forwards',
        'draw-top-lines': 'draw-top-lines 0.3s cubic-bezier(0.4, 0, 0.2, 1) 1s forwards',
        'draw-horizontal-lines': 'draw-horizontal-lines 0.4s cubic-bezier(0.4, 0, 0.2, 1) 1.3s forwards',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
} 