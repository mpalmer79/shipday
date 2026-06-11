# Decision log: v2 autonomous build

Audit trail for assumptions, deviations, dependency changes, and assertion
changes made during the v2 run. One entry per decision, tagged with the
milestone it belongs to.

## Milestone 1

### M1: Registry metadata lives outside the Scenario type

The milestone requires a registry with id, name, tagline, difficulty label,
and estimated step count, but also requires that engine and types stay
untouched except where the registry requires it. Difficulty is presentation
metadata, not simulator behavior, so it is defined in
`data/scenarios/index.ts` as a registry-level field rather than added to the
`Scenario` type. Step count is derived from `scenario.steps.length` instead
of being stored, so it cannot drift from the data.

### M1: "Estimated step count" interpreted as exact step count

All current scenarios have a fixed linear spine, so the step count is exact,
not estimated. The registry exposes it as `stepCount` and derives it from
the data. If a future scenario branches into paths of different lengths,
this field is the natural place to widen into a range.

### M1: Redirect implemented with the framework redirect helper

`/simulator` redirects to scenario 1 using `redirect()` from
`next/navigation` in a server page. This was verified against the build
output to confirm the route still prerenders statically and the app stays
deployable with no server requirements.

### M1: Reducer resolves the scenario from state

The simulator reducer looks up the scenario by `state.scenarioId` through
the registry instead of closing over a scenario prop. This keeps the reducer
a module-level pure function (stable across renders) and works for any
number of scenarios without changing the engine.

## Milestone 2

### M2: Flag vocabulary moved to a shared module

Scenario 2 reuses most of scenario 1's flags. Duplicating the constants in
each scenario file would let the vocabularies drift, so the constants moved
to `data/scenarios/flags.ts` and scenario 1 now imports them instead of
defining its own copy. The values are byte-identical, so scenario 1 behavior
is unchanged. The Milestone 1 rule about leaving scenario 1 untouched
applied to Milestone 1; this change belongs to Milestone 2, which requires
the shared vocabulary.

### M2: Two new flags, reproduced-failure and bisected-history

The Broken Build is about diagnosis discipline. Reproducing a failure
before acting and bisecting history before assigning blame are behaviors no
existing flag expresses (investigated-test covers studying a test, not
proving a failure or locating a regression). Both are defined in the shared
constants. Other candidate behaviors (blaming without evidence, quarantining
a test) are expressed through the existing skipped-validation flag plus
metric impacts, so no further flags were added.

### M2: Outcome titles are shared across scenarios

Both scenarios use the same five outcome titles (Safe Rollout, Minor
Production Issue, Customer Impact Incident, Responsible Delay,
Overcontrolled Delivery) with scenario-specific summaries. The outcome
types are the product's shared vocabulary; keeping the titles stable makes
results comparable across scenarios.

### M2: Scenario 2 safe-rollout thresholds differ from scenario 1

Scenario 1 requires risk at most 40 and testConfidence at least 60 for a
safe rollout. Scenario 2 uses risk at most 45 and testConfidence at least
45. The day starts materially worse (risk 30, testConfidence 40, main
already red), so reaching scenario 1's absolute thresholds would make Safe
Rollout nearly unreachable. The thresholds were tuned until the exhaustive
distribution satisfied the acceptance bounds (no outcome above 45 percent
or below 2 percent). Rule thresholds are scenario data by design, so this
is tuning, not an engine change.

### M2: Distribution bounds asserted for every scenario

The acceptance bounds for Milestone 2 are encoded as assertions in the
verify script and applied to all registered scenarios, not only scenario 2.
Scenario 1 already satisfied them (max 40.2 percent, min 2.9 percent), so
this adds a guard without changing any existing behavior, and future
scenarios get the same tuning gate for free.

## Milestone 3

### M3: One new flag, prepared-rollback

Friday Deploy is partly about rollback readiness, and no existing flag
expresses "wrote the revert procedure before deploying." The behavior
matters to the incident rule (shipping unvalidated without a rollback plan
is what turns a bad value into a Saturday incident), so it earns a flag.
Blast-radius mapping reuses inspected-existing-code and scoping reuses
metric impacts, so one flag covers the milestone.

### M3: Scenario 3 spans 2:00 PM to 4:30 PM, not 9:00 AM to 4:00 PM

Milestone 3 inherits scenario 2's structural requirements, which include a
9:00 AM to 4:00 PM span, but the stated premise starts at 2:00 PM on a
Friday. The premise wins: structural requirements are read as six steps
with four to five options each, and the times run 2:00 PM to 4:30 PM in
half-hour beats. Outcomes land at 4:50 PM (the window closes at 5:00 PM),
which also keeps the report's fixed 5:00 PM beat coherent.

