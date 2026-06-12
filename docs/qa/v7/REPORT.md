# QA evidence: v7 maximum-spectacle cinematic pass

A verification session over the v7 spy-thriller experience layer. Milestones 1
through 5 built the cinematic design system, the cold open and mission select,
the briefing and mission clock, the alert states and resolution climax, and the
WebGL command center, all verified during their milestones through code, types,
and the build only. This pass drives the rendered result in a real headless
browser against a local production build, runs the assertions, and captures the
evidence here.

One defect was found and fixed during this pass: the cold open never rendered
(it was always mounted and self-gated, so its sequence was born finished and
never reopened). The fix mounts the sequence only once it is cleared to play,
mirroring how the briefing and resolution are mounted by their parents. It is
recorded in `docs/DECISIONS.md` (v7, Milestone 6) and the affected checks were
re-run green. No other product code changed in this pass.

Environment: production build (`npm run build`) served with `npm run start` on
port 3211, driven by headless Chromium through the Playwright build already
present in this environment at `/opt/pw-browsers`. The driver resolved
Playwright from the global install; the repository's dependency files are
unchanged. The server was built and started once, every flow was driven in one
isolated pass, and the server was torn down at the end.

A note on WebGL in this environment, unchanged from v5 and v6: headless Chromium
renders WebGL through a software path and reports a low core count, which the
hero's capability gate would treat as a low-power device and fall back to the
poster. To exercise the real 3D path the capable-device context overrides
`hardwareConcurrency` and `deviceMemory` to typical laptop values; the fallback
and reduced-motion contexts override nothing, so they test the true gated
behaviour. This means the frame rate seen here is software, not a real GPU, and
a human on-device pass is still required.

## Summary

| Set piece / assertion | Verdict | Evidence |
|---|---|---|
| Cold open plays mid-sequence | pass | 01-cold-open-mid |
| Cold open skips to the briefing | pass | 02-cold-open-skipped |
| Mission select wall of dossiers | pass | 03-mission-select |
| Mission briefing sequence | pass | 04-briefing |
| Mission clock, calm state | pass | 05-clock-calm |
| Tactical (mid) alert state | pass | 06-alert-mid |
| Full red-alert takeover | pass | 07-alert-red |
| Mission clock, escalated state | pass | 07-alert-red |
| Red-alert contrast AA (every text-on-bg pairing) | pass | contrast-red-alert.txt |
| Alert stands down as risk recedes | pass | 08-alert-standdown |
| Resolution climax: accomplished (safe-rollout) | pass | 09-resolution-accomplished |
| Resolution climax: contained (minor-issue) | pass | 10-resolution-contained |
| Resolution climax: compromised (customer-incident) | pass | 11-resolution-compromised |
| Resolution climax: held (responsible-delay) | pass | 12-resolution-held |
| Resolution climax: stalled (overcontrolled) | pass | 13-resolution-stalled |
| Debrief after-action file | pass | 14-debrief |
| 3D command-center hero mounts | pass | 15-hero-3d |
| Render loop runs while visible (frame count) | pass | (computed) |
| Render loop pauses when tab hidden (0 frames) | pass | (computed) |
| Render loop pauses when hero offscreen (0 frames) | pass | (computed) |
| Hero fallback with WebGL disabled | pass | 16-hero-fallback |
| Mobile width, landing | pass | 17-mobile-landing |
| Mobile width, mission select | pass | 18-mobile-missions |
| Reduced motion: cold open inert, final state | pass | 19-reduced-landing |
| Reduced motion: 3D scene inert, poster final state | pass | 19-reduced-landing |
| Reduced motion: animations neutralized (computed) | pass | (computed) |
| Reduced motion: briefing inert, workday final state | pass | 20-reduced-simulator |
| Reduced motion: resolution inert, debrief final state | pass | 21-reduced-resolution |
| Keyboard: cold-open skip focused and operable | pass | (computed) |
| Keyboard: primary CTA reachable, visible focus | pass | (computed) |
| Keyboard: briefing skip focused and operable | pass | (computed) |
| Every route returns 200 | pass | (computed) |
| Legacy /simulator redirect works | pass | (computed) |

