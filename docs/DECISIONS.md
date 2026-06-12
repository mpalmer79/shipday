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

## Milestone 4

### M4: Scenario 4 (The Page) is the first branching scenario

The engine already routes on `option.nextStepId`, so the steps were always a
graph rather than a forced spine; no engine change was needed to branch. The
Page has seven step definitions and a genuine branch at triage: two options
(read the dashboards, reproduce the failure) route to a diagnose-first step,
and two options (roll back on suspicion, flip the kill switch) route to an
act-first step. The two paths reconverge at the root-cause step and share the
fix and wrap-up steps. Every run is six decisions long. The branch follows
from the triage choice, as the premise requires. One new flag, mitigated-
impact, captures containing user impact before chasing the root cause, which
no existing flag expressed (used-feature-flag is about releasing a feature
behind a flag, staged-release is a canary). The scenario carries a stack
trace as a codeSnippet and the page and post-mitigation state as
systemSignals.

### M4: A fourth difficulty tier, expert

The Page is a live production incident and is the hardest scenario, so a
fourth difficulty tier, expert, was added rather than labeling two scenarios
advanced. The picker shows it with an accent-colored pill. The registry order
remains the difficulty order, which the incident curve assertion depends on.

### M4: The Page sits at the top of the incident curve

The designed curve from Milestone 3 (incident rate rises with difficulty)
extends to four scenarios: 2.95%, 6.55%, 9.06%, 12.60%. The Page was tuned to
the highest incident rate, which fits a live incident where acting blindly or
shipping a guess most easily makes things worse. All five outcomes are
reachable within the 2 to 45 percent bounds (safe-rollout 32.9%, minor-issue
28.4%, customer-incident 12.6%, responsible-delay 18.4%, overcontrolled
7.8%). The Page's distribution is pinned. The existing three distributions
are unchanged from where Milestone 3 left them.

### M4: Exhaustive playtest walks branches with memoized path counting

A memoized `countPaths` was added to the verify script. It computes the
number of distinct runs from each step and memoizes by step id, which is
correct because path count is purely structural (it does not depend on
metrics or flags) and so stays linear even where paths reconverge. It throws
on a cycle, which would make the count unbounded. The brute-force walk still
visits every run, because outcomes depend on accumulated metrics and flags
and so cannot be memoized; the memoized count cross-checks the walk (the two
must agree), and the per-scenario path count is reported. The full registry
walk (20,736 runs across four scenarios) is timed and asserted under ten
seconds; it runs in well under one second.

### M4: Replay and timeline keys are composite

The decision lists in the report, the timeline, and the workday status keyed
React elements by step id, which assumed one decision per step id within a
run. The keys are now composite (step id plus the decision index), so a
branching run that revisits a time or, in a future cyclic scenario, a step,
cannot collide. Replay reconstruction already keys frames by index.

### M4: Workday status is path-based for branching scenarios

The workday status panel previewed every step of the day, which assumed a
single upcoming spine. A branching scenario has no single spine to preview
(The Page has two steps at 3:00 PM on mutually exclusive paths), so for a
branching scenario the panel now shows the path taken plus the current step
rather than a false linear preview. Linear scenarios keep the full preview
unchanged. Branching is detected as any step whose options lead to more than
one distinct next step.

## Milestone 5

### M5: The schema is a hand-written validator, not a schema library

