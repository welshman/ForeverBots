/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        arcane: {
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
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
