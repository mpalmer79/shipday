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

## Milestone 3

### M3: The draft is the scenario object, edited immutably

The studio's draft is a plain Scenario-shaped object in component state,
edited with immutable spreads. Export is JSON.stringify of the draft and
load is JSON.parse plus a structural normalization, so the export matches
the import schema by construction and a loaded scenario that is never
touched re-exports deep-equal. Verify pins this with a load-and-export
round trip of every built-in scenario, asserted as deep equality and
re-checked through the import validator and lint. Optional fields
(consequence, lesson, codeSnippet, systemSignals, flags, overrides, the
strong marker, missedSignals) are deleted from the object when cleared
rather than set to empty values, so editing cannot leave behind keys the
original scenario did not have.

### M3: Load normalizes containers, not values

Loading JSON into forms requires the containers the editors iterate
(steps, options, impact, flags, overrides, outcomes, rules) to actually be
arrays and objects, so load coerces a wrong-typed container to its empty
container. Scalar fields are left exactly as loaded, even when invalid, and
surface through live validation instead. A valid scenario passes through
normalization unchanged, which the round-trip assertion proves.

### M3: Issues are routed to structures by parsing messages

The validator already prefixes every message with its path
(steps[2].options[1]...), and lint names structures by id, so the studio
routes messages with two small parsers (validationTarget, lintTarget in
lib/studio.ts) instead of changing the validator's return shape, which the
import page and its assertions depend on. Anything unparseable lands on the
scenario header rather than disappearing. The routing is pure and verified
directly, including an end-to-end case that breaks one option and asserts
the message lands on it. One lint message format changed for this (the
consequence override messages now read "consequence override N on
step/option"), which no assertion pinned.

### M3: Validation runs on every change, lint only on valid drafts

The validator is a single linear pass over the draft and is run on every
edit; its errors gate "Play this draft" exactly as the import page gates
playing. Lint needs a structurally valid scenario, so warnings are computed
only when validation passes, matching the import page's behavior. Playing
a draft hands the validated scenario to the same SimulatorClient the
import page uses, in memory; the draft is not shareable by link, and the
report says so through the existing share note.

### M3: Flags edit as one input per flag

Flags and missed signals are edited as lists of single inputs with add and
remove buttons rather than a comma-separated text field, because parsing a
separator on every keystroke either eats the separator being typed or
needs shadow text state beside the draft. One input per value keeps the
draft the only state. Known quirk, accepted: two missed-signal entries
whose flags are momentarily identical collapse into one, since the map is
keyed by flag.

## Milestone 4

### M4: One walk implementation, shared via a per-run callback

The exhaustive walk moved from the verify script into
`lib/simulator/distribution.ts`, which imports nothing Node-specific and is
what both verify and the studio's web worker run. Verify's twenty-odd
per-run assertions (report coherence, replay fidelity, consequence and
run-code round trips, markdown structure) did not move into the shared
module; instead `enumerateDistribution` takes an optional callback invoked
with every completed run's final state, and verify passes its assertions
through it. The walk that computes the preview is therefore byte-for-byte
the walk that computes the pins, which verify also asserts directly by
comparing `previewDistribution` counts against the walk counts for all four
built-ins. The memoized structural path counter moved into the same module
and verify consumes it from there.

### M4: Preview budget, ceiling 100,000 paths, sample 20,000 runs

The preview walks exhaustively up to 100,000 structural paths. The
built-ins sit at 4,096 to 6,400 paths and verify walks all of them with
heavy per-run assertions in under half a second, so a bare tally of
100,000 runs stays around a second inside a worker, which cannot freeze
the page in any case. Above the ceiling the preview draws 20,000 runs,
which puts the standard error of a share around 0.35 points at worst, fine
for advisory guidance against 2 and 45 percent bounds; the panel labels
the result as sampled with both the sample size and the true path count.

### M4: Sampling is uniform over paths via the structural counts

A naive walk that picks uniformly among a step's options does not sample
paths uniformly once branches have different widths. The sampler reuses
the memoized path counts and picks each option with probability
proportional to the complete paths through it, which makes every complete
path equally likely, exactly like drawing runs at random from the
exhaustive enumeration. Draws are with replacement, seeded with a fixed
constant through a small deterministic generator (mulberry32), so the same
draft always shows the same preview. Verify asserts the sampled path on a
constructed 390,625-path scenario (eight steps of five options): sampled
label, exact sample size, full tally, both outcomes seen, and run-to-run
determinism; it also asserts the sampler tracks the exact shares within
two points on a built-in.

### M4: The panel runs on demand in a bundled worker

The distribution panel posts the draft to a worker created with the
standard `new Worker(new URL(...))` pattern, which the bundler turns into
a static chunk; no dependency was added and the page stays static. The
walk runs off the main thread and the panel re-runs only on its button.
The worker re-validates the draft it receives, so a malformed message can
only produce a readable error, and walk failures (a cycle, an unknown
step) come back as messages rather than crashes. The 2 to 45 percent band
renders as advisory guidance per outcome, in words, not as a validation
error; the panel says so in one line.

## Milestone 5

### M5: How the JSON-first path was actually used

This run is autonomous and headless, so nobody clicked the studio's forms.
The dogfooding used the studio's own machinery the way its code paths
define it: the scenario was written as studio-format JSON first, then
driven through loadDraft, the validator, lint, exportDraft, and
previewDistribution (the exact pipeline behind the forms and the
distribution panel) via a small uncommitted harness, through five
edit-preview iterations, before being converted mechanically to the
built-in TypeScript file. The conversion was scripted (flag strings to the
FLAGS constants, the end sentinel to END_STEP_ID, keys unquoted) rather
than retyped, and the pinned distribution proves the committed file
behaves identically to the tuned JSON. The friction list below reads the
forms critically against that same workflow.

### M5: Scenario 5 design

The Missing Requirement: an order-history export is approved, QA-passed,
and scheduled to merge when a stakeholder mentions in passing that
enterprise contracts require role-based masking of payment and address
fields, a constraint written down nowhere. Seven steps, six decisions per
run, with a Page-style branch at the 11:30 AM call: two options route to a
renegotiation step (the strategy conversation) and two to a rework step
(reopening the code), reconverging at the merge window. The branch serves
the premise directly, since reopen versus renegotiate is the day's stated
question. The scenario reuses the existing flag vocabulary (mitigated-
impact covers gating the export, reproduced-failure covers producing the
bad file); no new flag was needed. It carries five conditional
consequences, a codeSnippet of the role-blind serializer, systemSignals on
three steps, scenario-authored missed-signal copy, and curated strong
markers.

### M5: Incidents require the export to have actually shipped

The incident rule is wrapped in lacksFlag delayed-release and lacksFlag
blocked-release: a run that ends by holding or pulling the export cannot
produce a data-exposure incident, whatever wreckage the earlier day
accumulated, because the file never reaches customers. Without the guard,
the maximally reckless prefix plus a final hold landed in Customer Impact
Incident, which contradicts the premise. Some existing scenarios do allow
high-risk held runs to reach the incident outcome; their pins were not
touched, and this scenario simply makes the cleaner choice for a premise
where exposure is the only incident channel.

### M5: Registry placement and tuning

Placed third of five, labeled intermediate, between The Broken Build and
Friday Deploy. Reasoning: the day is about scope discovery and
negotiation, with no live production fire; it is harder than The Broken
Build (contract stakes, a branch, and more political surface) but its
failure modes are slower and more recoverable than a Friday-evening global
config change or a live page, so it sits below advanced. Two scenarios now
share the intermediate label, which keeps the labels monotone along the
registry order. Tuning to the slot took three threshold moves, all in
scenario data: the first draft had Minor Production Issue at 48.2 percent
(over the bound) and incident at 5.66 percent (below the slot); loosening
the safe gate from risk at most 25 and testConfidence at least 65 to 28
and 60 brought minor-issue inside, and lowering the incident flag-clause
risk threshold from 45 to 40 and then 35 lifted the incident share to 8.23
percent, comfortably inside the 6.55 to 9.06 slot. Final distribution over
4,096 runs: Safe Rollout 750 (18.3 percent), Minor Production Issue 1,625
(39.7 percent), Customer Impact Incident 337 (8.2 percent), Responsible
Delay 1,024 (25.0 percent), Overcontrolled Delivery 360 (8.8 percent),
now pinned. No existing pin moved; the curve assertion passes with the new
point.

### M5: Dogfooding friction list

What the studio made easy:

- The distribution preview is the tool that makes authoring viable. Five
  edit-preview loops took the scenario from out of bounds to pinned, with
  exact counts to copy into the pin table. Without it, tuning is guesswork.
- Path-routed validation caught every structural mistake during drafting
  (a misspelled nextStepId, a missing metric) with messages that named the
  exact option.
- The export-import round trip is trustworthy enough to move freely
  between the forms and a text editor, and that movement turns out to be
  the real workflow: forms for structure and checks, JSON in a proper
  editor for copy passes. Long narrative text wants an editor, not a
  textarea.

What the studio made painful, in order of cost:

- No duplicate button for steps or options. Scenario steps are heavily
  templated (four options, the same seven fields each); building each
  option field by field is the single largest time sink in the form path.
- Building condition trees by clicking. The incident rule here is a
  three-level tree with six leaves; that is roughly twenty interactions in
  the nested condition editor versus six lines of JSON. Fine for hasFlag,
  costly for allOf trees.
- Flags are free-text inputs with no view of the vocabulary already in
  use, in the draft or in the built-ins. A typo becomes a dead flag that
  only lint catches later. The draft's own set of flags should be offered
  as suggestions.
- No reordering of steps or options; authoring order rarely matches final
  order, and the workaround is export, reorder in JSON, reload.
- The distribution panel says where runs landed but not why. During
  tuning, the missing artifact was one example trail per outcome; the
  harness compensated by replaying runs manually.
- The known missed-signals quirk from the M3 log (two entries with the
  same momentary flag key collapse) means the second entry must wait until
  the first has its flag typed. Hit during design; survivable, annoying.

No studio code changes were required to complete this milestone; the
pipeline handled the full loop. The friction items above are recorded as
the v4 known weak spots rather than fixed silently here.

## Milestone 6

### M6: Sweep and copy read-through

A repository-wide sweep found no em dashes in any source, data, or
documentation file, and the banned words appear only in the verify
detector list and in this decision log where the rule itself is discussed,
the convention every previous run used. The copy-rule assertions cover
scenario 5 automatically since it is registered, and the run-code error
messages are asserted clean explicitly. Every user-facing string added in
this run (share flow, run page, compare loader, studio sections and
notices, distribution panel, scenario 5) was read end to end against the
register; no filler was found beyond what drafting already removed.

### M6: README rewritten for the v4 state

The README now describes five scenarios with the updated incident curve
(2.95, 6.55, 8.23, 9.06, 12.60), conditional consequences, shareable run
links and the run page, the studio, the shared distribution walk and its
preview budget, the link-loading comparison flow, updated architecture
notes, the routes table with /run and /studio, and the updated project
structure. The roadmap marks the v4 items complete, including the
conditional-consequence item left honest in v3, and lists the three
highest-value studio improvements from the dogfooding friction list as the
remaining items rather than inventing grander ones.

### M6: Final verification scope

verify and build are green; the build route table shows every route
static or SSG. All routes were smoke tested against a running production
server: landing, picker, all five scenarios, import, studio, compare, run
(bare, with a valid code, and with a garbage code), the favicon, the
product card, a per-scenario card, and the legacy /simulator redirect.
The /run page renders its result client-side, and this harness has no
browser, so the valid and invalid rendering paths are covered by the
exported function tests in verify (round trip of every enumerated run,
ten malformed codes with specific messages) plus the served shell
returning 200 with the page heading; the same applies to the studio's
interactive flows, whose load, export, validation routing, and preview
logic are all asserted through their exported functions.

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

# Decision log: v5 autonomous build

The cinematic overhaul. This run rebuilds how ShipDay feels without changing
what it does: the engine, scenarios, routes, and every existing assertion are
untouched. No distribution pin moves. One entry per decision, tagged by the
milestone it belongs to.

## Milestone 1

### M1: One data attribute drives the whole treatment

The global risk treatment is a single `data-risk` attribute on the app shell,
read by a CSS token layer in `app/globals.css`. The alternative, threading
per-state classes through every component, would have scattered the thresholds
and made de-escalation hard to keep consistent. With one attribute on an
ancestor, every descendant inherits the shifted palette, and falling back
below a threshold is just the attribute changing, with the colour transition
running in reverse.

### M1: Palette tokens became RGB channel triplets

To let one attribute shift the whole palette while Tailwind's alpha modifiers
(`bg-accent/10`, `border-good/30`) keep working, surface, ink, and accent
colours moved from hex in the Tailwind config to `rgb(var(--token) /
<alpha-value>)`, with the channel triplets defined in `:root` and overridden
per risk state. The calm values are byte-identical to the v4 palette, so the
default state is a visual no-op. The social card renderer (`lib/ogCard.tsx`)
already restates the palette as standalone hex, so build-time image generation
is unaffected.

### M1: Risk thresholds centralised in lib/simulator/risk.ts

The meter previously carried its own 40 and 65 constants. Both the meter tone
and the shell treatment now read `riskState()` from one module, so the
presentation can never disagree with the simulation's own outcome thresholds.
This is a refactor of presentation code only; no engine behaviour changed and
no assertion references it.

### M1: good, warn, and bad stay fixed across states

The semantic metric colours report state (a number rose, an outcome was
negative). If they shifted with the room temperature they would stop being
readable as fixed signals, so they remain fixed hex. Only surfaces and accent
carry the risk treatment.

### M1: Two pre-existing animations tightened to the budget

The v5 motion budget caps every animation except the outcome resolution moment
at 600ms. Two animations predating this run sat just over it: the risk pulse
at 700ms and the delta fade at 1600ms. Both were brought to 600ms so the whole
app obeys one rule rather than carrying grandfathered exceptions. The effect is
cosmetic (a slightly quicker pulse and delta fade); no behaviour or assertion
depends on their duration.

### M1: High-risk surfaces darken rather than redden hard

The brief asks the high-risk surface to read as a room where something is
wrong. A literal red wash would have hurt contrast and read as cartoonish. The
chosen treatment darkens the surfaces and adds only a faint warm cast, which
raises text contrast rather than lowering it (every ink pairing improves over
calm) while still shifting the room's temperature. Contrast for all three
states is computed in `scripts/contrast.mjs` and recorded in docs/DESIGN.md;
every pairing meets AA.

### M1: The clock token is defined here, the clock is built in Milestone 2

The "clock sharpens" treatment is expressed as a `--clock-tracking` token that
tightens across the three states. The token and its per-state values are
defined in this milestone; the workday clock that consumes it is rebuilt in
Milestone 2, where the rest of the opening frame is restaged.

## Milestone 2

### M2: The briefing stages the first step in place, not as a takeover

The opening briefing brings the existing first step into view on a stagger
rather than mounting a separate full-screen sequence. The timestamp lands, then the
request appears as a document body, then the context, then a beat, then the
options. This keeps every piece of information identical to the static
render (the briefing is pure pacing) and means there is no second source of
truth for the first step. It runs only at the start of the day, only with
motion allowed, and only until the first decision.

### M2: The briefing is gated in logic and neutralized in CSS

Reduced-motion safety has two independent guards. In logic, `briefingActive`
is false whenever the reduced-motion hook reports the preference, so the
staged classes are never applied. In CSS, the reduced-motion block zeroes both
animation duration and animation delay, so even in the first frame before the
hook resolves, a staged element can never be held invisible by its delay. The
brief asks the briefing to be absent under reduced motion; either guard alone
delivers that, and both together make it robust to hydration timing.

### M2: Pacing comes from delays, durations stay in budget

The briefing reads as deliberate because its elements enter on a stagger
(0ms through 1600ms of delay), not because any one animation is long. Each
staged entrance is the 480ms primitive. The total sequence is longer than
600ms, but no single animation is, so the motion budget holds: the only
animation allowed past 600ms remains the outcome resolution moment.

### M2: The clock leads, the beat list stays

The workday status panel now leads with the current time as the prominent
figure and keeps end of day always visible, so time pressure is ambient. The
time tightens through the `--clock-tracking` token as risk rises. The existing
beat list (done, current, upcoming) stays beneath it unchanged, because it is
the day's shape and remains good information design; the clock is added above
it, not in place of it.

### M2: The skip control is a real button

The intro is skippable through a focusable button that sets the skipped flag,
not a click anywhere or a keypress handler. This keeps it keyboard operable
and avoids any motion tied to keystrokes. Keyboard users can also act on the
options immediately during the briefing, since the options are in the DOM the
whole time and only their opacity is staged.

## Milestone 3

### M3: The resolution script keys off the outcome, not the path

Each of the five outcomes has its own system-output script in
`ResolutionSequence.tsx`. A clean ship, a ship with a small problem, a ship
that broke and rolled back, a deliberate hold with a plan, and a change
strangled by its own gates all read differently. Because the script keys off
the resolved outcome id, a flagged rollout, a direct ship, and a hold
naturally resolve differently here, since they resolve to different outcomes
in the engine. The sequence is presentation only: the engine has already
decided the outcome before the overlay mounts, so nothing about the script can
change what happened.

### M3: The moment is capped by a timer, not by trust in the animation

The overlay sets a single 2.5 second timeout to dismiss, matching the
`--motion-resolution` token, and the line and verdict delays are tuned to land
inside that window (the verdict at 1.9s plus its 480ms entrance ends at 2.38s).
The cap is enforced by the timer regardless of how the staged delays are
tuned, so the moment can never run long. The Skip button is focused on mount
and dismisses immediately, so the moment is always escapable by click or by
keyboard.

### M3: Reduced motion skips the moment entirely

The overlay is gated behind `showResolution`, which is false under reduced
motion, so the component never mounts. The verdict (the outcome badge) and the
debrief present immediately in that case. With motion allowed, the verdict and
debrief are held back until the moment dismisses, then staged in, so the order
reads as output, then verdict, then report.

### M3: The report became a debrief document

The end-of-day report keeps every section and every action (download, share,
replay, add to comparison, restart) and is restyled with a document masthead:
a header strip with the timestamp, a title, and a one-line standfirst, with the
final metrics under a rule. This matches the ticket document language from the
briefing, so the day opens and closes in the same visual register. No data or
control was removed; only the framing changed.

## Milestone 4

### M4: Replay scenes remount to replay their entrance

Each replay frame is staged in the document language, and navigating between
scenes remounts only the scene content (keyed by index) so the staged entrance
plays again, while the Previous and Next controls stay mounted and keep focus.
Replay stays a pure reconstruction: no new state, no stored frames. The metric
movement is staged chip by chip within the budget rather than listed all at
once, which is the "staged rather than listed" the milestone asks for.

### M4: The landing stays a static server component

The opening treatment is pure CSS staged entrance with inline animation delays,
so the landing page needs no client JavaScript and still demonstrates the
visual language. The reduced-motion contract in globals.css neutralizes the
entrance, so no JS gate is required on this page.

### M4: The risk triptych uses the real tokens, not a mockup

The "room responds to risk" panels each set the actual data-risk attribute, so
the calm, raised, and high panels render through the same token layer the
simulator uses. The miniature is therefore the real treatment at three states,
which keeps the landing honest: what you see before you start is what the room
does while you play.

### M4: Landing copy corrected to five workdays

The previous landing described three workdays and named three tickets, which
went stale when the registry grew to five. The copy was rewritten to describe
the experience (the arc, the risk treatment, the close) and to render the
five-scenario registry from the data, so it can no longer drift from the
number of scenarios. The register stays flat and specific and the
deterministic, no-external-AI note is kept verbatim.

## Milestone 5

### M5: Playwright drove the pass, dependency files untouched

The v4 pass used Chrome for Testing fetched from an allowlisted mirror. This
environment already carries Playwright browsers at `/opt/pw-browsers` and a
global Playwright install, so the driver resolved Playwright from the global
install through `createRequire` rather than adding it to the project. The
repository's `package.json` and lockfile are unchanged, matching the v4 rule
that dependency files stay fixed during a QA pass.

### M5: Outcomes and risk states reached by real play, not by fixture

The driver computes decision trails from the engine (one trail per outcome,
plus an escalation and a de-escalation trail), then drives the browser by
clicking decision options by their labels, so every risk state and every
outcome is reached through real play. The data-risk attribute and the absence
of the resolution overlay under reduced motion are read off the live DOM, so
the assertions test the rendered result, not the intent.

### M5: The QA driver was not committed

Following the v4 precedent, the throwaway trail and driver scripts were run and
then removed; only the evidence (screenshots and REPORT.md) is committed. The
scripts duplicate what the verify assertions and the build already guard, and
keeping them out of the tree keeps them out of the production type-check.

### M5: One pass, no findings

All 19 automated checks passed, including the reduced-motion contract (briefing
absent, no resolution overlay, verdict and report immediate) and high-risk
contrast measured in the browser at 15.80. Nothing needed reporting as a
blocked check or an unfixed finding.

## Milestone 6

### M6: The sweep is clean, with two deliberate non-issues

The repository-wide sweep found no em dashes and no banned words in any
user-facing copy. Two matches were examined and left as correct: "support
agent" in The Missing Requirement is a help-desk worker, not spy-fiction agent
language, and it lives in untouchable scenario data; and "cinematic" appears
only in a CSS comment describing the design layer, never in a string a user
sees. The drama lives entirely in presentation; the user-facing copy stays
flat, realistic, and specific, with no film, franchise, spy, mission, or
countdown language anywhere.

### M6: README gained an experience section, not just a feature line

The README now leads its description with how the day feels (the document
ticket, the clock, the risk treatment, the resolution moment) and carries a
dedicated experience section that points at docs/DESIGN.md and the v5 QA
evidence, so a reader understands the cinematic layer is information design
bound to simulation state, not decoration. The roadmap marks the five v5
deliverables done and the structure listing gains the new files.

### M6: Final state is fully static and green

Final `npm run verify` and `npm run build` both pass. Every route prerenders
as static or statically generated content, with no server, API key, or
environment variable, so the accessibility and deployment floor from earlier
releases holds. No distribution pin moved across the entire run.

# Decision log: v6 autonomous build

The showpiece. This run rebuilds ShipDay's public front door into a cinematic
engineering operations room, with a WebGL hero, living dashboard sections, and
a narrative scroll, without touching the engine, scenarios, simulator gameplay,
studio, run page, or any existing assertion. No distribution pin moves. One
entry per decision, tagged by milestone.

## Milestone 1

### M1: Showpiece tokens layer on top of v5, they do not replace it

The deeper palette (void, panel, edge, hot) is added as new `:root` tokens and
new Tailwind colours, leaving the simulator's risk tokens and the semantic
good, warn, and bad untouched. The front door and the gameplay share one token
system, so bringing the framing pages into the new language later is additive,
and the simulator views keep behaving exactly as they do today.

### M1: Hot is a showcase accent, separate from warn and bad

The art direction asks the terminal accent to run cool in calm and hot under
pressure. Rather than overload the semantic warn or bad (which mean specific
things in the simulator), the showcase gets its own `--hot` amber. It carries
the pressure temperature on the landing without changing what warn and bad mean
where the engine uses them.

### M1: Light is a composed shadow token, not a stack of utilities

Panel depth and glow are one `shadow-panel` token (edge highlight, grounded
drop, faint tonal glow) plus a hot variant, because Tailwind box-shadow
utilities override rather than stack. One token per panel keeps the lit-by-
screens look consistent and avoids per-panel shadow soup.

### M1: No new font

The headline scale is fluid (`text-display`, clamp based) and uses the existing
Inter at display weight and tight tracking rather than loading a display face.
This keeps the build free of a new font fetch and the page free of an extra
font payload, and Inter is already a strong sans. If a designer later wants a
distinct display face, the scale is the single place to change.

### M1: Primitives are pure presentation, verified by types and the build

The six landing primitives carry no logic and never call the engine; they
render caller-supplied content. They are verified at this milestone by the type
checker and the build (Tailwind generates their classes from the literal
strings in the files), not by a browser, per the no-browser rule for the build
milestones. Dot and fill colours are static maps, not constructed strings, so
the Tailwind scanner sees every class.

### M1: Landing route JS unchanged at this milestone

The primitives are not yet imported by any route, so the landing route's first
load JS is unchanged from the baseline (165 B page, 106 kB first load). The
budget tracking starts here so later milestones can be measured against it.

## Milestone 2

### M2: The sections are set dressing, never the engine

The sprint board, deploy pipeline, message feed, and metrics panel are pure
presentation seeded with deterministic sample content in the established
register. None call the engine, resolve an outcome, or read a live run. This is
the trailer, not the game, so the landing can never disagree with the simulator
or drift its distributions.

### M2: Two sections live, two rest

The deploy pipeline and the metrics panel are the living pieces: each starts its
animation only when it scrolls into view (an IntersectionObserver that
disconnects after firing), so nothing animates offscreen. The sprint board and
message feed are static by design, because a board and a message log are
snapshots; their motion would be decoration, which the budget forbids.

### M2: The pipeline runs once, it does not loop

The deploy pipeline advances through its stages a single time when seen and then
rests at all-passed. It is a finite sequence of short state changes, not a
perpetual loop, so it stays inside the motion budget. The only loops on the
landing are the cursor blink in the message feed and, in the simulator, the
high-risk glow. Under reduced motion the pipeline renders finished immediately
and the metrics present full.

### M2: The metrics panel imports labels narrowly

The metrics panel echoes the simulator's six metrics by importing only
`METRIC_LABELS` and `METRIC_ORDER` from `lib/simulator/metrics` and the
`MetricKey` type, not the barrel, so the engine never enters the landing's
client bundle. The values are a fixed sample, not a run.

### M2: Reveal and in-view are shared, lean primitives

The scroll-reveal wrapper and the in-view hook are small client utilities that
the living sections and the later narrative scroll reuse. The reveal animates
transform and opacity only and is reduced-motion safe; the hook is SSR-safe and
disconnects after the first intersection so it costs nothing afterward.

## Milestone 3

### M3: Three.js added as the one permitted runtime dependency

The hero is a Three.js scene (three 0.180.0), the single new runtime dependency
the run allows. Its bundle cost is contained: the scene lives in its own
dynamically imported chunk of 316 KB raw, 74 KB gzipped, loaded only when the
scene mounts. The landing route's first load JS moved from 106 KB to 108 KB (a
2 KB Hero gate), and Three is absent from the first-load and shared chunks, so
the Largest Contentful Paint never waits on WebGL. The scene is built from
geometry and a runtime-generated sprite, with no model or texture asset files.

