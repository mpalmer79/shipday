# QA evidence: mobile-only centered text pass

A verification session for the mobile-only text-centering change. Below the `md`
breakpoint (768px) the display headers across the front door and framing pages
default to centered, applied selectively so the monospace readouts, cards,
tables, and forms stay left-aligned and legible. Desktop is untouched at every
breakpoint.

This pass drives the rendered result in a real headless browser against a local
production build, captures every page at mobile width before and after, and
confirms desktop is byte-for-byte identical.

## Environment

Production build (`npm run build`) served with `npm run start` on port 3311,
driven by headless Chromium through the Playwright build already present in this
environment at `/opt/pw-browsers` (resolved from the global install; the
repository's dependency files are unchanged). Every page was loaded under
emulated reduced motion, which renders the final state immediately (no cold
open, no 3D hero, no stage-in timing), so the before and after shots are
directly comparable and the alignment is what is under test. Mobile viewport
390x844; desktop viewport 1280x900. Full-page screenshots.

## Summary

| Check | Verdict | Evidence |
|---|---|---|
| Landing: eyebrow, h1, short intro line, CTA centered on mobile | pass | after/mobile-landing, after/landing-hero-viewport |
| Landing: long-form hero paragraph left-aligned on mobile | pass | after/landing-hero-viewport |
| Landing: section eyebrows, headings, intros centered on mobile | pass | after/mobile-landing |
| Landing: alert-ladder monospace readouts and clock values stay left | pass | after/landing-alert-ladder-viewport |
| Landing: sprint board, dossier cards, data rows stay left | pass | after/mobile-landing |
| Scenarios: eyebrow, h1, intro centered; dossier cards stay left | pass | before/after mobile-scenarios |
| Compare: h1 and intro centered; run-link form and tables stay left | pass | before/after mobile-compare |
| Import: h1 and intro centered; toolbar and JSON textarea stay left | pass | before/after mobile-import |
| Run: eyebrow, h1, intro centered; run-code form stays left | pass | before/after mobile-run |
| Studio: h1 and intros centered; section labels, fields, forms stay left | pass | before/after mobile-studio |
| Footer: brand, tagline, nav, note centered on mobile | pass | after/mobile-* (all framing pages) |
| Simulator gameplay: untouched at mobile width | pass | before/after mobile-simulator (byte-identical) |
| Desktop: every page byte-for-byte identical before and after | pass | sha256 below |

All checks passed. No defects found.

## Desktop identity (sha256, before vs after)

Every desktop full-page screenshot is byte-for-byte identical before and after
the change, on all seven routes:

```
landing    IDENTICAL
scenarios  IDENTICAL
compare    IDENTICAL
import     IDENTICAL
studio     IDENTICAL
run        IDENTICAL
simulator  IDENTICAL
```

The change is delivered entirely through `text-center md:text-left` (and the
flex equivalents `justify-center md:justify-start`, `items-center
md:items-start`, `self-center md:self-start`), so the `md` and wider rendering
is unchanged by construction; the screenshots confirm it.

## Mobile, by page

### Landing (`/`)

Pass. The classified-briefing eyebrow row, the `ShipDay` headline, the short
intro line ("You are an operative..."), and the primary CTA cluster ("Accept the
assignment" plus its reassurance line) center on mobile. The long second hero
paragraph ("An assignment lands at 9:00 AM...") stays left-aligned as running
prose. Every `SectionFrame` header (eyebrow, title, standfirst) centers. The
alert-ladder cards keep their monospace readouts and `T-5:30` clock values
left-aligned; the sprint board, deploy/message/metrics panels, mission
dossiers, and the operations data rows are all untouched. See
`after/landing-hero-viewport.png` and `after/landing-alert-ladder-viewport.png`
for the two decisive crops.

### Scenarios (`/scenarios`)

Pass. The "Mission select" stamp, the "Choose your operation" headline, and the
standfirst center. The five sealed dossier cards, their case tags, codenames,
threat rows, and call counts stay left.

### Compare (`/compare`)

Pass. The "Compare runs" headline and intro center. The embedded
"Load a run from a link" panel (its label, description, input, and button) and,
in the populated state, the decisions list, the metric-trajectory table, and the
outcome cards stay left. The pre-existing empty-state block was already centered
at all breakpoints and is intentionally left as-is.

### Import (`/import`)

Pass. The "Import a scenario" headline and intro center. The action toolbar and
the JSON textarea (a form field) stay left.

### Run (`/run`)

Pass. The "Shared run" eyebrow, headline, and intro center across the no-code,
error, and loaded states. The run-code form and the error readout stay left.

### Studio (`/studio`)

Pass. The "Authoring studio" headline and both standfirst paragraphs center. The
validation status bar, every section label, and the entire form tree (scenario
fields, step editors, outcome and rule editors) stay left.

### Footer (shared)

Pass. The brand mark, the tagline, the nav links, and the deterministic note
center on mobile and return to left at `md`. Visible on every framing page above.

### Simulator gameplay (`/simulator/...`)

Pass, untouched. The mobile screenshot is byte-for-byte identical before and
after. The mission clock, system signals, decision panels, code snippets,
metric readouts, and dossier-style cards were deliberately excluded.

## Notes for a human pass

The screenshots were taken under emulated reduced motion to make the final state
deterministic. A human should also confirm the centered headers read well with
motion enabled (the cold open, briefing, and 3D hero), and eyeball the 640-768px
window where the footer is in its two-column row layout while text is still
centered (the change keys off `md`, the footer layout off `sm`); it reads as
centered text within each column, which is intended.
