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

const COLORS = {
  surface: "#0e1117",
  raised: "#161b24",
  line: "#2a3342",
  ink: "#e6ebf2",
  inkMuted: "#9aa6b8",
  inkFaint: "#78859e",
  accent: "#5ba8f5",
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
