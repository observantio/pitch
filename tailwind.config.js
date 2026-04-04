import tailwindScrollbar from "tailwind-scrollbar";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Ubuntu Mono", "monospace"],
        mono: ["Ubuntu Mono", "monospace"],
      },
    },
  },
  plugins: [tailwindScrollbar()],
};
