# QA evidence: v4 browser pass

A verification session over the merged v4 work. The studio, the run page,
and the comparison link loading shipped with their interactive flows covered
only by exported function tests; this pass drove those flows in a real
headless browser against a local production build and captured the evidence
in this directory. No product code was changed.

Environment: production build served locally, driven by scripted headless
Chrome 148 (Chrome for Testing 148.0.7778.96). The default browser download
host is not in this environment's network allowlist, so the matching Chrome
build was fetched from an allowlisted mirror and the automation pointed at
that executable; the repository's dependency files are untouched. Clipboard
write succeeds in this browser configuration, so the fallback path was
additionally exercised by forcing the write to fail (flow 5b).

## Summary

| Flow | Verdict | Evidence |
|---|---|---|
| 1. Studio authoring through the forms | pass | flow-01a, flow-01 |
| 2. Studio round trip | pass | flow-02a, flow-02 |
| 3. Built-in load | pass | flow-03 |
| 4. Distribution preview | pass | flow-04, flow-04b |
| 5. Run link, happy path | pass | flow-05a, flow-05 |
| 5b. Clipboard fallback (forced) | pass | flow-05b |
| 6. Run link, hostile path | pass | flow-06 (three shots) |
| 7. Comparison via link | anomaly | flow-07 |
| 8. Conditional consequence in UI | pass | flow-08, flow-08b |
| 9. Social cards | pass | card-*.png |
| 10. Friction list audit | done | flow-10a, flow-10b |

One anomaly, no failures, no crashes. The anomaly is cosmetic (a lost
confirmation message on the compare page); details under flow 7.

## Flow 1: studio authoring through the forms

Pass. Starting from the empty draft, a minimal valid scenario (two steps,
two options each, one flag, five outcomes, one rule per outcome plus the
fallback) took **60 click and type interactions** end to end, where a fill
of one field counts as one interaction. Mid-draft, with option ids still
empty, the message `steps[0].options[0].id must be a non-empty string`
rendered inside the steps section next to the offending structures and not
on the scenario header (flow-01a-validation-routing.png). When the last
rule was wired, the status bar flipped to "Valid scenario" with no error
text left anywhere on the page (flow-01-studio-authoring.png).

Interaction budget, roughly: scenario fields 3, steps scaffolding and copy
14, options 24 (ids, labels, descriptions, routing, one flag, two impacts),
outcomes 10, rules 12. The options block dominates, which matters for the
friction audit below.

## Flow 2: studio round trip

Pass. "Export draft to JSON" produced the draft in the JSON box
(flow-02a-studio-export.png); pasted into `/import`, it validated with no
errors and played to the end-of-day report
(flow-02-import-round-trip.png). The careful path (the flag-setting option,
then wrap up) landed Safe Rollout, which is exactly what the draft's
hasFlag rule prescribes, so the authored rule demonstrably drives the
outcome. The report also shows the one-line note that a non-registry
scenario cannot be shared by link.

## Flow 3: built-in load

Pass. One click on "Load it" filled the entire form set with
just-add-a-button (scenario id field reads `just-add-a-button`). Changing
one option label kept the status at "Valid scenario", and the re-export
contains the edited label (flow-03-builtin-load-edit.png).

## Flow 4: distribution preview

Pass. With just-add-a-button loaded, "Run preview" reported "Exhaustive:
all 5,120 runs walked." and the table shows Safe Rollout 998, Minor
Production Issue 2,058, Customer Impact Incident 151, Responsible Delay
1,263, Overcontrolled Delivery 650, which matches the pinned verify
distribution exactly (flow-04b-distribution-panel.png is the readable
crop; flow-04-distribution-preview.png is the full page). Every row
renders the advisory "within 2 to 45%" guidance plus the footnote that the
band is guidance, not a validation rule. Responsiveness: a main-thread
JavaScript probe dispatched immediately after clicking the button answered
in 6ms while the walk ran, consistent with the walk living in a worker.

## Flow 5: run link, happy path

Pass. A full careful run of scenario 1 played through the decision buttons
landed Safe Rollout with final metrics quality 100, speed 25, risk 0,
trust 80, focus 70, test confidence 65. "Copy link to this run" succeeded
against the real clipboard in this browser (no fallback needed), and the
copied URL opened in a fresh page rebuilt the report with the same outcome
and identical final metrics (flow-05-run-link-rebuilt.png).