### M3: The poster is the LCP, the scene is an enhancement

The hero reserves an 88vh band and renders the static poster
(`public/hero/shipday-workspace.png`) as the base layer immediately, so there is
no layout shift and first paint never waits on WebGL. The 3D scene composites
over the poster through a dynamic import with ssr false, after hydration. A
scrim guarantees text contrast over any scene state, so the headline meets AA
regardless of what the scene is doing.

### M3: The 3D scene is gated behind capability and preference

The scene mounts only when a real WebGL context is available and none of these
hold: reduced-motion preference, save-data, a 2g effective connection, two or
fewer logical cores, or two or fewer GB of device memory. Any uncertainty falls
to the poster. This keeps the heavy path off low-power and constrained devices
without a server or a feature flag.

### M3: Performance rules enforced in the scene lifecycle

The render loop runs only when the canvas is on screen (IntersectionObserver)
and the tab is visible (visibilitychange); it is cancelled otherwise, so an
offscreen or backgrounded hero costs nothing. The device pixel ratio is capped
at 1.5, the geometry is fixed at 520 nodes and at most 700 line segments, and on
unmount every geometry, material, texture, and the renderer itself is disposed
and the canvas removed. The material runs `low-power` power preference.

### M3: Calm to hot is driven by pointer load, not gameplay

