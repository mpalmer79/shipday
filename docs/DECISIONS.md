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

## v3 Milestone 1

### M1: Brand assets generated by a committed script, not by hand

The social card and app icons are produced by `scripts/generate-brand-assets.py`,
which draws them from the same design tokens as `tailwind.config.ts` (surface,
ink, accent, and the three risk-band colors). The script is one-off build
tooling, not part of the app runtime, and the generated PNGs are committed so
the app needs no image service and no build-time image step. Python with
Pillow was used because it was the available raster toolkit; this adds no
runtime dependency, since the app never imports it. Re-run the script and
commit the output after any token change.

### M1: Fixed canonical origin for metadataBase

Open Graph and Twitter image URLs must be absolute, because crawlers do not
resolve relative image paths. Next.js resolves them against `metadataBase`,
which defaults to localhost and emits a build warning when unset. The deploy
domain is not knowable from inside the repository, and reading it from an
environment variable would violate the no-env-vars rule, so `metadataBase` is
a single hardcoded origin (`https://shipday.vercel.app`) defined as
`SITE_ORIGIN` in `app/layout.tsx`. It is the one value to change if the
deploy domain differs, and it needs no configuration to build or run.

### M1: Per-scenario metadata via generateMetadata

The dynamic route `/simulator/[scenarioId]` uses `generateMetadata` to read
the scenario name and tagline from the registry, so each scenario page emits
its own title and description (for example "Friday Deploy . ShipDay") rather
than the site default. Unknown scenario ids return an empty metadata object
and fall through to the not-found handling already in place. The title
template in the root layout appends the site name, keeping titles consistent
across routes.

### M1: h1 on simulator pages deferred to Milestone 2

The simulator pages currently render no h1 (the scenario card uses an h2),
which the prerendered HTML confirms. This is semantic structure, which is
Milestone 2's scope, so it is recorded here and fixed there rather than
expanding Milestone 1 beyond metadata and identity.

## v3 Milestone 2

### M2: Mobile column order puts the risk meter first

On desktop the simulator is three columns (workday, center, metrics). On a
single column the v2 order placed the metrics dashboard last, so the risk
meter sat below the decision panel and required scrolling past it. The three
grid children now carry explicit mobile and desktop order classes: metrics
is order-1 on mobile (lg:order-3 on desktop), the center column is order-2,
and the workday and timeline column is order-3 on mobile (lg:order-1). The
risk meter is now the first content after the page heading on narrow
viewports, visible without scrolling past the decision panel, and the
desktop layout is unchanged.

### M2: ink-faint token darkened to meet WCAG AA