## Flow 5b: clipboard fallback, forced

Pass. Because the natural path did not exercise the fallback, the clipboard
write was forced to reject in a separate page. The report then showed the
one-line explanation ("The browser blocked the clipboard. Copy the link
from here:") and a read-only input carrying the same URL the unforced path
produced (flow-05b-clipboard-fallback.png).

## Flow 6: run link, hostile path

Pass. `/run` bare shows the explainer and a paste form; a truncated code
(two decisions of six) shows "The decision trail ends before the day does"
with the step it stopped at; a garbage string shows `Unrecognized run code
version "garbage"`. All three render inside the page chrome with the retry
form below; no crash, no blank page, no application error overlay
(flow-06-run-bare.png, flow-06-run-truncated.png, flow-06-run-garbage.png).

## Flow 7: comparison via link

Anomaly (functional pass, cosmetic finding). The shared link from flow 5
loaded into the comparison page next to a locally played reckless run; the
diff header reads "6 of 6 decisions differ.", every decision row renders
both choices with the differing rows highlighted, the trajectory table
renders all six metrics across all steps with the A minus B column, and
the outcome panels read Customer Impact Incident against Safe Rollout
(flow-07-comparison-via-link.png).

Finding: the loader's confirmation line ("It is now available in the run
pickers.") never appears when the loaded run is what transitions the page
from its empty state to the comparison view, because the empty state and
the populated view each mount their own loader instance and the message
state is lost with the unmounted one. The comparison appearing is the only
feedback, which is acceptable but unintended. Reproduction: save exactly
one local run of a scenario, open `/compare` (empty state), paste a valid
link for the same scenario, press "Load run". Expected per the copy: a
confirmation line. Actual: the view switches with no message. When a link
is loaded from the already-populated view, the message shows as written.

## Flow 8: conditional consequence visible in UI

Pass. Two runs of scenario 1 sharing the 11:00 AM "Accept it as-is"
decision but differing at 9:00 AM: after "Read the existing checkout code
first", the consequence paragraph reads the override ("You read the
pricing module this morning and flagged the promo mutation as touchy...");
after "Start coding immediately", it reads the base text ("You just merged
code you can't fully explain..."). Same step, same option, different
earlier flag, different text on screen (flow-08-consequence-override.png,
flow-08b-consequence-base.png).

## Flow 9: social cards

Pass. The product card, the per-scenario card for the-missing-requirement,
and the `/run` card all return HTTP 200 with PNG signatures at exactly
1200x630 (card-product.png, card-the-missing-requirement.png,
card-run.png). The per-scenario card carries the scenario name, tagline,
and difficulty.

## Flow 10: friction list audit

The v4 decision log's dogfooding friction list, graded against real form
usage from flow 1:

**"No duplicate button is the single largest time sink." Confirmed.** Of
the 60 interactions for a deliberately minimal scenario, about 24 went
into four options that are structurally near-identical, and that is with
descriptions one sentence long and most impacts left blank. Scaling to a
real scenario (seven steps, four options each, full impacts, consequences,
lessons) puts option scaffolding in the several-hundred-interaction range,
all of it copy-paste-shaped work the form cannot express. Largest sink,
clearly.

**"A three-level condition tree is roughly twenty interactions."
Confirmed at the size it described, measured at 10 for a smaller tree.**
Building allOf(hasFlag, anyOf(metricAtLeast)) with three leaves took 10
interactions (flow-10a-condition-tree.png), about three per leaf plus
overhead. The claim's figure was for the six-leaf incident rule, which
extrapolates to 18 to 22 interactions at the measured rate, so the
estimate holds for the rule it cited and slightly overstates small trees.

**"Two missed-signal entries with the same momentary flag key collapse."
Confirmed, reproduced on the first attempt.** Two consecutive clicks of
"Add missed signal" yield one entry, not two; the second blank entry
silently merges into the first because both key on the empty string
(flow-10b-missed-signal-collapse.png). The documented workaround (type the
first flag before adding the second entry) works.

## Overall

Every v4 surface that shipped without browser coverage works as designed
when actually driven: the studio's forms, validation routing, JSON round
trip, built-in loading, and worker-backed preview; the run link's share,
rebuild, fallback, and error paths; the comparison link loader; and the
conditional consequence rendering. The one finding is a lost confirmation
message on the compare page's empty-to-populated transition, recorded
above with reproduction steps and left unfixed per the session's
report-only rule.