To share the app's risk-temperature language without inventing gameplay on the
landing, the scene warms from the cool accent toward the hot accent based on
pointer speed (a heat value that rises with fast movement and decays when idle),
reading as systems heating under load. It is presentation only and resets to
calm at rest.

### M3: The hero asset is a generated placeholder with a documented swap

The final illustration drops at `public/hero/shipday-workspace.png` at 16:9
(1600 x 900 or larger). Until then a placeholder is generated by
`scripts/gen-hero-placeholder.mjs` (a hand-rolled PNG encoder, no image library
or browser) and clearly marked with the standard placeholder frame and cross.
`public/hero/README.md` documents the swap: replace the file at the same path,
no code change. The `alt` text lives in `components/hero/Hero.tsx`.

## Milestone 4

### M4: The landing gets its own void shell

The landing composes its own shell (the restyled header, a full-bleed hero, the
sections, and the footer) over the deeper `bg-void` base, rather than the
constrained AppShell main, so the hero can run full width and the front door can
sit on the showpiece's darkest surface. The framing pages keep AppShell, now
with an opt-in footer, so the chrome is shared without forcing the landing into
a constrained column.

### M4: The scroll narrative is reveals plus one progress line

The narrative is built from the in-view Reveal wrapper (transform and opacity
only, gated under reduced motion, the observer disconnecting after it fires) and
a single scroll-progress line that updates a scaleX transform on a passive,
requestAnimationFrame-throttled scroll listener and does not render at all under
reduced motion. There is no scroll-linked layout work, so the narrative stays
cheap.

