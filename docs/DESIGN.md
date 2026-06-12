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
