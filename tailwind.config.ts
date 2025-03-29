import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./public/**/*.{js,ts,jsx,tsx,png,jpg}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/onborda/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // PALETA DE COLORES
      colors: {
        bgCoal: "#f0f4f8", //COLOR DE BACKGROUND (AHORA GRIS AZULADO SUAVE)
        bgDark: "#0f172a", //COLOR DE BACKGROUND DARK ALTERNATIVO
        bgDarkGradient: "#111827", //COLOR PARA GRADIENTES OSCUROS
        bgLight: "#f0f4f8", //COLOR DE BACKGROUND CLARO
        bgLightAlt: "#e6ebf2", //COLOR DE BACKGROUND CLARO ALTERNATIVO
        bgGray: "#dde5ee", //COLOR DE BACKGROUND GRIS CLARO
        bgDefault: "#f8fafc", //COLOR DE FONDO PREDETERMINADO
        prinFuchsia: "#7e25ea", //COLOR PRINCIPAL - ACTUALIZADO
        'primary': '#7e25ea', // COLOR PRINCIPAL ALIAS
        'primary-hover': '#6a1fd0',
        'primary-light': '#9b4df2',
        'primary-dark': '#5a19b0',
        'primary-bg': '#f3eaff',
        bkprinFuchsiaOpacity: "#4c1691", // ACTUALIZADO
        secSky: "#06c8b5", //COLOR SECUNDARIO - ACTUALIZADO
        'secondary': '#06c8b5', // COLOR SECUNDARIO ALIAS
        'secondary-hover': '#05a69a',
        'secondary-light': '#21e6d3',
        'secondary-dark': '#049086',
        'secondary-bg': '#e0faf8',
        secSkyDark: "#049086", // COLOR SECUNDARIO OSCURO - ACTUALIZADO
        txtBlack: "#000000", //COLOR DE TEXTO NEGRO
        txtWhite: "#FFFFFF", //COLOR DE TEXTO BLANCO
        btnSkyDef: "#06c8b5", //COLOR DE BOTÓN DEFAULT - ACTUALIZADO
        btnSkyHov: "#21e6d3", //COLOR DE BOTÓN HOVER - ACTUALIZADO
        btnFuchsiaDef: "#7e25ea",
        btnFuchsiaHov: "#6a1fd0", //COLOR DE BOTÓN HOVER/SELECTED - ACTUALIZADO
        prinFuchsiaOpacity: "#4c1691", // ACTUALIZADO
      },
      // FUENTES A UTILIZAR
      fontFamily: {
        mulish: ["Mulish", "sans-serif"],
        maven: ["Maven Pro", "sans-serif"],
      },
      screens: {
        large: "1025px",
        xsmall: "300px",
      },
    },
  },
  corePlugins: {
    aspectRatio: true,
  },
  darkMode: "class",
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
};
export default config;
