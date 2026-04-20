import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f8f8f7",
          100: "#ececea",
          200: "#d9d9d6",
          300: "#b8b8b4",
          400: "#8e8e88",
          500: "#6b6b66",
          600: "#4a4a46",
          700: "#33332f",
          800: "#1f1f1c",
          900: "#121210",
        },
        accent: {
          DEFAULT: "#1f1f1c",
          soft: "#eceae4",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,15,13,0.04), 0 1px 1px rgba(15,15,13,0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