33 of 33 checks passed. One defect found and fixed (the cold open), then
re-verified.

## Cold open

Pass. On the first visit of a session the landing boots the agency interface:
the boot lines stream, a secure channel opens, the classified briefing
assembles, and the product is revealed as the assignment (01-cold-open-mid.png).
The single focused "Skip intro" control dismisses the overlay and lands on the
briefing with the primary CTA in reach (02-cold-open-skipped.png). The overlay
is mounted only after hydration over the already-rendered landing, so first
paint and the no-JavaScript view are unaffected.

The defect: before the fix the cold open never appeared. The component was
always mounted and gated itself with an internal "pending -> play" state, which
fed a reduced-motion flag into the sequence hook on the first render; the hook
was therefore born finished, and flipping to play re-armed its timers but never
cleared the finished flag, so the overlay returned nothing forever. The fix
mounts the inner sequence only once the cold open is cleared to play, so it
always starts with motion allowed and runs its stages. The run-once-per-session
and reduced-motion gating stay in the parent. After the fix the overlay plays,
is skippable, and dismisses on its own; under reduced motion and on a return
visit it never mounts.

## Mission select

Pass. `/scenarios` is the wall of sealed case files, two up, one per registry
scenario (03-mission-select.png). Each dossier shows its codename, the real
scenario name, the derived threat level, the call count, and a link into the
mission. Five dossiers render, matching the registry.

## Mission briefing

Pass. Entering a scenario plays the full-screen briefing: the case file opens,
the operation codename and directive are read into the record, and the threat
and starting readout appear before the mission clock is armed (04-briefing.png).
Skippable with one focused control. Under reduced motion it is never mounted
(see 20-reduced-simulator).

## Mission clock

Pass in both states. Calm: the clock reads Condition green with the T-minus
countdown to end of day, the current time, and the day's beats
(05-clock-calm.png). Escalated: under the red-alert high state the clock reads
Condition red, the accent and tracking shift through the risk tokens, and in the
final hour or under red alert the countdown breathes (07-alert-red.png). The
clock is wired to the real step progression, so it tracks the day exactly.

## Alert states

Pass across the ladder, reached through real play of the expert scenario. A
risk-raising decision crosses the raised threshold and the tactical amber strip
takes over the top of the interface ("risk elevated, holding tactical"),
data-alert=mid (06-alert-mid.png). Two more raise risk past the high threshold
and the full red-alert banner with the sweeping alarm rail takes over, the
room tinting through the red-alert vignette, data-alert=high (07-alert-red.png).
A later lower-risk decision recedes below the high threshold and the takeover
stands down on its own to the tactical amber strip, data-alert=mid
(08-alert-standdown.png). The alert renders straight off live risk, so it can
never disagree with the simulation.

### Red-alert contrast (measured, WCAG relative luminance)

Measured in the live red-alert (high) state by computed style: every visible
text element's colour was paired with its nearest opaque background and the
contrast ratio computed. 16 unique pairings were found; the full table is in
`contrast-red-alert.txt`. Every pairing clears AA (4.5:1 for normal text, 3.0:1
for large/UI text). Highlights:

- Body text (light ink on the darkened high surface): 14.97:1 to 16.62:1.
- The red-alert banner ("Red alert, risk critical, stand down when clear"),
  light ink on the solid alert banner: 7.81:1.
- The clock's "Condition red" and the red risk readout, alert red on the dark
  surface: 6.84:1.
- The escalated countdown ("T-1:30") and current time, hot accent on the dark
  surface: 7.63:1.
- The weakest pairing in the state, muted ink on the raised card surface:
  4.82:1, still above the 4.5:1 AA floor for normal text.

The red-alert takeover never recolours body text or surfaces, so the strongest
ink contrast holds through the most intense state. No pairing fell below AA, so
no contrast fix was required.

## Resolution climax

Pass for all five outcomes, each reached by a real path through the expert
scenario. The system output streams in matching the actual result, then the
verdict card lands themed by the outcome tone with its original genre line:

