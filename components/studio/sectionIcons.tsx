import type { ReactNode } from "react";

/**
 * Inline glyphs used as section dividers in the authoring studio. Decorative
 * (the heading text is the accessible name); rendered at a small fixed size and
 * inheriting currentColor. Inline SVG, so there is no asset to miss.
 */

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      {children}
    </svg>
  );
}

export const STUDIO_SECTION_ICONS: Record<string, ReactNode> = {
  // Scenario details: a labelled document.
  scenario: (
    <Icon>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Icon>
  ),
  // Initial metrics: a small dial.
  metrics: (
    <Icon>
      <path d="M4 14a8 8 0 0 1 16 0" />
      <path d="M12 14l4-3" />
      <circle cx="12" cy="14" r="1.2" />
    </Icon>
  ),
  // Steps: a branching flow.
  steps: (
    <Icon>
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="12" r="2" />
      <path d="M8 6h4a4 4 0 0 1 4 4M8 18h4a4 4 0 0 0 4-4" />
    </Icon>
  ),
  // JSON in/out: braces.
  json: (
    <Icon>
      <path d="M8 4a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2" />
      <path d="M16 4a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2" />
    </Icon>
  ),
  // Outcome distribution: bars.
  distribution: (
    <Icon>
      <line x1="6" y1="20" x2="6" y2="11" />
      <line x1="12" y1="20" x2="12" y2="5" />
      <line x1="18" y1="20" x2="18" y2="14" />
    </Icon>
  ),
  // Outcomes: a flag.
  outcomes: (
    <Icon>
      <path d="M6 21V4M6 4h11l-2 3 2 3H6" />
    </Icon>
  ),
  // Outcome rules: a checklist.
  rules: (
    <Icon>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6l1 1 1.5-2M4 12l1 1 1.5-2M4 18l1 1 1.5-2" />
    </Icon>
  ),
  // Missed signals: a muted alert.
  signals: (
    <Icon>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M10.5 21a2 2 0 0 0 3 0" />
    </Icon>
  ),
};
