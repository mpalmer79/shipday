import type { ReactElement } from "react";

/**
 * Shared element tree for the social card images generated through the
 * opengraph-image file convention. One renderer keeps the product card and
 * the per-scenario cards in the same visual style: the palette and layout
 * follow the app's tokens (restated as plain hex so the card stands alone).
 * ImageResponse supports a constrained CSS subset, so this matches the
 * intent of the previous SVG cards, not their exact pixels.
 */

export const OG_SIZE = { width: 1200, height: 630 };

// Mirrors the app's dark-slate surface tokens (globals.css) restated as hex so
// the generated card stands alone. Kept in lockstep with the :root palette.
const COLORS = {
  surface: "#1a1e26", // --surface 26 30 38
  raised: "#2c323e", // --surface-raised 44 50 62
  line: "#40495a", // --surface-line 64 73 90
  ink: "#e0e5ed", // --ink 224 229 237
  inkMuted: "#a0abbc", // --ink-muted 160 171 188
  inkFaint: "#808ca2", // --ink-faint 128 140 162
  accent: "#60aaf5", // --accent 96 170 245
};

export function renderOgCard(params: {
  eyebrow: string;
  title: string;
  tagline: string;
}): ReactElement {
  const { eyebrow, title, tagline } = params;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: COLORS.surface,
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: COLORS.raised,
          border: `2px solid ${COLORS.line}`,
          borderRadius: 20,
          padding: 48,
        }}
      >
        <div
          style={{
            width: 56,
            height: 8,
            borderRadius: 4,
            backgroundColor: COLORS.accent,
          }}
        />
        <div
          style={{
            marginTop: 28,
            fontSize: 24,
            letterSpacing: 4,
            color: COLORS.accent,
          }}
        >
          {eyebrow.toUpperCase()}
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: title.length > 24 ? 76 : 92,
            fontWeight: 700,
            color: COLORS.ink,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 36,
            color: COLORS.inkMuted,
            lineHeight: 1.4,
            maxWidth: 980,
          }}
        >
          {tagline}
        </div>
        <div style={{ display: "flex", flexGrow: 1 }} />
        <div style={{ fontSize: 22, color: COLORS.inkFaint }}>
          fully deterministic · runs entirely in your browser · no API calls
        </div>
      </div>
    </div>
  );
}
