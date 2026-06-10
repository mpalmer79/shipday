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
