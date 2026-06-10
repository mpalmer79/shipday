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
