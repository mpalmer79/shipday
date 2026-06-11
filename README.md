# ShipDay

A real-life software engineering simulator about shipping safely under pressure.

Each scenario is one simulated workday: ambiguous requirements, failing
tests, stakeholder pressure, a production incident, and a release decision at
the end. Every choice moves your metrics (quality, speed, risk, trust, focus,
test confidence), sets behavioral flags, and feeds a deterministic outcome.
At the end of the day you get a report on how your choices added up, you can
replay the day decision by decision, download the report, and compare two
runs side by side. You can also import your own scenario from JSON.

Fully deterministic. Runs entirely in the browser. No API calls.

## Scenarios

| Scenario | Difficulty | Premise |
|---|---|---|
| Just Add a Button | starter | A one-line ticket touches checkout pricing, an AI suggestion, and a failing test. |
| The Broken Build | intermediate | Main is red, the release is at 3:00 PM, and the likely suspect is out sick. |
| Friday Deploy | advanced | A two-line config change, a 5:00 PM deploy window, and half the team gone. |
| The Page | advanced | Checkout is down, the cause is unclear, and your branch is half merged. |

Pick a scenario at `/scenarios`. The old `/simulator` path redirects to
scenario 1. The Page branches: how you triage the incident changes which
steps you see next.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run verify     # engine assertions + exhaustive playtest of every run
npm run build      # production build
```

## Features

- **Scenario selection** at `/scenarios`, four built-in scenarios with a
  designed difficulty curve (incident rates rise from starter to advanced).
- **Branching scenarios.** The engine advances per-option, so a step's
  options can lead to different next steps. The Page uses this for its
  incident triage.
- **Replay.** Step through a completed run decision by decision, rebuilt
  from the decision trail.
- **Downloadable report** as a self-contained markdown file, generated in
  the browser.
- **Run comparison** at `/compare`. Save two completed runs of the same
  scenario and see the decisions, metric trajectories, and outcomes side by
  side.
- **Scenario import** at `/import`. Paste scenario JSON; it is validated in
  the browser with specific error messages and played from memory. Nothing
  is uploaded or stored.
- **Launch metadata.** Open Graph and Twitter cards, a committed social
  card image, and app icons.

## How it works

- **Scenario data** (`data/scenarios/`) defines the steps, decision options,
  metric impacts, behavioral flags, outcome rules, curated strong decisions,
  and missed-signal copy for each workday. Scenarios share a flag vocabulary
  (`data/scenarios/flags.ts`) and are registered with difficulty and
  decisions-per-path in `data/scenarios/index.ts`.
- **The engine** (`lib/simulator/engine.ts`) is a set of pure functions:
  `createInitialState`, then `applyDecision` per choice, then outcome
  resolution. No randomness, no side effects, so any run is reproducible
  from its decision history. Options advance to a per-option next step,
  which is what makes branching a data change rather than a code change.
- **Outcomes** (`lib/simulator/outcomes.ts`) are resolved by a small
  interpreter over declarative `Condition` trees stored in scenario data.
  Rules are serializable, which is what makes scenario import possible.
- **The report** (`lib/simulator/report.ts`) collects the curated strong
  decisions, the scenario-specific missed signals (with a shared fallback),
  and a staff-level lesson from the completed run.
- **Replay** (`lib/simulator/replay.ts`) rebuilds a completed run from its
  decision trail with a pure function, recomputing every intermediate metric
  snapshot through the engine.
- **Report download** (`lib/simulator/exportReport.ts`) renders the report
  as a self-contained markdown file.
- **Import** (`lib/simulator/import.ts`) validates untrusted scenario JSON
  against the engine types with specific error messages, and lints built-in
  and imported scenarios for unreachable steps, dead flags, and rules that
  can never fire.
- **Comparison** (`lib/simulator/compare.ts`) diffs two runs of the same
  scenario through the replay reconstruction.
- **UI state** is one `useReducer` in
  `components/simulator/SimulatorClient.tsx`; the reducer is a thin shell
  over the engine. Completed runs are held in memory for the session by a
  context provider so two of them can be compared.

Five outcomes are reachable in every scenario: Safe Rollout, Minor
Production Issue, Customer Impact Incident, Responsible Delay, and
Overcontrolled Delivery (each scenario gives them its own titles and copy).
`npm run verify` enumerates every possible run of every scenario (19,712 in
total) with a memoized walk, asserts each outcome is reachable within tuned
distribution bounds, pins the exact distributions against regression,
asserts that replay reproduces every run exactly, lints the registry, checks
that the importer rejects malformed input with specific messages, and checks
the run comparison.

## Project structure

```
app/                  Pages: landing, scenarios, simulator/[scenarioId], import, compare
components/           Layout, simulator, import, compare, and runs-store UI
lib/simulator/        Types, engine, outcomes, report, replay, export, import, compare
data/scenarios/       Scenario content (steps, options, rules, flags)
scripts/              One-off brand-asset generation
docs/DECISIONS.md     Audit trail of build decisions
```

## Roadmap

- [x] v1: one scenario, pure engine, end-of-day report
- [x] v2: scenario selection with three scenarios
- [x] v2: replay mode reconstructing a completed run
- [x] v2: downloadable markdown report
- [x] v3: launch metadata, mobile and accessibility pass
- [x] v3: curated strong decisions and scenario-specific missed signals
- [x] v3: designed difficulty curve
- [x] v3: branching step paths within a scenario
- [x] v3: scenario import from JSON
- [x] v3: side-by-side run comparison
- [ ] conditional consequence text keyed off prior flags

## License

MIT, see [LICENSE](LICENSE).