### M4: The footer is opt-in, the simulator stays clean

The footer is an AppShell prop, off by default. The framing pages (scenarios,
import, studio, run, compare) and the landing carry it; the focused simulator
gameplay view does not, so the rule against altering gameplay holds while the
front door gains shared chrome.

### M4: Landing JS stayed lean

Adding the living sections, the reveals, and the scroll progress moved the
landing route's first load JS from the 106 KB baseline to 110 KB, a 4 KB
increase for all of the front-door interactivity. The Three.js scene remains in
its own lazy chunk and is still absent from the first load, so the budget and
the LCP independence hold.

### M4: Framing pages share the language through chrome and tokens

The header and footer and the showpiece tokens bring the framing pages into the
new language; the scenarios picker was additionally restyled with the display
heading and glowing panels. The interiors of the studio, run, import, and
compare clients were left on the shared token system rather than rebuilt, to
keep this run away from gameplay-adjacent logic; they read consistently through
the shared chrome and palette.

## Milestone 5

### M5: The reveals are no-JavaScript safe

The scroll reveal originally hid content with client state, which would have
left the landing's sections invisible without JavaScript. The Reveal wrapper was
rebuilt to render visible by default (an idle state with no opacity) and to hide
then reveal only after mount, and only for content still below the fold, so the
page is fully legible without JavaScript and nothing already on screen flashes.
The metric bars now default to filled and the deploy pipeline defaults to
all-passed, so both degrade to coherent static states without JavaScript or
under reduced motion; their animations are enhancements layered on top.