The scenario "schema" is expressed as a validator in `lib/simulator/validate.ts`
rather than a JSON Schema document plus a runtime library. This adds no
runtime dependency (a hard rule of the run), keeps the schema and the
TypeScript types in one language, and lets each check return a specific,
readable message (the milestone's actual requirement) rather than a generic
schema-path error. The validator treats every field as untrusted: it checks
the type of each value before reading it, and it collects all errors in one
pass instead of failing on the first.

### M5: Validator checks correctness and safety, not authoring guidelines

The validator enforces what the engine needs to run safely: known metric
keys, real step and option ids, next steps that exist, conditions that are
well formed, rules and the fallback that reference defined outcomes, and
flags in rules that some option actually sets. It does not enforce the
authoring guideline that built-in steps carry four or five options; an
imported step needs at least one option to be a step. The four-to-five rule
is a content standard for the built-in scenarios, checked separately in the
playtest, not a property of a valid scenario.

### M5: SimulatorClient takes a scenario object, not an id

To play a scenario that is not in the registry (one imported at runtime),
the simulator can no longer resolve its scenario by id through the registry.
SimulatorClient now takes the Scenario object directly, and its reducer is a
pure factory bound to that scenario. This is a deliberate change to the v2
design (a module-level reducer that looked the scenario up by id). The
factory is still a pure, module-level function; the only difference is that
the scenario is closed over rather than fetched, which is what lets an
imported scenario play through the exact same component and engine as a
built-in. The route page now passes the resolved scenario object.

### M5: Imported scenarios live in memory only

The import page holds the parsed scenario in component state and passes it to
the simulator. Nothing is written to localStorage, IndexedDB, cookies, or
any network endpoint, so the app stays static and stores nothing. Reloading
the page clears the imported scenario, which is the intended scope ("imported
scenarios live in memory only").

### M5: Structural lint and its conservative never-fire check

`lib/simulator/lint.ts` reports three structural problems usable against any
scenario: steps unreachable from the initial step (breadth-first over the
next-step graph), dead flags (read by a rule but set by no option), and
outcome rules whose condition can never be true. The never-fire check is a
conservative static analysis: it reports a rule only when the condition is
provably unsatisfiable (a metric threshold outside the clamped range, a
required flag no option sets, or a single allOf that both requires and
forbids the same flag). It will not flag every dead rule (full reachability
across priorities is path dependent), but it never reports a false positive.
The lint runs over every built-in scenario in verify and all four are clean.

### M5: Verify asserts validator rejections and a valid play-through

Verify includes a phase that round-trips a built-in scenario through the
validator and plays it to a known outcome, then feeds eleven distinct
malformed inputs (eleven, where the milestone asks for at least eight) and
asserts each is rejected with the specific expected message. The cases cover
a non-object, a missing required array, unknown metric keys (in initial
metrics and in an option impact), a dangling next step, a bad initial step, a
duplicate step id, an undefined flag in a rule, a malformed condition kind,
an invalid tone, and a rule whose outcome is not defined.

### M5: Header navigation added for discoverability

The header gained a nav landmark with links to the scenario picker and the
importer, so the new route is reachable without typing the URL. The links
inherit the global focus styles from Milestone 2.

## Milestone 6

### M6: Comparison is derived, holding only completed runs

`compareRuns` in `lib/simulator/comparison.ts` is a pure function that
reconstructs both runs through the existing reconstructRun and diffs them: the
decision at each step index, the metric trajectory (the start plus the metrics
after each step), the final metrics and outcomes, the count of differing
decisions, and the per-metric final delta. It stores nothing. The only new
state is `lib/runStore.ts`, an in-memory session store of completed runs that
holds just the scenario and the decision trail (everything else is
reconstructed). It uses useSyncExternalStore, writes to no storage API, and
clears on a full reload, which is the scope the milestone allows.

### M6: Runs are saved explicitly, not on every completion

The end-of-day report has an "Add to comparison" button rather than auto-
saving every finished run. Auto-saving would fill the store with near-
duplicate runs from replaying and restarting. An explicit save keeps the
comparison list intentional, and the button shows an added state plus a link
to the comparison page once a run is saved.

### M6: Comparison aligns branching runs by step index

Two runs of a branching scenario can take different paths. The comparison
aligns them by step index and marks a step as the same choice only when both
the step id and the option id match, so a divergence at a branch shows as
different steps and different choices from that index on. Where one run is
longer than the other, the missing side is shown as absent rather than
forcing a false alignment.

### M6: Comparison assertions

Verify asserts that comparing a run against itself yields zero decision
differences and zero metric differences, for all four scenarios including the
branching one. It then compares two known runs of scenario 1 (a careful line
and a reckless line that differ on all six decisions) and asserts the decision
difference count is exactly six and that every final metric delta equals the
two runs' independently computed final metrics. A third check compares two
runs of the branching scenario that diverge at triage and asserts they differ,
that the triage step is marked different, and that the step after triage is a
different step id on each path.

### M6: Compare route and navigation

A `/compare` page (statically rendered, hydrated client side) lets the user
pick a scenario that has at least two saved runs and choose run A and run B.
It shows the step-by-step decision diff, a metric trajectory table (run A over
run B per step, with the final A minus B delta), and the two final outcomes.
The header gained a Compare link.

## Milestone 7

### M7: Copy-rule assertions extended to importer-facing strings

The em dash and banned-word assertions already ran over every registered
scenario, so scenario 4 was covered the moment it joined the registry. This
milestone added the importer-facing strings: the validator's error messages
(checked for every malformed-input case) and the sample scenario offered on
the import page. The sample scenario was moved out of the client component
into `lib/sampleScenario.ts` so the verify script can hold it to the same
copy rules, validate it, lint it clean, and play it to a known outcome,
exactly as for a built-in scenario. A shared `assertCleanCopy` helper backs
all of these checks.

### M7: Repository-wide sweep

A repository-wide sweep found no em dashes in any source file and no banned
words in any UI copy, scenario data, the sample scenario, or the README. The
banned words appear only in the verify detector list (detector code, not
copy) and in this decision log where the rule itself is discussed, which is
the same convention the v2 log established. Every user-facing string added in
this run was read end to end; the register matches the existing scenarios
(flat, specific, no drama for its own sake).

### M7: README and roadmap

The README was rewritten for the v3 state: four scenarios with the designed
difficulty curve, the branching scenario, JSON import with validation and
lint, run comparison, launch metadata, a routes table, an updated
architecture section, and an updated project structure. The roadmap marks the
v3 items this run completed (launch metadata, mobile and accessibility,
branching, JSON import, comparison). One previously listed item, conditional
consequence text keyed off prior flags, was not in this run's scope and is
left unchecked rather than claimed.

### M7: Final verification

verify and build both pass. The build route table shows every route as static
or statically generated, with no server, environment variable, database, or
API key requirement. All routes were smoke tested: the landing page, scenario
picker, importer, comparison page, all four scenarios, the favicon, and a
social card return 200, and the legacy `/simulator` path returns its 307
redirect.

# Decision log: v4 autonomous build

Audit trail for the v4 run (the authoring update). One entry per decision,
tagged with the milestone it belongs to. Milestone numbers restart at 1 for
this run.

## Milestone 1

### M1: Overrides resolve against the full pre-decision state

The milestone fixes the evaluation point as "before the decision's own flags
apply." The Condition type also supports metric thresholds, so the override
condition is evaluated against the entire pre-decision state (metrics and
flags as they stood when the step was presented), using the same
evaluateCondition the outcome rules use. This is the only reading in which a
condition means the same thing in an override as in a rule, and it keeps the
resolution independent of the option's own impacts.

### M1: Replay reads the engine's record, not the option

The DecisionRecord stores the resolved text, and the report, the timeline,
and comparison already render from records, so they needed no changes.
Replay's frames previously copied the static option consequence; they now
carry the record written by the engine during reconstruction. Reconstruction
replays the same decisions from the same initial state, so the engine
re-resolves to the same text deterministically; verify asserts the replayed
consequence equals the original record for every decision of every
enumerated run in all four scenarios.

### M1: One override in The Page fixes a latent copy mismatch

The base consequence for move-on-to-feature ("the rollback still
unexplained") was written for the rollback triage path, but the step is also
reachable through the kill switch, where no rollback happened. The new
override on mitigated-impact gives the kill-switch path its own text, which
is the conditional-consequence mechanism doing exactly the job it was built
for. The base text stays for the rollback path.

### M1: Retrofit shape, three overrides per scenario

Each scenario carries at least three overrides (scenario 1 and 2 carry
four), placed on later-step options and keyed to flags set in earlier steps,
so the override text can reference the earlier behavior specifically.
Scenario 1's full-release and scenario 2's say-green carry two ordered
overrides each to exercise first-match-wins; verify asserts the ordering
with a constructed run where both conditions hold. Consequence text is
display only, so no distribution pin moved; the unchanged pins are asserted
by the existing verify phase.

## Milestone 2

### M2: Run code format is version, scenario id, then option ids

A run encodes as `v1.<scenarioId>.<optionId>.<optionId>...`, dot-joined.
The version token leads so the format can evolve; everything after it is
the scenario id and the decision trail in order. Per-step option indices
were considered and rejected: an index code is shorter, but reordering a
step's options in a data edit would silently remap every decision in old
links, while option ids fail loudly through the same engine validation
every run goes through. Built-in ids use lowercase words and hyphens, so
the dot separator is unambiguous and the code needs no URL escaping beyond
the standard query encoding. Decoding treats the code as untrusted: parse
errors, an unknown version, a missing scenario, an unknown option, a
truncated trail, and a trail that runs past the end of the day each return
a specific message instead of throwing.

### M2: Decoding splits into a pure layer and a registry layer

`lib/simulator/runCode.ts` knows the format and the engine but no scenario
data, so verify can round-trip codes per scenario through it. The registry
lookup lives in `lib/runLink.ts`, which is the reason imported scenarios
cannot travel by link (the code carries only the scenario id); the report
of an unshareable run says so in one line. The run page reads the query
parameter in a client component behind a Suspense boundary, which keeps the
route fully static; reconstruction happens in the browser through the
existing pure replay.

### M2: Comparison loads links into the session run store

The comparison page's "load a run from a link" flow decodes the pasted
link, replays it, and adds it to the existing in-memory run store, where it
becomes selectable as run A or run B alongside locally played runs. This
reuses the store and pickers instead of adding a parallel two-slot input,
and it means a loaded run can be compared against any number of local runs.
The loader accepts a full link or a bare code; loaded runs clear on reload
like every other saved run.

### M2: Clipboard failures fall back to a visible URL

"Copy link to this run" uses the clipboard API, which can be blocked.
On failure the report shows the URL in a read-only input with a one-line
explanation, so the share flow cannot dead-end. The link is built at click
time from `window.location.origin`, which keeps the component free of any
configured site URL and correct on any deploy.

# Decision log: launch fix session

Three tasks on top of the merged v3: raster social cards, the ink-faint
contrast item, and a tuning review of The Page. Milestone numbers are task
numbers for this session.

## Task 1

### T1: Social cards moved to build-time PNG via the file convention

The committed SVG cards did not render on the major link scrapers, which do
not accept SVG for og:image. The cards are now PNGs produced at build time by
the opengraph-image and twitter-image file conventions with ImageResponse,
which ships inside Next, so no dependency was added. A root pair renders the
product card and a pair under the scenario route renders per-scenario cards
from the registry (name, tagline, difficulty), so the copy cannot drift from
the data. All image routes prerender statically (the per-scenario ones export
generateStaticParams), and every page route remains static or SSG. The
committed SVGs under public/og, the generator script, and the npm cards
script entry were deleted; one shared renderer in lib/ogCard.tsx replaces
them. The favicon (app/icon.svg) is unchanged: browsers accept SVG favicons,
and the scraper limitation applies only to og:image.

### T1: Per-segment re-export image files instead of one root card

Config-based metadata in a child segment replaces the parent's openGraph
object wholesale rather than merging, so the root convention image did not
reach /scenarios, /import, or /compare, which define their own openGraph
text fields. Each of those segments now has a two-line opengraph-image and
twitter-image file re-exporting the root card, which keeps a single renderer
while guaranteeing every HTML-rendering route emits og:image and
twitter:image. Verified in the prerendered HTML for every route.

### T1: Card style compromises under ImageResponse

The renderer restates the app palette as hex and reproduces the SVG card
layout: outer surface, raised panel with the line border, accent bar, accent
eyebrow, large title, muted tagline, faint footer. Two compromises, matching
intent rather than pixels as the task allows: the embedded default font is a
single sans weight, so the eyebrow and footer are not monospaced and the
title's hierarchy comes from size (92px against 36px) rather than weight;
embedding JetBrains Mono or a bold face would need a committed font binary
or a network fetch at render time, both out of scope. Letter spacing keeps
the eyebrow's set-apart look.

## Task 2

### T2: ink-faint raised from #5e6b80 to #78859e

The v3 audit left ink-faint below AA as a known item. The token moves from
#5e6b80 to #78859e. Measured ratios (WCAG relative luminance), before to
after:

- against surface (#0e1117): 3.50 to 5.08
- against surface-raised (#161b24): 3.20 to 4.64
- against the accent/5 panel blend over surface (#121922): 3.28 to 4.75

All backgrounds the token sits on now measure at or above the 4.5:1 AA
threshold for normal text. ink-faint text never sits on surface-overlay
(overlay hosts only ink and ink-muted text, the workday status dot, and the
two meter bar tracks), so overlay was not a constraint. ink-muted stays at
#9aa6b8 (7.01 on raised): the gap between 4.64 and 7.01 keeps faint visibly
subordinate to muted, so ink-muted did not need to move. The social card
renderer restates the palette as hex and was updated to the same value. No
layout or markup changed.

Pages checked after the change, each rendering ink-faint where listed:

- Landing (/): the footer line under the call to action, on surface.
- Scenario picker (/scenarios): the decision-count label on each card, on
  raised.
- Simulator (all four scenarios): workday status times and pending labels,
  timeline header and timestamps, the "What do you do?" heading, system
  signals header, code review card header and filename, on raised.
- End-of-day report: metric labels, timeline timestamps, section headings,
  on raised.
- Replay view: section headings and the descriptions under "Paths not
  taken", on raised.
- Import (/import): the textarea placeholder, on raised.
- Compare (/compare): trajectory table head, step time and title lines
  (including on the accent-tinted differing rows), and the table footnote,
  on surface and the accent/5 blend.
- Header: the tagline next to the wordmark, on surface.

The built stylesheet contains only the new value (rgb 120 133 158); the old
value appears nowhere in the build output.

## Task 3

### T3: The Page Safe Rollout retuned from 32.9% to 20.2%

The trace confirmed a tuning artifact, not a design choice. Two causes:

First, the reconverging branch structure funnels every run through the-fix,
where two of the five options (canary, flag-and-ramp) grant the safe-rollout
gate flag; 81 percent of safe runs satisfied the gate at that one step, so
the gate barely depended on how the incident itself was handled. Second, the
risk threshold of 38 did not bind: the scenario is dense with risk-reducing
options, and the mean final risk among safe runs was 14.8, far under the
threshold. Together these let runs containing keep-coding (18 percent of
safe runs), rollback-on-suspicion (17 percent), keep-digging (11 percent),
quick-patch (11 percent), and even silent-close (22 percent) still land Safe
Rollout, giving the expert scenario the registry's highest safe share.

The call: retune. The safe-rollout thresholds move from risk at most 38 and
testConfidence at least 55 to risk at most 28 and testConfidence at least
60. The reading: an incident day only counts as a safe rollout if it ends
with meaningfully less risk than it started with (initial risk is 30) and
the fix verified rather than assumed. The gate's anyOf structure is
unchanged. An alternative that additionally required the mitigated-impact
flag was tested and rejected: it dropped Safe Rollout to 8 to 11 percent and
pushed Minor Production Issue past the 45 percent bound.

Only the priority-4 safe rule moved, so the incident, overcontrolled, and
responsible-delay counts are untouched and the incident curve stays at
2.95, 6.55, 9.06, 12.60. Safe shares across the registry are now 19.5, 14.9,
22.8, 20.2, so The Page is no longer the outlier. Pins before and after:

- safe-rollout: 1682 to 1035
- minor-issue: 1452 to 2099
- customer-incident: 645 to 645 (unchanged)
- responsible-delay: 942 to 942 (unchanged)
- overcontrolled: 399 to 399 (unchanged)

All five outcomes remain inside the 2 to 45 percent bounds (Minor Production
Issue is the highest at 41.0 percent). The README already describes
difficulty next to the scenario table, so the one-line summary of the call
was added to that paragraph rather than a new section.
