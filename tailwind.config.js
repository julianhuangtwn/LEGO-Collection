/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./views/**/*.ejs`],
  theme: {

    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    themes: [
      {
        lego: {
          ...require("daisyui/src/theming/themes")["[data-theme=cyberpunk"],   
          "base-100": "#ffcf00",
          "accent": "#007093",   
          'neutral': '#e3000b', 
        },
      },
    ],
  },
}

