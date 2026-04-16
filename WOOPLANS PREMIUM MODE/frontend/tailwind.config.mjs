/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f0ff",
          100: "#e0e0ff",
          200: "#c4c4ff",
          300: "#a0a0ff",
          400: "#7c7cff",
          500: "#1a1a2e",
          600: "#16162a",
          700: "#121225",
          800: "#0e0e1f",
          900: "#0a0a19",
        },
        accent: {
          50: "#fff8e1",
          100: "#ffecb3",
          200: "#ffe082",
          300: "#ffd54f",
          400: "#ffca28",
          500: "#e6a817",
          600: "#c49000",
          700: "#a37800",
          800: "#816000",
          900: "#604800",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