### M5: Route JS budgets (final)

From the production build, first load JS per route:

- `/` landing: 110 KB (4.14 KB page). The Three.js scene is a separate lazy
  chunk (316 KB raw, 74 KB gzip) and is not in this figure, so the LCP poster
  never waits on it. The landing rose 4 KB over the 106 KB pre-v6 baseline for
  all of the living sections, reveals, and scroll progress.
- `/scenarios`: 106 KB. `/simulator/[scenarioId]`: 120 KB. `/studio`: 160 KB.
  `/import`: 122 KB. `/compare`: 148 KB. `/run`: 150 KB.

Every route prerenders as static or statically generated content.

### M5: Accessibility self-audit

- Landmarks: header, main, footer, and nav on the landing and framing pages.
  Each landing section is a labelled region (aria-labelledby its heading).
- Headings: one h1 per page (the hero on the landing), h2 per section, h3 for
  sub-panels, in order.
- Alt text: the hero poster carries descriptive alt; no other content imagery on
  the landing.
- Decorative elements are aria-hidden: the WebGL canvas, the scroll-progress
  line, the hero scrims, the risk ambient layer, the cursor blink, and the
  status dots.
- Keyboard: all interactive elements are links or buttons, reachable in DOM
  order, with the global focus-visible ring. The reveal wrapper never traps
  focus and its content is visible by default.
