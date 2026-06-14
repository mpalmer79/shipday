import type { ReactNode } from "react";

/**
 * Inline icon set for footer and navigation quick links. The icons are catalogued
 * in lib/shipdayMedia as svg paths for reference, but rendered inline here so a
 * missing icon file can never surface a broken image — the glyph is part of the
 * markup and inherits currentColor with the rest of the link. Decorative:
 * aria-hidden, with the link text as the accessible name.
 */

export type FooterIconName = "missions" | "studio" | "import" | "compare";

const PATHS: Record<FooterIconName, ReactNode> = {
  // A reticle over a dossier: choosing an operation.
  missions: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 5.5v2M12 16.5v2M5.5 12h2M16.5 12h2" />
    </>
  ),
  // Authoring sliders.
  studio: (
    <>
      <line x1="5" y1="6" x2="19" y2="6" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="5" y1="18" x2="19" y2="18" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
    </>
  ),
  // An arrow descending into a tray: ingesting JSON.
  import: (
    <>
      <path d="M12 3v10" />
      <path d="M8 9l4 4 4-4" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </>
  ),
  // Two panels side by side: comparison.
  compare: (
    <>
      <rect x="3" y="5" width="7" height="14" rx="1" />
      <rect x="14" y="5" width="7" height="14" rx="1" />
      <path d="M12 3v18" strokeDasharray="2 2" />
    </>
  ),
};

export function FooterLinkIcon({
  name,
  className = "h-4 w-4",
}: {
  name: FooterIconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
