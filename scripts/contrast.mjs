// Theme guardrail for the dark-slate palette. This is the durable enforcement
// of two non-negotiable constraints:
//
//   1. No pure white anywhere. The script fails if `255 255 255`, `#fff`,
//      `#ffffff`, `rgb(255, 255, 255)`/`rgba(255,255,255,...)`, or a Tailwind
//      `*-white` utility reappears in source, or if any channel of an
//      alert/highlight token is 255.
//   2. Contrast holds. The primary text/background token pairs are computed
//      from globals.css (single source of truth) with the WCAG relative
//      luminance formula and asserted against their targets: body text ≥ 7:1,
//      secondary ≥ 4.5:1, non-text (borders, icons, accent) ≥ 3:1.
//
// Run with `node scripts/contrast.mjs`. Wired into the build/lint pipeline
// (npm run check:theme, and the CI workflow) so future edits can't regress it.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, extname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GLOBALS = join(ROOT, "app", "globals.css");

// --- WCAG relative luminance --------------------------------------------------

function lin(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function lum([r, g, b]) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(a, b) {
  const la = lum(a);
  const lb = lum(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

// --- Parse the token blocks from globals.css (single source of truth) --------

const css = readFileSync(GLOBALS, "utf8");

function parseBlock(selector) {
  const re = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n  \\}`);
  const m = css.match(re);
  if (!m) return {};
  const tokens = {};
  const tokenRe = /--([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g;
  let t;
  while ((t = tokenRe.exec(m[1]))) {
    tokens[t[1]] = [Number(t[2]), Number(t[3]), Number(t[4])];
  }
  return tokens;
}

const root = parseBlock(":root");
const highOverrides = parseBlock('\\[data-risk="high"\\]');
const high = { ...root, ...highOverrides };

const failures = [];

// --- Constraint 1a: no 255 channel in alert/highlight tokens -----------------

for (const [name, rgb] of Object.entries(root)) {
  if (/^(alert|highlight)/.test(name) && rgb.includes(255)) {
    failures.push(
      `token --${name}: ${rgb.join(" ")} contains a 255 channel (pure-max forbidden)`
    );
  }
}

// --- Constraint 1b: scan source for pure-white literals ----------------------

const SELF = join(ROOT, "scripts", "contrast.mjs");
const SCAN_DIRS = [join(ROOT, "app"), join(ROOT, "components"), join(ROOT, "lib")];
const SCAN_FILES = [join(ROOT, "tailwind.config.ts")];
const SCAN_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".mjs"]);

const FORBIDDEN = [
  { label: "pure-white triple `255 255 255`", re: /255\s+255\s+255/ },
  { label: "hex `#fff`/`#ffffff`", re: /#fff(?:fff)?\b/i },
  {
    label: "`rgb(255,255,255)`/`rgba(255,255,255,...)`",
    re: /rgba?\(\s*255\s*,\s*255\s*,\s*255/i,
  },
  {
    label: "Tailwind `*-white` utility",
    re: /\b(?:bg|text|border|ring|ring-offset|fill|stroke|from|via|to|decoration|outline|divide|placeholder|shadow|accent|caret)-white\b/,
  },
];

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (SCAN_EXT.has(extname(full))) out.push(full);
  }
}

const files = [...SCAN_FILES];
for (const d of SCAN_DIRS) walk(d, files);

for (const file of files) {
  if (file === SELF) continue; // this script names the patterns it forbids
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    for (const { label, re } of FORBIDDEN) {
      if (re.test(line)) {
        failures.push(`${relative(ROOT, file)}:${i + 1} forbidden ${label}: ${line.trim()}`);
      }
    }
  });
}

// --- Constraint 2: contrast of the primary text/background pairs -------------

// The five most-used text/background pairs plus the escalated-state body check.
const CHECKS = [
  { fg: "ink", bg: "surface", min: 7, kind: "body", palette: root },
  { fg: "ink", bg: "panel", min: 7, kind: "body (cards)", palette: root },
  { fg: "ink-muted", bg: "surface", min: 4.5, kind: "secondary", palette: root },
  { fg: "ink-faint", bg: "surface", min: 3, kind: "non-text", palette: root },
  { fg: "accent", bg: "surface", min: 3, kind: "non-text (accent)", palette: root },
  { fg: "ink", bg: "surface", min: 7, kind: "body (red alert)", palette: high },
];

console.log("## dark-slate contrast (computed from globals.css)\n");
for (const { fg, bg, min, kind, palette } of CHECKS) {
  const fgRgb = palette[fg];
  const bgRgb = palette[bg];
  if (!fgRgb || !bgRgb) {
    failures.push(`missing token for contrast check: --${fg} on --${bg}`);
    continue;
  }
  const r = ratio(fgRgb, bgRgb);
  const ok = r >= min;
  console.log(
    `${ok ? "ok " : "FAIL"}  ${fg} on ${bg} (${kind}): ${r.toFixed(2)}:1 (min ${min}:1)`
  );
  if (!ok) {
    failures.push(`contrast ${fg} on ${bg} (${kind}): ${r.toFixed(2)}:1 < ${min}:1`);
  }
}

// --- Report ------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`\n✖ theme guardrail failed (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("\n✓ theme guardrail passed: no pure white, all contrast targets met.");
