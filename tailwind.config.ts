import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#0F6E56",
          light: "#E6F2EF",
          dark: "#0B5744",
        },
        surface: "#FFFFFF",
        surfacealt: "#F7F8F7",
        ink: {
          DEFAULT: "#16201C",
          soft: "#5B6660",
          faint: "#8A938E",
        },
        danger: "#B4432F",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(22, 32, 28, 0.04), 0 1px 8px rgba(22, 32, 28, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