### M3: Distribution regression implemented as exact pinned counts

The milestone requires confirming scenarios 1 and 2 did not shift. The
verify script now pins the exact outcome counts for tuned scenarios and
fails on any deviation, which is the strictest possible regression and
costs nothing extra to run. Scenario 3 is pinned as well after its tuning
settled, so milestones 4 through 6 cannot silently move any distribution.
A deliberate retune must update the pinned counts and this log together.

## Milestone 4

### M4: Replay view state is component state, not simulator state

The milestone forbids storing new state for replay. The simulator state is
untouched: replay is reconstructed on demand by a pure function
(`reconstructRun`) from the scenario plus the recorded decision trail, and
every intermediate metric snapshot is recomputed through the engine itself,
so replay cannot disagree with the original run. The only additions are
two pieces of view state in the client component (report-or-replay toggle,
current frame index), which is presentation state in the same category as
the timeline's expand toggle.

### M4: Replay reconstruction validates the trail it is given

`reconstructRun` throws if a decision record's step id does not match the
step the engine expects, or if the recorded option id does not exist in
that step. Records always come from the engine today, so this cannot fire
in the app; it exists so that any future source of decision trails (an
imported run, a shared link) fails loudly instead of replaying garbage.

### M4: Replay UI verified by rendering, not by hand

The acceptance requires the replay UI to work for all five outcome types.
Beyond the engine assertions (replay reproduces exact final metrics and
outcome for every enumerated path in all three scenarios), the view was
server-rendered with real reconstructed frames for one run per outcome per
scenario (15 renders) and checked for its key sections. The smoke script
was a one-off check, not committed, since it duplicates what the verify
assertions and the build already guard.

## Milestone 5

### M5: Download format is plain markdown

The milestone allows standalone HTML or plain markdown. Markdown was
chosen: the report is entirely textual, markdown opens cleanly in any
editor or viewer with zero styling code to write or maintain, it is
greppable and diffable, and it cannot drag in the escaping and inline-CSS
surface a hand-built HTML document would. The generator is a pure function
in `lib/simulator/exportReport.ts` with the run date passed in as an
argument, so it stays deterministic and testable; the browser-only code is
limited to the Blob download in the client component.

### M5: Date of run is the download timestamp

The simulator does not track wall-clock time (runs are deterministic and
restartable), so there is no stored "run completed at" moment. The date
written into the file is the moment the user downloads the report, which
is accurate to within the length of a session and avoids adding clock
state to the engine for a metadata line.

### M5: Metric labels moved from a component to the library

The exporter needs the human-readable metric names, which lived in the
MetricsDashboard component. Importing UI components from `lib` would
invert the dependency direction, so the labels and display order moved to
`lib/simulator/metrics.ts` and the three components that used local copies
now import them. Pure relocation; no values changed.

## Milestone 6

### M6: Copy rules enforced by assertions, not just by the sweep

The em dash and banned word rules are now verified mechanically: the
verify script serializes every registered scenario and asserts the strings
contain no em dash and none of the banned words, and asserts every
exported report is em dash free. A one-time sweep proves the repository is
clean today; the assertions keep it clean. The detector itself references
the em dash via a unicode escape so no source file contains the literal
character, and the banned word list in the verify script is detector code,
not copy, so the words appear there in plain form.

### M6: RiskMeter label "Elevated" renamed to "Raised"

The banned word list includes "elevate". The middle risk band was labeled
"Elevated", which is ordinary risk terminology rather than marketing
language, but the most conservative reading of the rule covers stems, so
the label is now "Raised". The word "elevator" in scenario 3 (a phone in
an elevator) is an unrelated word and stays.

### M6: Pre-existing copy edits limited to em dash removal plus two fixes

The sweep touched scenario 1 and the report module only where em dashes
were replaced with periods, commas, colons, or parentheses, preserving
meaning sentence by sentence. Two substantive fixes rode along: the shared
missed-signal copy for deleted-failing-test referenced scenario 1's
double-discounting incident while the flag is now also used by scenario 2,
so it was generalized; and the landing page paragraph still pitched only
scenario 1, so it now describes all three workdays, replay, and the
downloadable report. Distribution pins confirm no behavioral change.

### M6: "Fresh static export check" read as build output verification

The project does not use the static export config option; it is a default
build in which every route prerenders statically, which is what Vercel
deploys without servers, environment variables, or API keys. The closeout
check therefore verifies the build route table (every route marked static
or SSG), and smoke tests the served pages, rather than switching the
project to a different output mode for the check.

# Decision log: v3 autonomous build

Audit trail for the v3 run (launch pass plus the v3 feature set). One entry
per decision, tagged with the milestone it belongs to. Milestone numbers
restart at 1 for this run.

