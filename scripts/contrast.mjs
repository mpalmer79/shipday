// One-off contrast audit for the risk-state palette. Not wired into the
// build; run with `node scripts/contrast.mjs` to regenerate the numbers
// recorded in docs/DESIGN.md.

const STATES = {
  calm: {
    surface: [14, 17, 23],
    "surface-raised": [22, 27, 36],
    "surface-overlay": [29, 36, 48],
    "surface-line": [42, 51, 66],
    accent: [91, 168, 245],
  },
  raised: {
    surface: [14, 17, 23],
    "surface-raised": [22, 27, 36],
    "surface-overlay": [29, 36, 48],
    "surface-line": [42, 51, 66],
    accent: [232, 168, 90],
  },
  high: {
    surface: [12, 8, 10],
    "surface-raised": [24, 14, 17],
    "surface-overlay": [33, 19, 24],
    "surface-line": [58, 38, 46],
    accent: [242, 135, 111],
  },
};

const INK = {
  ink: [230, 235, 242],
  "ink-muted": [154, 166, 184],
  "ink-faint": [120, 133, 158],
};

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

for (const [state, palette] of Object.entries(STATES)) {
  console.log(`\n## ${state}`);
  for (const [bgName, bg] of Object.entries(palette)) {
    if (bgName === "accent") continue;
    for (const [fgName, fg] of Object.entries(INK)) {
      console.log(
        `${fgName} on ${bgName}: ${ratio(fg, bg).toFixed(2)}`
      );
    }
    console.log(`accent on ${bgName}: ${ratio(palette.accent, bg).toFixed(2)}`);
  }
  // Dark text on the accent button.
  console.log(
    `surface(text) on accent: ${ratio(palette.surface, palette.accent).toFixed(2)}`
  );
}
