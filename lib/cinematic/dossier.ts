import type { ScenarioDifficulty } from "@/data/scenarios";

/**
 * Presentation-only dossier metadata for the mission framing. None of this
 * touches gameplay: it is the spy-thriller chrome the experience layer wraps
 * around the real scenarios. Codenames map the five registry scenarios to
 * operation names; threat levels are derived from the scenario difficulty so
 * the framing can never disagree with the registry's own ordering.
 */

export type ThreatLevel = {
  /** Short tactical label shown on the dossier. */
  label: string;
  /** One through four, for the meter. */
  rank: 1 | 2 | 3 | 4;
  /** Token name used for colour, mapped in the components. */
  tone: "signal" | "classified" | "alert" | "alert-bright";
};

const THREAT_BY_DIFFICULTY: Record<ScenarioDifficulty, ThreatLevel> = {
  starter: { label: "Minimal", rank: 1, tone: "signal" },
  intermediate: { label: "Guarded", rank: 2, tone: "classified" },
  advanced: { label: "Severe", rank: 3, tone: "alert" },
  expert: { label: "Critical", rank: 4, tone: "alert-bright" },
};

/**
 * Codenames for the registry scenarios, keyed by id. Original two-word
 * operation names in the genre, nothing borrowed. An imported scenario not in
 * this table gets a codename derived from its id below.
 */
const CODENAMES: Record<string, string> = {
  "just-add-a-button": "Blue Feather",
  "the-broken-build": "Red Circuit",
  "the-missing-requirement": "Silent Ledger",
  "friday-deploy": "Night Window",
  "the-page": "Black Signal",
};

/** A short briefing line per scenario, framing the day as an assignment. */
const DIRECTIVES: Record<string, string> = {
  "just-add-a-button":
    "A one-line directive lands at the checkout perimeter. Read the terrain before you move.",
  "the-broken-build":
    "The pipeline is compromised and the signal is intermittent. Find the real fault, not the convenient one.",
  "the-missing-requirement":
    "The specification has a hole in it. Close the gap before it ships into production.",
  "friday-deploy":
    "A change is staged for the quietest window of the week. The window is also when no one is watching.",
  "the-page":
    "The page is live and customers are exposed. Contain the incident, then close it out clean.",
};

/** Build a fallback codename from a scenario id for non-registry scenarios. */
function deriveCodename(id: string): string {
  const words = id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.length > 0 ? words.join(" ") : "Field Op";
}

export function codenameFor(id: string): string {
  return CODENAMES[id] ?? deriveCodename(id);
}

export function threatFor(difficulty: ScenarioDifficulty): ThreatLevel {
  return THREAT_BY_DIFFICULTY[difficulty];
}

export function directiveFor(id: string, fallback: string): string {
  return DIRECTIVES[id] ?? fallback;
}

/** A stable two-or-three letter case-file prefix, derived from the codename. */
export function fileTagFor(id: string): string {
  const name = codenameFor(id);
  const initials = name
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
  return `SD-${initials}`;
}
