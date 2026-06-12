# ShipDay cinematic layer: the design system

This note records the visual system the v5 run builds on top of the existing
product. The engine, scenarios, routes, and assertions are untouched. What
follows is presentation only: how the product feels as risk rises, and the
rules that keep that feeling honest and accessible.

## The thesis

One workday with a dramatic arc. Tension is never decorative; it exists only
where simulation state justifies it. The interface is a calm operations room
that gets colder and darker as the day goes wrong, and eases back when a
decision pulls it out of trouble.

## Risk states

The simulator already resolves outcomes at two risk thresholds, 40 and 65.
The cinematic layer reads the same two numbers (`lib/simulator/risk.ts`), so
the global treatment can never disagree with the simulation. One data
attribute, `data-risk`, lands on the app shell and the token layer shifts the
whole palette for everything inside.

| State    | Risk    | Treatment                                                        |
| -------- | ------- | --------------------------------------------------------------- |
| `calm`   | < 40    | Base palette. Cool blue accent. Relaxed clock tracking.         |
| `raised` | 40 - 64 | Accent warms toward amber. Clock tightens. Surfaces unchanged.  |
| `high`   | >= 65   | Surfaces darken with a faint warm cast. Accent reads as warning. Clock tightens further. One slow ambient glow. |

De-escalation is a first-class case: when a later decision lowers risk below a
threshold, the attribute changes and the surfaces and accent ease back down
through a 360ms colour transition. Falling out of a state looks like the
reverse of entering it.

## Tokens

All palette tokens are RGB channel triplets in `:root`, overridden under
`[data-risk="raised"]` and `[data-risk="high"]` in `app/globals.css`. Channels
(not hex) so Tailwind's alpha modifiers keep working through the variables.

- Surfaces: `--surface`, `--surface-raised`, `--surface-overlay`, `--surface-line`
- Ink: `--ink`, `--ink-muted`, `--ink-faint` (fixed across states)
- Accent: `--accent`, `--accent-soft`
- Clock: `--clock-tracking`

The semantic colours good, warn, and bad stay fixed hex values. They report
state (a metric went up, an outcome was negative); they do not set the room's
temperature.

## Motion budget

All motion is CSS transitions, CSS keyframes, and React state. No animation
libraries, no new dependencies. Durations and easings live as tokens in
`:root` (`--motion-fast` through `--motion-resolution`, `--ease-standard`,
`--ease-entrance`).

The rule: nothing animates longer than 600ms except the single outcome
resolution moment, which may take up to 2.5s and is always skippable. Nothing
loops except one ambient glow in the high-risk state, well under 1Hz. Nothing
animates on keystrokes. The two pre-existing animations that sat just over the
budget (risk pulse at 700ms, delta fade at 1600ms) were brought to 600ms in
this run so the whole app obeys one rule.

The full per-animation inventory, with reduced-motion behaviour, is maintained
in the pull request body as the motion inventory table.

## The reduced-motion contract

Every animated treatment respects `prefers-reduced-motion`. With it set, a
single global rule in `app/globals.css` collapses all animations and
transitions to their final, fully legible state instantly:

- Staged entrances appear immediately at their resting position.
- The ambient high-risk glow does not run.
- The delta fade and the eased risk transition apply instantly.
- The outcome resolution sequence is gated off in component logic under this
  preference, so it never mounts; the verdict and report present immediately.

Risk-state colour changes still apply under reduced motion. Only their easing
is removed. The information is never withheld; only the movement is.

## Contrast

Computed with `scripts/contrast.mjs` (WCAG relative luminance). Ink is fixed
across states, so only the accent and the darker high-risk surfaces change.
Lowest ratio for normal text on a real text background, per state:

- `calm`: ink-faint on surface-overlay 4.19 (this is the unchanged v4
  baseline, audited in v3).
- `raised`: surfaces unchanged, so ink ratios are identical to calm; the
  warmer accent rises from 7.53 to 9.16 on the base surface.
- `high`: darker surfaces lift every ink pairing. The weakest normal-text
  pairing improves to 4.82 (ink-faint on surface-overlay); accent holds at
  8.03 on the base surface.

Every text pairing meets AA (4.5:1 for normal text, 3:1 for large and UI).
The accent used as button text (dark surface ink on the accent fill) measures
7.53 (calm), 9.16 (raised), and 8.03 (high). The new states never regress text
legibility against the calm baseline; the high-risk state improves it.

## The showpiece layer (v6)

The v6 run builds the public front door: a landing experience in a cinematic
engineering operations-room language. It layers on top of the v5 system without
disturbing the simulator's risk tokens. The mood is a calm, premium control
room at night, lit by screens; the intensity comes from light, type, motion,
and information density, never from any borrowed brand.

### Palette extension

Deeper operations-room tokens, defined in `:root` and consumed through Tailwind:

- `--void` (7 9 13): the near-black base behind the hero and data surfaces.
- `--panel` (17 21 29): the raised panel surface, between the simulator's
  surface and surface-raised.
- `--edge` (56 68 88): a lighter edge so panels catch light at their border.
- `--hot` (245 158 66) and `--hot-soft`: the showcase pressure accent. The
  terminal accent runs cool (the existing blue) in calm states and hot under
  pressure. Hot is distinct from the semantic warn and bad.

The simulator's risk-state palette and the semantic good, warn, and bad are
unchanged.

### Light and depth

Light is the primary effect. Panels use a composed `shadow-panel` token: a top
edge highlight, a grounded drop shadow, and a faint tonal glow, so a panel
reads as lit by a screen in a dim room. A hot variant (`shadow-panel-hot`)
carries the pressure colour. Standalone accent glows (`shadow-glow`,
`shadow-glow-hot`, `shadow-glow-sm`) light CTAs and small elements. A faint
engineering grid (`bg-grid-faint`) textures panel interiors.

### Type

A fluid headline scale for the showpiece: `text-display` (clamp 2.5rem to
4.5rem) and `text-display-sm`. Headlines use the existing strong sans (Inter)
at display sizes with tight tracking; monospace (JetBrains Mono) carries system
output and data; the body face carries prose. No new font is loaded.

### Primitives

The landing composes from pure presentational primitives in
`components/showcase/`: `GlowPanel`, `SectionFrame`, `DataRow`,
`PipelineStage`, `MessageCard`, and `MetricBar`. None hold logic or call the
engine; they render content the caller supplies.

### Motion

All 2D motion is CSS and React, transform and opacity only, none longer than
600ms. Showpiece keyframes (`sweep`, `barGrow`, `blink`) are short and gated
under reduced motion by the global contract. The one permitted showpiece loop
is the cursor blink, which like the high-risk glow is ambient and stops under
reduced motion. The WebGL hero (its own milestone) runs only when visible and
permitted, with a static poster fallback.

### Contrast (new tokens)

Computed with WCAG relative luminance. Ink is fixed across the palette.

- On `--void`: ink 16.63, ink-muted 8.08, ink-faint 5.36, accent 7.94, hot 9.35.
- On `--panel`: ink 15.26, ink-muted 7.42, ink-faint 4.92, accent 7.28, hot 8.58.

Every text pairing meets AA (4.5 for normal text, 3.0 for large and UI); the
weakest is ink-faint on panel at 4.92.