- Motion: every animation is reduced-motion gated. The inventory is
  bar-grow, cursor-blink, and stage-in (neutralized by the global CSS contract),
  plus the Reveal transition, the scroll-progress line, the deploy pipeline run,
  the metrics grow, and the WebGL scene (all gated in component logic, the scene
  never mounting under reduced motion).
- No information lives only inside an animation: the pipeline and metrics show
  their values as text, and the 3D scene is purely decorative.

## Milestone 6

### M6: One isolated browser pass, Playwright from the global install

The pass built once, started the server once on port 3211, drove every flow, and
tore the server down, exactly as the no-browser-before-this rule requires. As in
v5, Playwright was resolved from the environment's global install, so the
repository's dependency files are unchanged.

### M6: The capable-device path was forced to exercise the real 3D

Headless Chromium renders WebGL through software and reports a low core count,
which the hero's capability gate treats as a low-power device. To drive the real
3D path, the capable contexts override `hardwareConcurrency` and `deviceMemory`
to typical laptop values; the fallback and reduced-motion contexts override
nothing, so they test the true gated behaviour. This is recorded plainly because
it means the frame rate seen here is software, not a real GPU, and a human
on-device pass is still required.

### M6: Render-loop pause proven by frame counting

Rather than trust the lifecycle code, the pass counted requestAnimationFrame
ticks: 24 frames per 400ms while the hero was visible, 0 after emulating a hidden
tab, and 0 after scrolling the hero offscreen. The loop demonstrably runs only
when on screen and visible.

### M6: 13 of 13 checks passed

The 3D mount, the fallback poster with WebGL disabled, the reduced-motion inert
paths (no canvas, no scroll progress, content visible), the living sections, the
scroll positions, mobile, the framing pages, keyboard reachability of nav and
CTA, and a 16.63 hero contrast all passed. Evidence is in docs/qa/v6 with a
REPORT.md, and the report states plainly that a human on-device performance pass
is still needed.

## Milestone 7

### M7: The sweep is clean

The repository-wide sweep found no em dashes anywhere, no banned words in
user-facing copy (only the verify assertion list names them), and no theme-rule
violations: no film, spy, mission, agent, or operative language in any
user-facing string. The intensity of the front door lives entirely in light,
type, motion, and information density. The one "agent" in the repository remains
"support agent" in untouchable scenario data, a help-desk worker, not spy
language.

### M7: README updated for the front door and the dependency

The README gained a front-door section describing the WebGL hero, the living
sections, and the narrative scroll, a dependencies section recording Three.js
and its isolated 74 KB gzipped lazy chunk, an expanded structure listing, and
the v6 roadmap entries. The hero placeholder and its swap are pointed at
`public/hero/README.md`.

### M7: Final state is fully static and green

Final `npm run verify` and `npm run build` both pass. Every route prerenders as
static or statically generated content with no server, API key, or environment
variable. The landing first load is 110 KB with the Three.js scene in a separate
lazy chunk, so the budget and the LCP independence hold. No distribution pin
moved across the entire run.

---

# ShipDay v7: maximum-spectacle cinematic rebuild

The v7 run rebuilds the entire experience layer and theming as a spy-thriller
agency-operations interface, on top of the same untouched engine, scenarios,
simulator decision logic, studio, and run pages. Gameplay is unchanged. Every
distribution pin in verify is fixed and no assertion is weakened. The only
creative boundary: no real film or franchise marks; all genre language is
original.

## Baseline (pre-M1)

Established green before any change. `npm run verify` and `npm run build` both
pass. Route JS first load, recorded for the M5 before/after comparison:

- `/` landing: 110 kB first load (4.14 kB route).
- `/scenarios`: 106 kB.
- `/simulator/[scenarioId]`: 120 kB.
- Shared baseline: 103 kB.

The branch already carried the v6 showpiece merge plus the CI workflow commits;
it is a superset of main, so the work starts from v6 as required.

## Milestone 1: the cinematic design system

### What shipped

- Agency-ops palette tokens in `app/globals.css`: `--classified`, `--signal`,
  `--alert`, `--alert-bright`, `--alert-deep`, `--alert-banner`, plus the
  `--countdown-tracking` mission-clock token. Registered as Tailwind colours in
  `tailwind.config.ts`.
- `lib/cinematic/sequence.ts`: `useCinematicSequence`, the single
  sequence-orchestration primitive, with skip and reduced motion built in and a
  total run time bounded by the sum of stage holds.
- `lib/cinematic/clock.ts`: pure mission-clock math over the scenario's existing
  time labels.
- `lib/cinematic/dossier.ts`: codenames and difficulty-derived threat levels for
  the five scenarios, with a fallback for imported scenarios.
- `components/cinematic/`: `HudFrame`, `ClassifiedStamp`, `ThreatBadge`,
  `DecodeText`, `SkipButton`, all pure presentation with reduced-motion and
  accessibility built in.
- Alert-state token system: `data-alert` layered on the shell, with a tactical
  mid vignette and a red-alert high takeover, both defined in CSS and
  neutralized under reduced motion.

### Contrast (computed, WCAG relative luminance)

All new pairings clear AA (4.5 normal, 3.0 large/UI). Measured:

- ink on calm surface: 15.78; ink on high (alert) surface: 16.62.
- ink-muted on calm surface: 7.67; on high surface: 8.08.
- alert red text on high surface: 7.20; alert red on void: 7.20.
- alert-bright on alert-deep surface: 8.83; ink on alert-deep: 15.39.
- light ink on the solid alert banner (140 22 26): 8.58.
- classified amber on void: 12.29; signal green on void: 11.43.
- cool accent on void and void ink on the accent button: 7.94.

