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
        bgCoal: "#050003", //COLOR DE BACKGROUND
        prinFuchsia: "#B02F92", //COLOR PRINCIPAL
        bkprinFuchsiaOpacity: "#5b174b",
        secSky: "#3DC2DD", //COLOR SECUNDARIO
        secSkyDark: "#217080", // COLOR SECUNDARIO OSCURO
        txtBlack: "#000000", //COLOR DE TEXTO NEGRO
        txtWhite: "#FFFFFF", //COLOR DE TEXTO BLANCO
        btnSkyDef: "#4DA8D3", //COLOR DE BOTÓN DEFAULT (EN DISABLE ES EL MISMO PERO CON -50% DE BRILLO)
        btnSkyHov: "#1EB1F6", //COLOR DE BOTÓN HOVER
        btnFuchsiaDef: "#BA238C", //COLOR DE BOTÓN DEFAULT (EN DISABLE ES EL MISMO PERO CON -50% DE BRILLO)
        btnFuchsiaHov: "#EC08A6", //COLOR DE BOTÓN HOVER/SELECTED
        prinFuchsiaOpacity: "#7b0958",
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