## Milestone 1

### M1: Social cards are committed SVG, not build-generated PNG

The acceptance criterion is that the card assets "exist in the repository,"
so the cards are committed image files rather than images produced at build
time. The build environment has no raster tooling (rsvg-convert, ImageMagick,
inkscape are all absent), and next/og only resolves inside the Next build
pipeline, so producing a committed PNG was not possible without a new
dependency. SVG keeps the cards committed, deterministic, dependency free,
and fully static. The tradeoff: some social scrapers prefer raster formats
for og:image, so a future run with raster tooling could rasterize the same
SVG source to PNG. The tags are emitted on every route and the assets are in
the repository, which is what the milestone asks for.

### M1: Cards are generated from the registry by a dev script

`scripts/generate-og-cards.ts` (run with `npm run cards`) writes one product
card plus one card per registered scenario into `public/og`, reading the
scenario name, tagline, and difficulty from the registry. This keeps the
per-scenario cards in sync with the registry instead of being hand-copied
strings that can drift. The script uses only Node built-ins and the existing
tsx dev dependency, so it adds no runtime dependency and the generated SVGs
are the committed artifacts.

### M1: Favicon is an SVG icon via the file convention

`app/icon.svg` uses the framework metadata file convention, which Next wires
into the rendered `<link rel="icon">` automatically. A single scalable SVG
covers the favicon role for modern browsers. A rasterized apple-icon.png was
not added because the environment has no raster tooling and the convention
does not accept SVG for apple-icon; the SVG icon is the committed asset and
the conservative choice given the constraint.

### M1: metadataBase reads optional platform variables with a fallback

Absolute Open Graph URLs need a base. `lib/site.ts` reads NEXT_PUBLIC_SITE_URL
or the Vercel-injected VERCEL_URL when present and falls back to localhost
otherwise. No environment variable has to be set for the app to build or
deploy; the variables are read only if the platform provides them. This keeps
the "no required environment variables" rule while still emitting correct
absolute URLs on a real deploy.

### M1: The redirect route carries no metadata

`/simulator` is a server-side redirect to scenario 1 and renders no HTML of
its own, so it emits no metadata tags. Every route that renders HTML (the
landing page, the scenario picker, and each scenario) emits the full Open
Graph and Twitter tag set, which is what the acceptance covers.

## Milestone 2

### M2: Mobile and accessibility audit

Each route was audited at narrow viewport widths and for keyboard,
semantics, and contrast. Findings, fixes, and what passed unchanged:

Landing page (`/`):
- Narrow viewport: single centered column, already fluid. Passed unchanged.
- Keyboard: the "Start the workday" call to action is a link, focusable and
  operable. A visible focus ring was added globally (see below).
- Semantics: one h1 ("ShipDay"), `header` and `main` landmarks from the app
  shell. Passed unchanged.
- Contrast: body copy uses ink and ink-muted, both well above AA. Passed
  unchanged.

Scenario picker (`/scenarios`):
- Narrow viewport: the card grid is one column below the small breakpoint,
  two columns above. Passed unchanged.
- Keyboard: each scenario card is a link, focusable and operable, now with a
  visible focus ring.
- Semantics: one h1 ("Pick a workday"), each card title is an h2. The
  difficulty pill is decorative text inside the link. Passed unchanged.
- Contrast: difficulty pills use good, warn, and bad text on the dark
  surface, all above AA.

Simulator (`/simulator/[scenarioId]`):
- Narrow viewport: the three-column grid collapsed to one column, but the
  metrics column (which holds the risk meter) rendered after the main column,
  so the risk meter sat below the decision panel. Fixed: on mobile the
  metrics column is ordered first so the risk meter is visible without
  scrolling past the decision panel; the desktop three-column order is
  unchanged. The narrow-screen order is now risk and metrics, then the
  scenario and decisions, then the workday timeline.
- h1: the page had no h1 (the step title is an h2). Fixed: a screen-reader
  only h1 carrying the scenario name was added, so the page has exactly one
  h1 without changing the visual design.
- Decision options: were buttons inside a div. Fixed: they are now a labeled
  list (a section with an h3 label and a `ul` of `li` buttons), so the option
  set is announced as a list with its heading.
- Metrics: wrapped in a labeled region ("Current metrics") so the risk meter
  and metric cards are a recognizable landmark.
- Keyboard: decision options, the replay Previous and Next controls, the
  "Run the day again", "Replay the day", and "Download report" buttons are
  all native buttons, focusable and operable, now with a visible focus ring.
- Buttons are buttons, lists are lists: the workday status, timeline, system
  signals, report timeline, strong decisions, missed signals, replay paths
  not taken, and decision options are all real lists; the interactive
  controls are all native buttons with text labels (accessible names).