The mandated contrast pairs all passed AA against their backgrounds before
any change: risk bands good 9.9, warn 10.3, bad 6.2, and the metric delta
colors use the same good and bad tokens. The broader audit found one failing
token: ink-faint (#5e6b80) measured 3.2 on surface-raised, 3.5 on surface,
and 2.9 on surface-overlay, below the 4.5 needed for small text. It is used
for small secondary labels (times, captions, the tagline). It was darkened
to #8190a8, which measures 5.3, 5.8, and 4.8 against the three backgrounds,
clearing AA everywhere while staying visibly lighter than ink-muted so the
hierarchy is preserved. This is the only token changed.

### M2: Global keyboard focus and reduced-motion handling

A single focus-visible rule in globals.css gives every link, button,
textarea, and tabbable element a visible accent focus ring, applied only for
keyboard and assistive-tech navigation (focus-visible), not mouse clicks.
This covers the decision options, scenario picker cards, replay controls,
download and restart buttons, and the timeline toggle in one place rather
than per component. A prefers-reduced-motion block also neutralizes the risk
pulse and delta-fade animations for users who request reduced motion, which
the v2 motion was missing.

### M2: Page-by-page accessibility audit

Landing (/): one h1 (ShipDay), header and main landmarks, the call to
action is a real link with text, supporting copy uses ink-muted (7.0 contrast).
Checked heading order, link names, contrast. Fixed: none needed. Passed
unchanged except for the global focus ring now applying to the call to
action.

Scenarios (/scenarios): one h1 (Pick a workday), each scenario is a real
anchor with its name and tagline as the accessible name, difficulty shown as
text not color alone. Checked card semantics, keyboard reachability, heading
order. Fixed: focus ring via the global rule. Passed unchanged: card markup
was already a list of links.

Simulator (/simulator/[scenarioId], covering the play, report, and replay
views): added a single h1 with the scenario name (the page previously had no
h1; the step title is an h2 under it, the decision prompt an h3). Wrapped the
metrics dashboard in a section labelled "Your metrics". The risk level is
conveyed by a text label (Controlled, Raised, High) alongside color, and
metric deltas carry an explicit plus or minus sign, so no state is color
only. Decision options, replay Previous and Next, download, and restart are
all native buttons with text labels. Checked: h1 presence, landmark, button
semantics, color-only signals, mobile order, focus. Fixed: missing h1,
unlabelled metrics region, mobile risk-meter position. Passed unchanged:
buttons were already native and labelled.

Redirect (/simulator) and not-found: the redirect emits no UI of its own and
the not-found page is the framework default; neither needed changes.

## v3 Milestone 3

### M3: Missed-signal copy moved into scenario data with shared fallback

The Scenario type gained an optional `missedSignals` map keyed by flag.
`generateReport` now prefers the scenario-specific text for a set flag and
falls back to the shared `MISSED_SIGNAL_COPY` only when the scenario does
not define one. All three scenarios now carry their own missed-signal copy
for the negative flags they can set, so the report speaks in each day's
specifics (promo double-discounting, order-sync coverage, shared config
units) instead of generic copy. The shared map is unchanged and still
covers any flag a scenario does not override, including imported scenarios.
This is report copy only and does not affect outcome distributions.

### M3: Strong decisions curated by an explicit marker

DecisionOption gained an optional `strong` boolean, carried through the
engine into DecisionRecord. The report now selects strong decisions by the
marker when a scenario curates any (all three built-in scenarios do), and
falls back to the previous metric heuristic only for scenarios that mark
none (legacy or imported data). The heuristic function is kept and renamed
to make its fallback role explicit. Markers were set deliberately, roughly
two per step, on the options that embody the disciplined call at each beat.
Verify now asserts every reported strong decision was marked and that each
built-in scenario marks at least one option. This is report selection only
and does not affect outcome distributions.

### M3: Difficulty curve and distribution pin updates

The incident rate (share of paths ending in Customer Impact Incident) now
rises with the scenario's difficulty label: starter, intermediate,
advanced. Target curve: roughly 3 percent, 6 to 7 percent, and 9 to 10
percent. Before this run the rates were 2.9, 7.5, and 2.6 percent, so the
advanced scenario was the easiest, which inverted the intended progression.
Two scenarios were retuned by adjusting only their incident outcome rule
thresholds (no copy or impact changes), and all five outcomes stay within
the 2 to 45 percent bounds in every scenario.

just-add-a-button (starter): unchanged at 2.9 percent incident. Pins
unchanged: safe-rollout 998, minor-issue 2058, customer-incident 151,
responsible-delay 1263, overcontrolled 650.

the-broken-build (intermediate): incident outcome rule bare risk threshold
raised from 70 to 74, bringing incident from 7.5 to 6.9 percent. Pins
before: safe-rollout 951, minor-issue 2697, customer-incident 481,
responsible-delay 1545, overcontrolled 726. Pins after: safe-rollout 951,
minor-issue 2735, customer-incident 439, responsible-delay 1545,
overcontrolled 730.

friday-deploy (advanced): incident outcome rule broadened, bare risk
threshold lowered from 70 to 50, and the secondary clause changed from
(shipped-direct and skipped-validation and lacks prepared-rollback and risk
at least 55) to (shipped-direct and lacks prepared-rollback and risk at
least 35), bringing incident from 2.6 to 9.5 percent. Pins before:
safe-rollout 962, minor-issue 1662, customer-incident 106,
responsible-delay 1020, overcontrolled 346. Pins after: safe-rollout 934,
minor-issue 1444, customer-incident 389, responsible-delay 1002,
overcontrolled 327.

## v3 Milestone 4

### M4: The engine already supported branching

Branching needed no engine change. applyDecision advances to the chosen
option's nextStepId, which can differ per option; the v2 scenarios simply
gave every option in a step the same nextStepId. Scenario 4 (The Page) uses
distinct nextStepIds at its triage step, so the engine branches with no new
code. Verify now asserts the registry contains a branching scenario and
that The Page branches, so the property cannot regress.

### M4: The Page branch structure

The premise (a production incident pages the player mid-afternoon while
their feature branch is half merged) drives the branch. The first step
routes to one of two distinct next steps: a mitigate-first arm
(after-rollback) or a diagnose-first arm (live-diagnosis), reflecting the
two real schools of incident response. Both arms reconverge at root-cause,
after which the path is linear through the feature-branch decision, the
status call, and the close. Every path is six decisions; the scenario has
seven step definitions because of the two branch arms. Path count is 4096.

### M4: stepCount became decisions-per-path, not step definitions

The registry previously derived stepCount from steps.length, which for a
branching scenario overcounts (The Page has seven step definitions but six
decisions per run). The listing now computes decisions-per-path by walking
the first option at each step to the end, with a cycle guard. All four
scenarios report six decisions, which is what the picker shows. This is the
range-widening the Milestone 1 v2 note anticipated, resolved as an exact
per-path count because every path in these scenarios has the same length.

### M4: Memoized analyzer plus full assertion walk

The playtest now has two parts. analyzeScenario is a memoized walk keyed by
(step, metrics, flags) that returns the path count and outcome
distribution; because a subtree's outcomes depend only on that key and not
on how the state was reached, convergent branches are computed once. This
is the upgrade the v2 weak spots called for and is what reports path
counts. checkAllPaths is a full per-path walk that runs the correctness
assertions (replay fidelity, report coherence, export structure, curation,
missed signals) on every enumerated leaf in all four scenarios. The two are
cross-checked: the memoized path count must equal the number of leaves the
full walk visited, so the fast analyzer cannot silently miss paths. The
whole registry walk is timed and asserted under ten seconds; it runs in
about half a second for the current 19712 paths.

### M4: Composite React keys for decision lists

The v2 weak spot noted that decision lists keyed by stepId assume one
decision per step id per run, which a future revisiting scenario would
break. The timeline, the report timeline, and the strong-decisions list now
key by step id plus position. The Page does not revisit a step within a
path, but the composite key future-proofs the lists and resolves the
flagged item. The replay view navigates frames by index and needed no key
change.

### M4: Scenario 4 incident rate extends the difficulty curve

The Page starts the player inside an active incident (initial risk 40), so
its negative outcome (Prolonged Outage) means a mishandled live incident
rather than an end-of-day consequence of accumulated shortcuts. Left
untuned the incident rate was 25.2 percent, far above the Milestone 3 curve
(2.9, 6.9, 9.5 percent for the first three scenarios). The incident outcome
rule was tightened (bare risk threshold 85, secondary clause requiring
lacks incident-mitigated and shipped-direct and risk at least 70), bringing
it to 14.8 percent. That places The Page above Friday Deploy as the hardest
scenario, extending the curve to 2.9, 6.9, 9.5, 14.8 percent, with all five
outcomes inside the 2 to 45 percent bounds. New scenario, so the pins are
recorded as initial values, not a before-and-after change: safe-rollout
1092, minor-issue 1156, customer-incident 606, responsible-delay 909,
overcontrolled 333.

## v3 Milestone 5

### M5: Hand-written validator, no schema dependency

Scenario validation is a hand-written function in lib/simulator/import.ts,
not a JSON Schema plus a runtime validator library. A schema library would
be a new runtime dependency, which the ground rules discourage, and the
engine's types are the real contract anyway. The validator mirrors those
types, treats all input as untrusted, and collects every problem it can
find rather than failing on the first, so the importer shows a full list.
It checks unknown and missing metric keys, non-string and non-number
fields, duplicate step and option ids, the initial step resolving, option
nextStepId targets existing (or the end sentinel), outcome ids and tones
from the known sets, outcome rules referencing defined outcomes, rule
conditions referencing only flags some option sets, well-formed condition
trees, and the fallback outcome being defined.

### M5: Undefined flag in a rule is a validation error, not just a lint

The milestone lists "outcome rules referencing undefined flags" among the
validator errors. A flag is undefined when no option sets it. Such a
reference is treated as a hard validation error (the importer rejects it),
and the structural lint separately reports the same family of issue as a
warning for built-in scenarios. The two do not conflict: import rejects it
outright, lint surfaces it without blocking.

### M5: Structural lint is static and conservative

lintScenario reports unreachable steps (no path from the initial step
reaches them), flags referenced in rules but set by no option, and outcome
rules that can never fire. The never-fire check is a conservative static
satisfiability test over the condition tree given the settable flags and
the 0 to 100 metric range: it catches a required flag nothing sets,
contradictory metric bounds, and a flag required present and absent in the
same allOf, without claiming to prove general satisfiability. Verify asserts
all four built-in scenarios lint clean.

### M5: SimulatorClient takes a scenario object, not an id

To play an imported scenario that is not in the registry, SimulatorClient
now receives a Scenario object directly instead of a scenario id it looks
up. The route page resolves the id to the registry object and passes it;
the import page passes the validated in-memory object. The reducer closes
over the scenario rather than resolving it from the registry by id, so the
engine path is identical for built-in and imported scenarios. Scenario data
is plain serializable JSON, so passing it from the server component to the
client component is safe.

### M5: Imported scenarios live only in memory

The import page validates in the browser and holds the result in component
state. There is no persistence, no storage API, no upload. Reloading the
page clears it. This keeps the app static and backend-free and avoids
storing untrusted data anywhere. A link from the scenarios page points to
the importer for discoverability.
