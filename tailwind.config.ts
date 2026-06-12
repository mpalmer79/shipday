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
        // Showpiece (v6) palette: a deeper operations-room layer on top of the
        // simulator surfaces. The accent runs cool by default and hot under
        // pressure; hot is the showcase's pressure colour, distinct from the
        // semantic warn/bad.
        void: "rgb(var(--void) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        edge: "rgb(var(--edge) / <alpha-value>)",
        hot: {
          DEFAULT: "rgb(var(--hot) / <alpha-value>)",
          soft: "rgb(var(--hot-soft) / <alpha-value>)",
        },
        // Agency-ops (v7) cinematic tokens. Classified amber, tactical signal
        // green, and the alert reds drive the mission framing and the
        // red-alert takeover. Channels so alpha modifiers keep working.
        classified: "rgb(var(--classified) / <alpha-value>)",
        signal: "rgb(var(--signal) / <alpha-value>)",
        alert: {
          DEFAULT: "rgb(var(--alert) / <alpha-value>)",
          bright: "rgb(var(--alert-bright) / <alpha-value>)",
          deep: "rgb(var(--alert-deep) / <alpha-value>)",
          banner: "rgb(var(--alert-banner) / <alpha-value>)",
        },
        good: "#4ade80",
        warn: "#fbbf24",
        bad: "#f87171",
      },
      fontSize: {
        // Headline scale for the showpiece. Fluid so it reads on phone and
        // desktop without per-breakpoint overrides.
        display: ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "display-sm": ["clamp(1.75rem, 3.5vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
      },
      boxShadow: {
        // Light as the primary effect: panels catch accent light at their edge.
        glow: "0 0 40px -12px rgb(var(--accent) / 0.45)",
        "glow-hot": "0 0 40px -12px rgb(var(--hot) / 0.5)",
        "glow-sm": "0 0 20px -8px rgb(var(--accent) / 0.4)",
        // Composed panel depth: a top edge highlight, a grounded drop, and a
        // faint tonal glow, so a panel reads as lit by screens in a dim room.
        panel:
          "0 1px 0 0 rgb(var(--edge) / 0.3) inset, 0 24px 48px -28px rgb(0 0 0 / 0.85), 0 0 36px -16px rgb(var(--accent) / 0.3)",
        "panel-hot":
          "0 1px 0 0 rgb(var(--edge) / 0.3) inset, 0 24px 48px -28px rgb(0 0 0 / 0.85), 0 0 36px -16px rgb(var(--hot) / 0.34)",
      },
      backgroundImage: {
        // A faint engineering grid for panel interiors.
        "grid-faint":
          "linear-gradient(rgb(var(--edge) / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--edge) / 0.08) 1px, transparent 1px)",
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
        // Showpiece living-UI keyframes. All are short, transform/opacity only,
        // and gated under reduced motion by the global contract in globals.css.
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" },
        },
        barGrow: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        // Every animation except the outcome resolution moment stays at or
        // under 600ms (see docs/DESIGN.md for the full inventory). The single
        // ambient high-risk glow is defined in globals.css so it can be scoped
        // to the high-risk state through a descendant selector.
        "risk-pulse": "riskPulse 0.6s ease-out 1",
        "delta-fade": "deltaFade 0.6s ease-out forwards",
        "stage-in": "stageIn var(--motion-slow) var(--ease-entrance) both",
        // The cursor blink is the one permitted showpiece loop; like the high
        // risk glow it is ambient and stops under reduced motion.
        "cursor-blink": "blink 1.2s step-end infinite",
        "bar-grow": "barGrow var(--motion-slow) var(--ease-entrance) both",
        sweep: "sweep var(--motion-slow) var(--ease-standard) 1",
      },
    },
  },
  plugins: [],
};

export default config;
