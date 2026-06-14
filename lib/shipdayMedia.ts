/**
 * Centralized multimedia asset map for ShipDay.
 *
 * Every visual the UI references lives here, so paths are defined once and the
 * components stay free of string literals. Assets are local-only and resolve
 * under `public/images/shipday/`; see that directory's README for the list of
 * art that still needs to be placed. Until an asset exists the UI renders a
 * styled fallback placeholder (see components/media/ImageFrame), so a missing
 * file never breaks a page — it just shows the sci-fi placeholder in its slot.
 *
 * Pure data: no imports, no logic beyond the small lookup helper at the bottom,
 * so it is safe to import from server and client components alike.
 */

const BASE = "/images/shipday";

/** Home page section visuals, keyed by the section they belong to. */
export const homeMedia = {
  hero: `${BASE}/hero-command-center.webp`,
  judgment: `${BASE}/judgment-under-fire.webp`,
  operationBoard: `${BASE}/operation-board-blueprint.webp`,
  ciPipeline: `${BASE}/ci-pipeline-chat.webp`,
  alertLadder: `${BASE}/alert-ladder-risk-gauge.webp`,
  missionOverview: `${BASE}/mission-dossier-overview.webp`,
} as const;

/** Import page visuals. */
export const importMedia = {
  dataIngestion: `${BASE}/import-data-ingestion.webp`,
  jsonStructure: `${BASE}/json-structure-visual.webp`,
} as const;

/** Studio page visuals. */
export const studioMedia = {
  authoringConsole: `${BASE}/studio-authoring-console.webp`,
  metricGauges: `${BASE}/studio-metric-gauges.webp`,
  stepTimeline: `${BASE}/studio-step-timeline.webp`,
} as const;

/** Compare page visuals. */
export const compareMedia = {
  splitScreen: `${BASE}/compare-runs-split-screen.webp`,
  emptyState: `${BASE}/compare-empty-state.webp`,
  runLink: `${BASE}/run-link-connection.webp`,
} as const;

/**
 * Footer and navigation assets. The agency badge is a raster image with a
 * styled fallback; the icon paths are catalogued here for completeness, but the
 * footer and nav render their glyphs as inline SVG (see FooterLinkIcon) so a
 * missing icon file can never show a broken image.
 */
export const brandMedia = {
  agencyBadge: `${BASE}/shipday-agency-badge.webp`,
  icons: {
    missions: `${BASE}/icon-missions.svg`,
    studio: `${BASE}/icon-studio.svg`,
    import: `${BASE}/icon-import.svg`,
    compare: `${BASE}/icon-compare.svg`,
    linkedin: `${BASE}/icon-linkedin.svg`,
    github: `${BASE}/icon-github.svg`,
  },
} as const;

/** A single mission's classified art and its semantic description. */
export type MissionVisual = {
  /** Local image path for the mission's dossier art. */
  image: string;
  /** Semantic alt text describing the still. */
  alt: string;
  /** One-line concept note for whoever produces the art. */
  concept: string;
};

/**
 * Mission visual mapping, keyed by the registry scenario id (the slug the app
 * already routes on). This is the single source of truth for mission art; no
 * component should hard-code a mission image path. Imported or studio-authored
 * scenarios that are not in this table fall back to a generic dossier still.
 */
export const missionVisuals: Record<string, MissionVisual> = {
  "just-add-a-button": {
    image: `${BASE}/mission-just-add-button.webp`,
    alt: "A checkout interface panel with a critical button missing, cordoned off with caution tape.",
    concept:
      "UI panel missing a critical button with caution tape across the gap.",
  },
  "the-broken-build": {
    image: `${BASE}/mission-broken-build.webp`,
    alt: "A continuous integration pipeline with broken red segments throwing sparks.",
    concept: "Failing CI pipeline with broken red segments and sparks.",
  },
  "the-missing-requirement": {
    image: `${BASE}/mission-missing-requirement.webp`,
    alt: "A specification document with a missing, damaged section torn from its center.",
    concept: "Specification document with a missing or damaged section.",
  },
  "friday-deploy": {
    image: `${BASE}/mission-friday-deploy.webp`,
    alt: "A nighttime deploy window with a glowing launch rising from a city rooftop.",
    concept:
      "Nighttime deploy window with a glowing launch from a city rooftop.",
  },
  "the-page": {
    image: `${BASE}/mission-black-signal.webp`,
    alt: "An urgent production incident page lit by alarm lighting with glitch artifacts.",
    concept: "Urgent production page with glitch effects and alarm lighting.",
  },
};

/** Generic dossier art for scenarios with no dedicated mapping. */
export const fallbackMissionVisual: MissionVisual = {
  image: homeMedia.missionOverview,
  alt: "A classified mission dossier still.",
  concept: "Generic mission dossier overview art.",
};

/**
 * Resolve the visual for a mission id, falling back to a generic dossier still
 * so imported and authored scenarios always have art to show.
 */
export function missionVisualFor(id: string): MissionVisual {
  return missionVisuals[id] ?? fallbackMissionVisual;
}
