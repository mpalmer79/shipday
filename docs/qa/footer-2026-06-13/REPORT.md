# QA evidence: site footer rebuild

A verification pass over the rebuilt `components/layout/Footer.tsx`, captured
against a local production build. The footer was rebuilt from the approved
design as a real React component in the repo's Tailwind token system (no inline
styles copied, no HTML embedded).

## Environment

Production build (`npm run build`) served with `npm run start` on port 3210,
driven by the Playwright Chromium build present in the environment at
`/opt/pw-browsers` (Chromium 141), through the globally installed
`playwright@1.56.1`. Footer captures are element-scoped screenshots of the
`<footer>` at a 2x device scale factor; the sticky site header was hidden during
capture only (it does not shift the footer layout) so it could not bleed into
the tall mobile capture.

## Screenshots

Footer at three widths on two framing pages, plus the landing page, to confirm
it mounts site-wide:

| File | Page | Width | Layout |
| :--- | :--- | :---- | :----- |
| `01-scenarios-desktop.png` | `/scenarios` | 1280 | four columns, left-aligned |
| `02-scenarios-tablet.png` | `/scenarios` | 768 | two columns, left-aligned |
| `03-scenarios-mobile.png` | `/scenarios` | 390 | one column, centered |
| `04-import-desktop.png` | `/import` | 1280 | four columns, left-aligned |
| `05-import-tablet.png` | `/import` | 768 | two columns, left-aligned |
| `06-import-mobile.png` | `/import` | 390 | one column, centered |
| `07-landing-desktop.png` | `/` | 1280 | four columns, left-aligned |
| `08-landing-mobile.png` | `/` | 390 | one column, centered |

## Link targets (read from the rendered DOM)

Every footer anchor and its resolved destination, confirmed clickable with no
dead links:

| Label | Destination | Opens new tab |
| :--- | :--- | :--- |
| Get Started | `/scenarios` (internal route) | no |
| Documentation | `https://github.com/mpalmer79/shipday#readme` | yes |
| Roadmap | `https://github.com/mpalmer79/shipday#roadmap` | yes |
| Changelog | `https://github.com/mpalmer79/shipday/commits/main` | yes |
| Contributing | `https://github.com/mpalmer79/shipday/blob/main/README.md` | yes |
| Report an Issue | `https://github.com/mpalmer79/shipday/issues` | yes |
| LinkedIn (icon) | `https://www.linkedin.com/in/mpalmer1234` | yes |
| GitHub (icon) | `https://github.com/mpalmer79/shipday` | yes |

Every external anchor carries `target="_blank"` and `rel="noopener noreferrer"`,
and an accessible name that announces it opens in a new tab. The `#roadmap`
anchor matches the `## Roadmap` heading in `README.md`.

A human should click the LinkedIn link once to confirm it resolves to the right
profile; the handle was used exactly as provided.

## Checks

- Copyright year renders dynamically and shows the current year (2026 in every
  capture), evaluated server-side so the component stays static-export safe.
- Heading reads "Simulator Features", never "Game Features".
- No dead links; every Quick Link and social link resolves to a real
  destination.
- Mobile (one column) is centered; tablet and desktop align left, matching the
  site's established mobile-centering convention.
- Desktop visual matches the preview: brand column with the `>_` glyph and the
  Ship/Day split, tagline, the monospace `< realistic > < engineering >
  < simulator >` lines, an About column, a Simulator Features column with six
  inline-SVG icons, a Quick Links column, and a bottom bar with the monospace
  signature, copyright, social links, and the closing quote.
- All colors map to design tokens (void, surface-line, edge, ink, ink-muted,
  ink-faint, accent, the monospace font), not hardcoded hex.

## Contrast (AA)

Measured against the footer's `void` background (rgb 7 9 13), WCAG relative
luminance:

| Pairing | Ratio | AA (normal text, 4.5:1) |
| :--- | :--- | :--- |
| ink on void | 16.63:1 | pass |
| ink-muted on void | 8.08:1 | pass |
| ink-faint on void | 5.36:1 | pass |
| accent on void | 7.94:1 | pass |

Every text pairing in the footer clears the AA threshold for normal text.

## Build and verify

`npm run verify` and `npm run build` both pass. Every route prerenders as static
or statically generated content.
