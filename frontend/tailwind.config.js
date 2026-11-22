/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        arcane: {
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
        },
        gold: {
          300: "#fde68a",
          400: "#f5c451",
          500: "#d4a024",
          600: "#b48216",
        },
        obsidian: {
          900: "#0d111a",
          950: "#070a10",
        },
        ember: {
          400: "#fb923c",
          500: "#f97316",
        },
      },
    },
  },
  plugins: [],
};
