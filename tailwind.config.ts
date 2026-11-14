import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090B10",
        surface: "#10141D",
        card: "#141A25",
        elevated: "#1A2230",
        accent: "#477BFF",
        "accent-strong": "#2454D6",
        teal: "#36CFC9",
        text: "#F4F6FA",
        muted: "#929BAB",
        line: "#273142",
        success: "#35C58A",
        warning: "#E8B45A",
        danger: "#EF6464",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1200px",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
