# QA evidence: v5 cinematic pass

A verification session over the v5 cinematic overhaul. The build milestones
added the risk-state treatment, the opening briefing, the workday clock, the
outcome resolution moment, the debrief, the replay scenes, and the rebuilt
landing page, all verified during their milestones through code, the build, and
the existing assertions only. This pass drives the rendered result in a real
headless browser against a local production build and captures the evidence
here. No product code was changed in this pass.

Environment: production build (`npm run build`) served locally with `npm run
start` on port 3210, driven by scripted headless Chromium 141.0.7390.37 through
the Playwright build already present in this environment at
`/opt/pw-browsers`. The repository's dependency files are untouched; the driver
resolved Playwright from the global install rather than adding it to the
project. The server was built and started once, all flows were driven in one
pass, and the server was torn down at the end.

## Summary

| Flow | Verdict | Evidence |
|---|---|---|
| 1. The briefing | pass | 01-briefing, 02-risk-calm |
| 2. Risk states reached through real play | pass | 02-risk-calm, 03-risk-raised, 04-risk-high |
| 3. De-escalation (high back to raised) | pass | 04-risk-high, 05-risk-deescalation |
| 4. Outcome resolution, all five outcomes | pass | 06-resolution-* (five shots) |
| 5. The debrief document | pass | 07-debrief-safe-rollout, 07-debrief-customer-incident |
| 6. Replay as scenes | pass | 08-replay-scene |
| 7. Landing page | pass | 09-landing |
| 8. Mobile width in each risk state | pass | 10-mobile-calm, 11-mobile-raised, 12-mobile-high |
| 9. Reduced motion contract | pass | 13-reduced-motion-start, 14-reduced-motion-debrief |
| 10. Keyboard operability | pass | asserted in driver |
| 11. High-risk contrast (computed) | pass | asserted in driver |

19 of 19 automated checks passed. No failures, no crashes, no anomalies.

## Flow 1: the briefing

Pass. Opening `/simulator/just-add-a-button` fresh, the first step arrives as a
ticket document with the "Incoming ticket" header strip, the 9:00 AM timestamp,
the request as a document body, and the options below
(01-briefing.png). The app shell reports `data-risk="calm"` at the start
(02-risk-calm.png). The workday clock leads the left rail with 9:00 AM and end
of day 5:00 PM always visible.

## Flow 2: risk states reached through real play

Pass. Driving the decision buttons by their labels, risk crossed its real
thresholds and the global treatment switched to match: at risk 45 the shell
read `data-risk="raised"` and the accent warmed (03-risk-raised.png); at risk
65 the shell read `data-risk="high"`, the surfaces darkened with a warm cast,
and the clock tightened (04-risk-high.png). The attribute was read off the live
DOM at each step, so the treatment is driven by simulation state, not by a
scripted class.

## Flow 3: de-escalation

Pass. Continuing the same run, a decision that lowered risk from 65 to 55 moved
the shell from `data-risk="high"` back to `data-risk="raised"`, and the
surfaces eased back up (05-risk-deescalation.png). Falling out of a state is
visible, not only entering one.

## Flow 4: outcome resolution, all five outcomes

Pass. For each of the five outcomes, a full run reached the final decision and
the full-screen resolution moment played with system output matching the actual
outcome, then the verdict. The customer incident run streamed `deploy: rolling
out to production`, `alert: error rate 11 percent and climbing`, `deploy:
rolling back`, then the verdict Customer Impact Incident
(06-resolution-customer-incident.png). The safe rollout run streamed a clean CI
and a completed rollout (06-resolution-safe-rollout.png). The two holds read
differently from the three ships and from each other: responsible delay shows a
deliberate deferral with a rollback plan, overcontrolled shows a change blocked
by its own gates (06-resolution-responsible-delay.png,
06-resolution-overcontrolled.png, 06-resolution-minor-issue.png). The moment is
capped at 2.5 seconds and carries a focused Skip button.

## Flow 5: the debrief document

Pass. After the moment dismissed, the report presented as a debrief document
with the masthead, the final metrics, the timeline, and every action
(download, share, replay, add to comparison, restart) intact
(07-debrief-safe-rollout.png, 07-debrief-customer-incident.png). The debrief
uses the same document language as the opening ticket.

## Flow 6: replay as scenes

Pass. From the completed safe-rollout run, "Replay the day" opened the replay
view staged as scenes, with the ticket, the decision taken, the metric movement
as chips, and the paths not taken (08-replay-scene.png). The scene heading reads
"Scene 1 of 6".

## Flow 7: landing page

Pass. The landing page renders the thesis, the "room responds to risk" triptych
using the real data-risk tokens at calm, raised, and high, the deterministic
no-API note, and the five-scenario registry with difficulty badges
(09-landing.png). The triptych high panel is the actual high-risk treatment, not
a mockup.

## Flow 8: mobile width

Pass. At 390px width the simulator stacks to a single column and stays legible
in every risk state: calm (10-mobile-calm.png), raised (11-mobile-raised.png),
and high (12-mobile-high.png). The metrics rail moves above the decision column
and the clock stays visible.

## Flow 9: the reduced-motion contract

Pass, asserted by behaviour and computed result. In a context with
`prefers-reduced-motion: reduce`:

- The briefing is absent: the decision options are visible immediately on load
  with no staged reveal and no skip needed (13-reduced-motion-start.png).
- The resolution overlay never mounts: driving a full run to completion, the
  `[role="dialog"]` overlay was never present at any step, and the verdict and
  debrief presented immediately (14-reduced-motion-debrief.png).

Both assertions are checked against the live DOM, not claimed.

## Flow 10: keyboard operability

Pass. Tabbing from page load reached the first decision option as a focused
button, and pressing Enter advanced the day to the next step. Focus is visible
through the global focus-visible ring.

## Flow 11: high-risk contrast, computed

Pass. In the high-risk state, a surface card background measured
`rgb(24, 14, 17)` against body ink `rgb(230, 235, 242)`, a contrast ratio of
15.80, well above the AA threshold of 4.5 for normal text. This matches the
darker high-risk surfaces lifting contrast rather than lowering it, as recorded
in docs/DESIGN.md.

## Overall

Every named moment of the cinematic overhaul works when driven in a real
browser: the briefing, the three risk states reached through real play, a
de-escalation, the resolution moment for all five outcomes, the debrief, a
replay scene, the landing page, and the simulator at mobile width in each risk
state. The reduced-motion contract holds by computed result, contrast in the
high-risk state is AA or better, and the day is operable by keyboard. No
findings required reporting; nothing was left unfixed.