- Accomplished, safe rollout: "Mission accomplished" (09-resolution-accomplished.png).
- Contained, minor issue: "Objective met, fallout contained" (10-resolution-contained.png).
- Compromised, customer incident: "Mission compromised" (11-resolution-compromised.png).
- Held, responsible delay: "Mission held, by the book" (12-resolution-held.png).
- Stalled, overcontrolled: "Mission stalled out" (13-resolution-stalled.png).

Skippable with the focused "Skip to debrief" control. Under reduced motion the
sequence is never mounted and the verdict and report show at once (see
21-reduced-resolution).

## Debrief

Pass. After the resolution the classified after-action file renders: the
after-action stamp header, the mission-debrief framing, the metric summary, and
the mission log, with all report actions intact (14-debrief.png).

## 3D command-center hero

Pass. With a capable device the hero mounts the WebGL command-center scene over
the poster: the converging floor grid, the drifting tactical node network, and
the glowing core, with the headline crisp over the scrim (15-hero-3d.png).

### Render-loop lifecycle (frame counting)

Pass, by counting requestAnimationFrame ticks wrapped before the scene loads.
While the hero was visible the loop advanced 17 to 19 frames in 400ms; after
emulating a hidden tab it advanced 0; after scrolling the hero offscreen it
advanced 0. The loop demonstrably runs only when the hero is on screen and the
tab is visible.

## Hero fallback

Pass. With WebGL disabled (the canvas context forced to null) the scene does not
mount and the inline SVG poster stands alone as the hero, with no canvas and the
headline and CTA legible (16-hero-fallback.png). This is the LCP base on every
load; the scene only ever composites over it.

## Mobile width

Pass. At 390px the landing and the mission-select wall reflow to a single
column with no horizontal overflow and stay legible (17-mobile-landing.png,
18-mobile-missions.png).

## Reduced motion

Pass across every set piece, proven by computed result. On the landing under
emulated reduced motion: the cold open overlay is never present, the 3D scene
never mounts (no canvas; the SVG poster shows the scene's final state), the CTA
and content are present and legible, and an element carrying the stage-in
animation has its duration neutralized to under 1ms by the global contract
(19-reduced-landing.png). In the simulator: the briefing overlay is never
present and the workday and clock are there immediately (20-reduced-simulator.png).
Driving a scenario to completion: the streaming resolution dialog never appears
and the outcome and full after-action report render at once
(21-reduced-resolution.png). Every sequence and the clock animation, the alert
pulses, and the 3D scene are inert and present their final state.

## Keyboard

Pass. The cold-open skip control auto-focuses on play and Enter dismisses the
overlay. The primary CTA ("Accept the assignment") is focusable and carries a
visible focus-visible ring (2px solid outline). The briefing skip control
auto-focuses and Enter continues into the workday. Every skip control and the
CTA into the simulator are reachable and operable by keyboard with visible
focus.

## Routes

Pass. Every route returned 200: `/`, `/scenarios`, the five `/simulator/...`
scenario routes, `/studio`, `/import`, `/compare`, and `/run`. The legacy
`/simulator` redirect resolves to `/simulator/just-add-a-button` (the default
scenario), so the redirect still works.

## Notes for a human pass

A human visual and on-device performance pass is still required. The software
WebGL path in this environment is not representative of real GPU frame rates, so
the command-center hero's smoothness should be confirmed on a mid-range laptop
and a phone. Whether the spectacle actually lands as a spy-thriller, rather than
just reading as themed chrome, is a judgement that needs a human eye on the full
cold-open-to-debrief arc at real timing. The hero poster is an inline SVG; if a
final raster illustration is wanted later, the swap path is documented (see the
README and `public/hero/README.md`).

## Overall

Every named set piece is captured, the reduced-motion and no-WebGL fallback
paths are proven by computed result, the render loop pauses offscreen and when
hidden, AA is confirmed in the red-alert state with the ratios reported, and the
skips and the CTA are keyboard reachable with visible focus. One defect (the
cold open never rendering) was found, fixed within the original rules, and
re-verified. No check was blocked.