- Images: the app renders no inline images. The committed social cards and
  the favicon carry alt text and aria-labels (Milestone 1). Passed unchanged.

Global fix:
- A `:focus-visible` rule in `app/globals.css` gives every interactive
  element a consistent accent focus ring with an offset, replacing the
  inconsistent browser defaults.

### M2: Contrast met AA without token changes

The milestone scopes token adjustment to the risk meter bands and metric
deltas. Measured against the surface-raised card background (#161b24), the
band and delta colors are good 9.91:1, warn 10.34:1, and bad 6.24:1, all
above the AA threshold of 4.5:1 for normal text, so no token was changed. A
noted item outside this scope: ink-faint (#5e6b80) is 3.20:1 on surface-
raised, below AA for normal text. It is used only for secondary and
decorative labels (timestamps, faint captions), never for the bands or
deltas the milestone covers. Changing it would ripple across the whole UI
and is outside the conservative scope of this milestone, so it is left as a
known item rather than altered here.

## Milestone 3

### M3: Missed-signal copy moved into scenario data with a shared fallback

A `missedSignals` map (flag to text) was added to the Scenario type. The
report now reads the scenario's own copy for a flag and falls back to the
shared flag-keyed copy in `lib/simulator/report.ts` only when the scenario
does not author its own. All three scenarios author specific text for the
warning-sign flags they can set (scenario 1: skipped validation, unreviewed
AI, deleted test, shipped direct, blocked release; scenario 2: skipped
validation, deleted test, shipped direct, blocked release; scenario 3:
skipped validation, shipped direct, blocked release). The shared copy stays
as the fallback for any flag a scenario does not cover and for future or
imported scenarios. This is report-only copy and does not touch outcome
logic, so no distribution moved.

### M3: Strong decisions are curated by a per-option marker

A `strong` boolean was added to DecisionOption and carried into the
DecisionRecord by the engine. The report treats a scenario as curated if any
option sets the marker, and then surfaces only the marked decisions; a
scenario with no markers falls back to the previous heuristic (net risk
reduction without quality or test loss). All three scenarios are now curated.
The marker is set on the deliberate senior moves: options that buy
information (reading the code, reproducing a failure, asking a precise
question), reversibility (feature flags, staged or canary rollout, a written
rollback plan, scoping to one tenant), or shared ownership of a tradeoff
(stating the risk, offering a dated alternative). Options that are merely not
harmful are left unmarked. This replaces the mechanical heuristic that, in
scenario 3, marked an entire careful run as strong. Strong decisions do not
affect outcomes, so no distribution moved; verify asserts that curated
scenarios surface exactly their marked decisions across every enumerated run.

### M3: Difficulty is a designed incident curve, pins updated

The incident (Customer Impact Incident) rate is now designed to rise with
difficulty across the registry order, which is the difficulty order. Target
curve: a low starter floor, a moderate intermediate rate, and the highest
rate on the advanced Friday scenario, reflecting that a Friday evening global
config change with no reviewers and an on-call handoff is the most likely of
the three to reach production unverified and unattended. Verify now asserts
the incident share is non-decreasing across the registry and prints the
curve.

Before this milestone the incident rates were 2.95%, 7.52%, 2.59%, which was
not a curve: the intermediate scenario was the highest and the advanced
scenario was the lowest. After tuning the rates are 2.95%, 6.55%, 9.06%.

Scenario 1 (Just Add a Button) was already at the intended floor and was left
unchanged, so its pins did not move. The two retuned scenarios changed only
their incident outcome rule thresholds (scenario data, the intended tuning
mechanism), which shifts the boundary between Customer Impact Incident and
the Minor Production Issue fallback:

The Broken Build incident rule: the global risk threshold was raised from 70
to 77, lowering the incident rate from 7.52% to 6.55%. Pins before and after:

- safe-rollout: 951 to 951 (unchanged)
- minor-issue: 2697 to 2755
- customer-incident: 481 to 419
- responsible-delay: 1545 to 1545 (unchanged)
- overcontrolled: 726 to 730

Friday Deploy incident rule: the global risk threshold was lowered from 70 to
60, and the flag combination clause was broadened from (shipped direct and
skipped validation and no rollback plan, risk at least 55) to (shipped direct
and no rollback plan, risk at least 34), raising the incident rate from 2.59%
to 9.06%. Pins before and after:

- safe-rollout: 962 to 934
- minor-issue: 1662 to 1458
- customer-incident: 106 to 371
- responsible-delay: 1020 to 1005
- overcontrolled: 346 to 328

All five outcomes remain reachable in every scenario within the 2 to 45
percent bounds after tuning (the highest single share is The Broken Build's
Minor Production Issue at 43.0 percent).
