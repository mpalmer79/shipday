# ShipDay multimedia assets

This directory holds the local image assets the UI references. The app wires
every path through `lib/shipdayMedia.ts`; until a file is placed here the UI
renders a styled sci-fi **fallback placeholder** in its slot, so nothing breaks
while art is pending.

All assets are **local only**. Do not reference remote URLs and do not commit
remotely-fetched images.

## Recommended specs

- Raster art: `.webp`, 16:9 unless noted, dark sci-fi engineering-agency
  aesthetic, cool accent light with warm/red accents under pressure.
- Keep file sizes lean (target < 200 KB each) — these are decorative layers.

## TODO — art still to be produced and placed here

### Home
- [ ] `hero-command-center.webp` — mission control room, holographic dashboards, mission clock.
- [ ] `judgment-under-fire.webp` — bugs, chores, features, failing pipelines, ambiguous requests.
- [ ] `operation-board-blueprint.webp` — operation board rendered as a blueprint.
- [ ] `ci-pipeline-chat.webp` — CI pipeline (build/deploy/smoke/prod) beside a team channel.
- [ ] `alert-ladder-risk-gauge.webp` — risk gauge climbing green → amber → red.
- [ ] `mission-dossier-overview.webp` — a spread of classified operation dossiers.

### Mission art
- [ ] `mission-just-add-button.webp` — UI panel missing a critical button with caution tape.
- [ ] `mission-broken-build.webp` — failing CI pipeline with broken red segments and sparks.
- [ ] `mission-missing-requirement.webp` — spec document with a missing/damaged section.
- [ ] `mission-friday-deploy.webp` — nighttime deploy window, glowing launch from a city rooftop.
- [ ] `mission-black-signal.webp` — urgent production page, glitch effects, alarm lighting.

### Import
- [ ] `import-data-ingestion.webp` — data being ingested into the import panel.
- [ ] `json-structure-visual.webp` — JSON structure / schema visual.

### Studio
- [ ] `studio-authoring-console.webp` — the authoring console.
- [ ] `studio-metric-gauges.webp` — the six metric gauges.
- [ ] `studio-step-timeline.webp` — a vertical step timeline.

### Compare
- [ ] `compare-runs-split-screen.webp` — two runs side by side.
- [ ] `compare-empty-state.webp` — a calm "standing by" empty state.
- [ ] `run-link-connection.webp` — two runs linked by a connection.

### Footer / nav
- [ ] `shipday-agency-badge.webp` — the agency badge (footer falls back to an inline emblem).

> The nav/footer link icons (`icon-missions.svg`, `icon-studio.svg`,
> `icon-import.svg`, `icon-compare.svg`, `icon-linkedin.svg`, `icon-github.svg`)
> are rendered **inline** in the components for robustness, so these `.svg`
> files are optional. They are catalogued in `lib/shipdayMedia.ts` for
> reference only.
