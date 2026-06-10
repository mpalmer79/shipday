import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#0e1117",
          raised: "#161b24",
          overlay: "#1d2430",
          line: "#2a3342",
        },
        ink: {
          DEFAULT: "#e6ebf2",
          muted: "#9aa6b8",
          faint: "#5e6b80",
        },
        accent: {
          DEFAULT: "#5ba8f5",
          soft: "#2b4564",
        },
        good: "#4ade80",
        warn: "#fbbf24",
        bad: "#f87171",
      },
      keyframes: {
        riskPulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(248, 113, 113, 0.45)" },
          "100%": { boxShadow: "0 0 0 14px rgba(248, 113, 113, 0)" },
        },
        deltaFade: {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-6px)" },
        },
      },
      animation: {
        "risk-pulse": "riskPulse 0.7s ease-out 1",
        "delta-fade": "deltaFade 1.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
