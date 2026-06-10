/**
 * Generates the social card SVGs committed under public/og.
 * Run with: npm run cards
 *
 * The cards are deterministic, dependency free, and authored in the
 * existing dark visual style (the tailwind tokens, restated here as plain
 * hex so the SVG stands alone). One product card plus one card per
 * registered scenario, so the per-scenario cards stay in sync with the
 * registry name and tagline. SVG is used because the build environment has
 * no raster tooling; the tradeoff is recorded in docs/DECISIONS.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { scenarioListings } from "@/data/scenarios";

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  surface: "#0e1117",
  raised: "#161b24",
  line: "#2a3342",
  ink: "#e6ebf2",
  inkMuted: "#9aa6b8",
  inkFaint: "#5e6b80",
  accent: "#5ba8f5",
};

const SANS =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Greedy word wrap to a maximum character count per line. */
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

type CardInput = {
  eyebrow: string;
  title: string;
  tagline: string;
};

function renderCard({ eyebrow, title, tagline }: CardInput): string {
  const padding = 72;
  const titleLines = wrap(title, 24);
  const taglineLines = wrap(tagline, 46);

  const titleSize = titleLines.length > 1 ? 84 : 96;
  const titleLineHeight = titleSize + 14;
  const titleTop = 250;

  const titleSpans = titleLines
    .map((line, i) => {
      const y = titleTop + i * titleLineHeight;
      return `<text x="${padding}" y="${y}" font-family="${SANS}" font-size="${titleSize}" font-weight="700" fill="${COLORS.ink}">${escapeXml(line)}</text>`;
    })
    .join("\n    ");

  const taglineTop = titleTop + titleLines.length * titleLineHeight + 24;
  const taglineSpans = taglineLines
    .map((line, i) => {
      const y = taglineTop + i * 50;
      return `<text x="${padding}" y="${y}" font-family="${SANS}" font-size="36" fill="${COLORS.inkMuted}">${escapeXml(line)}</text>`;
    })
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escapeXml(`${title}. ${tagline}`)}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.surface}"/>
  <rect x="24" y="24" width="${WIDTH - 48}" height="${HEIGHT - 48}" rx="20" fill="${COLORS.raised}" stroke="${COLORS.line}" stroke-width="2"/>
  <rect x="${padding}" y="${padding}" width="56" height="8" rx="4" fill="${COLORS.accent}"/>
  <text x="${padding}" y="${padding + 70}" font-family="${MONO}" font-size="24" letter-spacing="4" fill="${COLORS.accent}">${escapeXml(eyebrow.toUpperCase())}</text>
    ${titleSpans}
    ${taglineSpans}
  <text x="${padding}" y="${HEIGHT - 64}" font-family="${MONO}" font-size="22" fill="${COLORS.inkFaint}">fully deterministic · runs in your browser · no API calls</text>
</svg>
`;
}

const outDir = join(process.cwd(), "public", "og");
mkdirSync(outDir, { recursive: true });

const productCard = renderCard({
  eyebrow: "a software engineering simulator",
  title: "ShipDay",
  tagline: "Shipping safely under pressure, one decision at a time.",
});
writeFileSync(join(outDir, "card.svg"), productCard);
console.log("Wrote public/og/card.svg");

for (const listing of scenarioListings) {
  const card = renderCard({
    eyebrow: `shipday · ${listing.difficulty}`,
    title: listing.name,
    tagline: listing.tagline,
  });
  writeFileSync(join(outDir, `${listing.id}.svg`), card);
  console.log(`Wrote public/og/${listing.id}.svg`);
}

console.log("Social cards generated.");
