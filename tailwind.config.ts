import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#0B1220",
          50: "#E8EAF0",
          100: "#C5CAD9",
          200: "#9BA3BD",
          300: "#717DA1",
          400: "#4A567F",
          500: "#1C2742",
          600: "#151E33",
          700: "#0F1626",
          800: "#0B1220",
          900: "#070C16",
        },
        stone: {
          50: "#FCFBF9",
          100: "#F8F7F4",
          200: "#EDE9E3",
          300: "#DDD8CF",
          400: "#C2B8AA",
        },
        lime: {
          DEFAULT: "#D4FF32",
          50: "#F6FFD9",
          100: "#E9FFA8",
          200: "#D4FF32",
          300: "#C2F000",
          400: "#9EC400",
        },
        sale: {
          DEFAULT: "#FF4D23",
          light: "#FFF0EB",
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        editorial: ["var(--font-editorial)", "serif"],
      },
      boxShadow: {
        'soft': '0 2px 24px rgba(11,18,32,0.06)',
        'lift': '0 12px 40px rgba(11,18,32,0.12)',
      },
      borderRadius: {
        'xl2': '1.25rem',
      }
    },
  },
  plugins: [],
};
export default config;
