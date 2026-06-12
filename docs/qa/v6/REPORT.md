# QA evidence: v6 showpiece pass

A verification session over the v6 showpiece landing. The build milestones added
the showpiece design system, the living dashboard sections, the WebGL hero, the
assembled landing with a scroll narrative, and the framing pages, all verified
during their milestones through code, types, and the build only. This pass
drives the rendered result in a real headless browser against a local
production build and captures the evidence here. No product code was changed in
this pass.

Environment: production build (`npm run build`) served with `npm run start` on
port 3211, driven by headless Chromium 141 through the Playwright build already
present in this environment at `/opt/pw-browsers`. The driver resolved Playwright
from the global install; the repository's dependency files are unchanged. The
server was built and started once, all flows were driven in one pass, and the
server was torn down at the end.

A note on WebGL in this environment: headless Chromium renders WebGL through a
software path, and its `hardwareConcurrency` is low, which the hero's capability
gate would normally treat as a low-power device and fall back to the poster. To
exercise the real 3D path, the capable-device contexts override
`hardwareConcurrency` and `deviceMemory` to typical laptop values. The fallback
and reduced-motion contexts are tested separately and do not override anything.

## Summary

| Check | Verdict | Evidence |
|---|---|---|
| 3D hero canvas mounts | pass | 01-hero-3d |
| Render loop runs while visible (24 frames / 400ms) | pass | (computed) |
| Render loop pauses when tab hidden (0 frames) | pass | (computed) |
| Render loop pauses when hero offscreen (0 frames) | pass | (computed) |
| Hero fallback with WebGL disabled shows the poster | pass | 07-hero-fallback-no-webgl |
| Reduced motion: 3D scene inert, no canvas | pass | 08-reduced-motion |
| Reduced motion: scroll progress not rendered | pass | 08-reduced-motion |
| Reduced motion: revealed content fully visible (opacity 1) | pass | 08-reduced-motion |
| Living sections render and animate | pass | 03-living-sections |
| Scroll narrative at several positions | pass | 02, 04, 05, 06 |
| Mobile width | pass | 09-mobile-hero, 10-mobile-trailer |
| Framing pages | pass | 11-framing-* |
| Keyboard reaches nav and CTA | pass | (computed) |
| Hero headline contrast (16.63 over void) | pass | (computed) |

13 of 13 automated checks passed. No failures, no crashes.

## Hero, 3D running

Pass. The hero mounts a WebGL canvas inside the `ShipDay` region: a drifting
lattice of glowing nodes wired into a faint network over the dark room, with the
headline, subcopy, and CTA crisp over the scrim (01-hero-3d.png). The render
loop ran at 24 frames over 400ms while visible.

## Render loop lifecycle

Pass, by computed frame counts. Counting requestAnimationFrame ticks: while the
hero was visible the loop advanced 24 frames in 400ms; after emulating a hidden
tab (overriding `document.hidden` and dispatching `visibilitychange`) it
advanced 0; after scrolling the hero offscreen it advanced 0. The loop runs only
when the hero is on screen and the tab is shown, as designed.

## Hero fallback

Pass. With WebGL disabled (getContext for webgl returns null), the hero mounts no
canvas and the static poster carries the scene; the headline, subcopy, and CTA
are fully legible and the page reads as intended with the 3D entirely off
(07-hero-fallback-no-webgl.png).

## Reduced motion

Pass, asserted by computed result. With `prefers-reduced-motion: reduce`: the 3D
scene never mounts (no canvas), the scroll-progress line is not rendered at all,
and revealed content is fully visible (the deep `#scenarios-heading` measured
opacity 1). The poster and all content present immediately
(08-reduced-motion.png).

## Living sections

Pass. The trailer renders the sprint board, the deploy pipeline mid-run (Lint
passed, Type check running, the rest queued), the stakeholder message feed with
its pressure messages and typing line, and the metrics panel
(03-living-sections.png). The pipeline and metrics start when scrolled into
view.

## Scroll narrative

Pass. Captured at the top (02), the risk-language section (04), the scenarios
registry (05), and the bottom call to action and footer (06). The reveals bring
each section up on view; the scroll-progress line tracks position.

## Mobile width

Pass. At 390px the hero and the trailer stack to a single column and stay
legible (09-mobile-hero.png, 10-mobile-trailer.png).

## Framing pages

Pass. The scenarios picker, studio, import, and compare pages render in the new
language with the shared header and footer (11-framing-*.png).

## Keyboard and contrast

Pass. Tabbing from load reached the `/scenarios` nav link and the "Start the
workday" CTA. The hero headline ink measured a contrast ratio of 16.63 over the
void base behind the scrim, well above AA.

## Notes for a human pass

A human visual and on-device performance pass is still required: the software
WebGL path in this environment is not representative of real GPU frame rates, so
the hero's smoothness should be confirmed on a mid-range laptop and a phone. The
hero illustration is a placeholder (see `public/hero/README.md`); the final art
drops at the same path with no code change.

## Overall

Every named capture is present, the reduced-motion and no-WebGL fallback paths
are proven by computed result, the render loop pauses offscreen and when hidden,
contrast is AA or better, and the CTA and nav are keyboard reachable. Nothing
required reporting as a blocked check.
