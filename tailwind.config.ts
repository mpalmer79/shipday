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
      // Surface, ink, and accent are driven by CSS custom properties holding
      // space-separated RGB channels, so the risk-state layer can shift the
      // whole palette globally through one data attribute while Tailwind's
      // alpha modifiers (bg-accent/10, border-good/30) keep working. The
      // semantic good/warn/bad stay fixed: they read state, they do not set
      // the room's temperature.
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          overlay: "rgb(var(--surface-overlay) / <alpha-value>)",
          line: "rgb(var(--surface-line) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
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
        // The staged-entrance primitive: content rises into place. Stagger is
        // applied per element through animation-delay in the consuming view.
        stageIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // The single ambient treatment, used only in the high-risk state: a
        // slow breathing glow well under 1Hz. Nothing else loops.
        ambientPulse: {
          "0%, 100%": { opacity: "0.18" },
          "50%": { opacity: "0.42" },
        },
      },
      animation: {
        // Every animation except the outcome resolution moment stays at or
        // under 600ms (see docs/DESIGN.md for the full inventory).
        "risk-pulse": "riskPulse 0.6s ease-out 1",
        "delta-fade": "deltaFade 0.6s ease-out forwards",
        "stage-in": "stageIn var(--motion-slow) var(--ease-entrance) both",
        "ambient-pulse": "ambientPulse 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