The red-alert takeover never recolours body text or surfaces, so the 16.6:1 ink
contrast holds through the most intense state. The weakest new pairing is the
alert red text at 7.20, comfortably above AA.

### Decisions

- The alert layer is additive (`data-alert`) rather than a rewrite of
  `data-risk`, so the existing risk treatment and its de-escalation transition
  are preserved and the takeover composes on top.
- `DecodeText` exposes the resolved string as the accessible label and scrambles
  only an aria-hidden layer, so the effect never hides information from assistive
  tech and is inert under reduced motion.
- Threat levels are derived from difficulty, not authored independently, so the
  mission framing cannot contradict the registry's difficulty order (which
  verify already pins through the incident curve).
- No scenario data, engine code, or verify assertion was touched. Distribution
  pins unchanged.

### Verification

`npm run verify` green (all distribution pins hold). `npm run build` green.

## Milestone 2: the cold open and the mission select

### What shipped

- `components/cinematic/ColdOpen.tsx`: the landing cold-open sequence. An overlay
  over the already-rendered landing that boots the agency interface, opens a
  secure channel, assembles a classified briefing, and reveals the product as
  the assignment. Built on `useCinematicSequence` (four stages, about 3.6s
  total). Skippable with one focused control, plays once per session via
  `sessionStorage`, and dismisses immediately under reduced motion or on a
  return visit.
- `components/cinematic/MissionDossier.tsx`: a scenario rendered as a classified
  case file. Composes real registry listing data; codename, threat level, file
  tag, and directive are derived in `lib/cinematic/dossier.ts`. The whole card
  is the link into the mission; hover and keyboard focus lift the folder and
  read ACTIVE, the reveal-on-open beat.
- `app/scenarios/page.tsx` rebuilt as the mission-select wall of dossiers, two
  up, composed from `scenarioListings`.
- `app/page.tsx` reframed as the operative briefing: the hero copy, the
  operations dossier, the alert-ladder section, and the mission grid, with the
  cold open mounted at the top.
- Header and Footer chrome reframed to the agency framing (nav label Missions,
  taglines).

### Decisions

- The cold open is a client-only overlay mounted after hydration, so the
  server-rendered landing (and the no-JavaScript view) is the real first paint
  and LCP. The overlay never blocks reaching a decision: skip lands on the
  briefing with the primary CTA in reach.
- Reduced motion and return-visit gating are decided in a mount effect, not
  during render, so neither sessionStorage nor the motion query is read at
  render time. While the decision resolves the overlay does not show.
- The mission-select copy and dossier directives are framing chrome, kept in the
  cinematic layer, never in scenario data. The realistic engineering register
  inside the simulator decisions is untouched.

### Route sizes

- `/` landing: 110 kB to 113 kB first load (the cold open and dossier
  composition).
- `/scenarios`: 106 kB to 109 kB first load.

### Verification

`npm run verify` green (pins hold). `npm run build` green.

## Milestone 3: the briefing and the mission clock

### What shipped

- `components/cinematic/MissionBriefing.tsx`: the scenario-entry briefing. A
  full-screen sequence (four stages, about 3.8s) where the case file opens, the
  directive is read into the record, the threat and objective and starting
  readout appear, and the mission clock is armed before handing off. Built on
  `useCinematicSequence`. Skippable with one focused control, never mounted
  under reduced motion.
- `components/simulator/WorkdayStatus.tsx` rebuilt as the mission clock: the
  prominent figure is the countdown to end of day (T-minus), with the current
  time, a day burn-down bar, and the day's beats underneath. It escalates with
  risk through the global tokens and breathes (a sub-1Hz pulse) in the final
  hour or under red alert, neutralized under reduced motion.
- `lib/cinematic/clock.ts` wired into the clock; the clock reads the real step
  progression through `beats` and `currentIndex`, so it tracks the day exactly.
- `SimulatorClient` mounts the briefing overlay over the already-rendered
  workday and threads the registry `difficulty` into it for the threat level.

### Decisions

- The briefing is an overlay over the mounted workday, not a gate in front of
  it, so skipping or finishing continues play with no layout shift, and a
  reduced-motion user gets the workday immediately.
- `dossier.ts` was decoupled from the scenario registry: `threatFor` now takes a
  difficulty, threaded as a prop from the server simulator page through
  `SimulatorClient` to the briefing. This kept the simulator route from
  bundling all five scenarios' data. Pulling the full registry briefly pushed
  the route to 156 kB; with the prop and a type-only import it is back to 123 kB
  (120 kB baseline plus 3 kB of briefing and clock code). Imported and studio
  scenarios, which have no registry difficulty, default to the guarded tier.
- The countdown is derived from the scenario's own time labels, never invented,
  so it cannot disagree with the day.

### Route sizes

- `/simulator/[scenarioId]`: 120 kB baseline to 123 kB first load.

### Verification

`npm run verify` green (pins hold). `npm run build` green.

## Milestone 4: the alert states and the resolution climax

### What shipped

- `components/cinematic/AlertBar.tsx`: the mission alert bar. A tactical amber
  strip at the raised threshold and a red-alert banner with a sweeping alarm
  rail at the high threshold, both with role="status" so the state change is
  announced. It stands down on its own as risk recedes because it renders off
  the live risk state.
- `components/layout/AppShell.tsx`: now carries a `data-alert` attribute and a
  fixed, pointer-transparent, aria-hidden alert overlay (the tactical and
  red-alert vignettes from M1), and renders the alert bar. The overlay never
  recolours body text or surfaces.
- `components/simulator/ResolutionSequence.tsx` rebuilt as the full-screen
  climax: the system output streams in matching the real outcome, then a verdict
  card lands themed by outcome tone with an original mission-verdict line for
  each of the five outcomes (accomplished, contained, compromised, held,
  stalled), then it dismisses to the debrief. Built on `useCinematicSequence`,
  skippable, capped at about 2.6s, reduced-motion safe.
- `components/simulator/EndOfDayReport.tsx` restyled as the classified
  after-action file: an after-action stamp header, mission-debrief framing, and
  mission-log labelling. All report actions (restart, replay, download, add to
  comparison, copy link) are unchanged and still work.

### Contrast in the alert states (re-confirmed)

The red-alert takeover keeps body text as light ink on the darkened high surface
at 16.6:1. The red banner uses light ink on the solid alert colour at 8.58:1.
The tactical strip uses classified amber on the dark surface at 12.29:1. Every
alert state clears AA.

### Decisions

- Alert presentation is driven entirely by the existing risk state at the
  existing 40 and 65 thresholds, so the takeover and the stand-down can never
  disagree with the simulation. No new thresholds were introduced.
- The verdict lines are original genre language in the cinematic layer; the
  realistic system-output scripts (the part that makes the stakes land) are
  unchanged.
- The debrief restyle is chrome only; the exported markdown report and its
  section names (which verify asserts) are untouched.

### Verification

`npm run verify` green (pins hold). `npm run build` green.

## Milestone 5: the ambitious WebGL command center

### What shipped

- `components/hero/HeroScene.tsx` rebuilt into the volumetric command-center
  space: a converging floor grid for depth, a drifting tactical network of nodes
  wired into a faint lattice, and a glowing core that breathes at centre, lit
  cool and warming toward the hot accent under pointer activity, with slow
  parallax that leans the room toward the operative. All geometry plus one
  runtime point sprite; no model or texture asset files.
- `components/hero/HeroPoster.tsx`: a new static dramatic poster as inline SVG
  (a command-center floor grid, a tactical node network, and a glowing core).
  Server rendered, so it is the LCP base and paints on first paint. It is also
  the fallback whenever the scene cannot run.
- `components/hero/Hero.tsx` now uses the SVG poster as the base layer instead of
  the raster placeholder; the gate to the 3D scene is unchanged.

### Performance budget and how each rule is enforced

- Lazy chunk: the scene is `dynamic(() => import("./HeroScene"), { ssr: false })`,
  so Three.js lands in its own chunk: 322 KB raw, 75.5 KB gzipped, unchanged by
  the rebuild (the same Three.js core).
- LCP independent of WebGL: the landing route first load is 114 KB and does not
  include the 75.5 KB Three.js chunk. The LCP base is the server-rendered SVG
  poster, which paints before the scene chunk is even requested.
- Capability and reduced-motion gating: `Hero` mounts the scene only when WebGL
  is present and motion is permitted, and not under save-data, a 2g link, or low
  core or memory counts; otherwise the poster stands alone.
- Offscreen and hidden-tab pause: the render loop is driven by an
  IntersectionObserver and a visibilitychange listener; it stops when the canvas
  scrolls offscreen or the tab is hidden, and only restarts when both are true.
- DPR cap: pixel ratio is capped at 1.5 on init and on every resize.
- Resource disposal: every geometry, material, the sprite texture, and the
  renderer are disposed on unmount, and the canvas is removed from the DOM.
- No layout shift: the hero band reserves its height (min-h-[88vh]) and the
  poster fills it before the scene initializes.

### Route sizes (before and after)

- `/` landing first load: 110 KB baseline, 113 KB after M2, 114 KB after M5 (the
  inline SVG poster markup). The Three.js scene is never in this number.

### Verification

`npm run verify` green (pins hold). `npm run build` green.

## Milestone 6: the browser pass and evidence

### One isolated pass, Playwright from the global install

The pass built once, started the production server once on port 3211, drove
every set piece and assertion in one run, and tore the server down, as the
no-browser-before-this rule requires. Playwright was resolved from the
environment's global install at `/opt/pw-browsers`, so the repository's
dependency files are unchanged. No runtime dependency was added.

### The capable-device path was forced to exercise the real 3D

As in v5 and v6, headless Chromium renders WebGL through software and reports a
low core count, which the hero's capability gate treats as a low-power device.
To drive the real 3D path the capable context overrides `hardwareConcurrency`
and `deviceMemory` to typical laptop values; the fallback and reduced-motion
contexts override nothing, so they test the true gated behaviour. This is
recorded plainly because the frame rate seen here is software, not a real GPU,
and a human on-device pass is still required.

### Defect found and fixed: the cold open never rendered

The browser pass revealed that the cold open never appeared. `ColdOpen` was
always mounted and gated itself with an internal "pending -> play" state. On the
first render that state is "pending", so it passed a true reduced-motion flag
into `useCinematicSequence`; the hook is born finished under that flag, and when
the state later flipped to "play" the hook re-armed its timers but never cleared
its finished flag, so the overlay returned nothing for the rest of the session.
The briefing and the resolution avoid this because their parents mount them only
when they should play, never self-gating from a pending state.

The fix applies that same pattern to the cold open: `ColdOpen` now decides
pending, play, or off, and mounts the inner sequence only once the decision is
play, so the sequence always starts with motion allowed and runs its stages. The
run-once-per-session and reduced-motion gating stay in the parent, unchanged. The
visuals, the single skip control, the session key, and the reduced-motion and
return-visit behaviour are all unchanged. This is a defect fix within the
original v7 rules: no new dependency, no assertion weakened, no distribution pin
moved. The affected checks (the cold open plays, skips, is keyboard operable, and
is inert under reduced motion) were re-run green.

### Red-alert contrast clears AA, measured in the live state

The red-alert (high) state was reached through real play of the expert scenario,
and every visible text element's colour was paired by computed style with its
nearest opaque background and the WCAG ratio computed. Sixteen unique pairings
were found and all clear AA: body text 14.97 to 16.62, the red-alert banner
7.81, the clock's Condition red and red risk readout 6.84, the escalated
countdown 7.63, and the weakest pairing (muted ink on the raised card) 4.82,
above the 4.5 floor. The takeover never recolours body text or surfaces, so the
strongest ink contrast holds through the most intense state. No contrast fix was
needed.

### Render-loop pause proven by frame counting

The render loop was counted, not trusted: wrapping requestAnimationFrame before
the scene loads, the loop advanced 17 to 19 frames per 400ms while the hero was
visible, 0 after emulating a hidden tab, and 0 after scrolling the hero
offscreen. The loop runs only when on screen and visible.

### 33 of 33 checks passed

Every set piece was captured and every assertion run: the cold open mid and
skipped, the mission-select wall, the briefing, the clock calm and escalated,
the tactical and red-alert states and the stand-down, all five resolution
outcomes and the debrief, the 3D hero and the no-WebGL fallback, mobile width,
the full reduced-motion inventory, keyboard reach of the skips and the CTA, every
route returning 200, and the legacy redirect. Evidence is in `docs/qa/v7` with a
`REPORT.md` and the contrast table, and the report states plainly that a human
visual and on-device performance pass is still required.
