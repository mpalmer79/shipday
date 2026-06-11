# ShipDay

A real-life software engineering simulator about shipping safely under pressure.

Each scenario is one simulated workday: ambiguous requirements, failing
tests, a production page, stakeholder pressure, and a release decision at the
end. Every choice moves your metrics (quality, speed, risk, trust, focus,
test confidence), sets behavioral flags, and feeds a deterministic outcome.
At the end of the day you get a report on how your choices added up, you can
replay the day decision by decision, download the report, and compare two
runs side by side. You can also import your own scenario as JSON and play it.

Fully deterministic. Runs entirely in the browser. No API calls, no backend,
no database, no environment variables.

## Scenarios

| Scenario | Difficulty | Premise |
|---|---|---|
| Just Add a Button | starter | A one-line ticket touches checkout pricing, an AI suggestion, and a failing test. |
| The Broken Build | intermediate | Main is red, the release is at 3:00 PM, and the likely suspect is out sick. |
| Friday Deploy | advanced | A two-line config change, a 5:00 PM deploy window, and half the team gone. |
| The Page | expert | A production page lands mid-afternoon while your feature branch is half done. |

Difficulty is a designed curve: the chance of a Customer Impact Incident rises
with each scenario (2.95%, 6.55%, 9.06%, 12.60% across the exhaustive
playtest). The Page is the first branching scenario: the triage choice routes
the rest of the day down a diagnose-first or act-first path that reconverge at
the root cause. On The Page, Safe Rollout requires ending the day with less
risk than it started with and the fix verified, so good triage alone is not
enough.

Pick a scenario at `/scenarios`. The old `/simulator` path redirects to
scenario 1.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run verify     # engine assertions + exhaustive playtest + lint + import + comparison
npm run build      # production build
```

## How it works

- **Scenario data** (`data/scenarios/`) defines the steps, decision options,
  metric impacts, behavioral flags, curated strong-decision markers,
  scenario-specific missed-signal copy, and outcome rules for each workday.
  Scenarios share a flag vocabulary (`data/scenarios/flags.ts`) and are
  registered with difficulty in `data/scenarios/index.ts`.
- **The engine** (`lib/simulator/engine.ts`) is a set of pure functions:
  `createInitialState`, then `applyDecision` per choice, then outcome
  resolution. Steps form a graph through each option's `nextStepId`, so
  scenarios can branch and reconverge. No randomness, no side effects, so any
  run is reproducible from its decision history.
- **Outcomes** (`lib/simulator/outcomes.ts`) are resolved by a small
  interpreter over declarative `Condition` trees stored in scenario data.
  Rules are serializable, which is what makes JSON-imported scenarios work.
- **The report** (`lib/simulator/report.ts`) derives strong decisions (from
  the curated markers, with a heuristic fallback for unmarked scenarios),
  missed signals (scenario-specific copy with a shared fallback), and a
  staff-level lesson from the completed run.
- **Replay** (`lib/simulator/replay.ts`) rebuilds a completed run from its
  decision trail with a pure function, recomputing every intermediate metric
  snapshot through the engine, and handles branching runs.
- **Report download** (`lib/simulator/exportReport.ts`) renders the report as
  a self-contained markdown file, generated in the browser.
- **Validation and lint** (`lib/simulator/validate.ts`, `lib/simulator/lint.ts`)
  turn untrusted JSON into a scenario with specific error messages, and lint
  any scenario for unreachable steps, dead flags, and rules that can never
  fire.
- **Comparison** (`lib/simulator/comparison.ts`) diffs two completed runs of
  the same scenario, derived entirely from the two decision trails through the
  replay reconstruction.
- **Launch metadata** (`lib/site.ts`, `app/icon.svg`, `lib/ogCard.tsx`) wires
  Open Graph and Twitter cards and a favicon through the framework metadata
  API. The card images are PNGs generated at build time by the
  opengraph-image file convention, driven by the scenario registry.
- **UI state** is one `useReducer` in
  `components/simulator/SimulatorClient.tsx`; the reducer is a thin shell over
  the engine, bound to a scenario object so it can play built-in and imported
  scenarios alike. Completed runs are held in memory for the session in
  `lib/runStore.ts` for the comparison view.

Five outcomes are reachable in every scenario: Safe Rollout, Minor Production
Issue, Customer Impact Incident, Responsible Delay, and Overcontrolled
Delivery. `npm run verify` enumerates every possible run of every scenario
(20,736 in total across four scenarios), asserts each outcome is reachable
within tuned distribution bounds, pins the exact distributions against
regression, asserts the incident curve is non-decreasing, checks replay
reproduces every run exactly, lints every built-in scenario, rejects malformed
import input with specific messages, and verifies run comparison.

## Routes

| Route | What it is |
|---|---|
| `/` | Landing page |
| `/scenarios` | Scenario picker |
| `/simulator/[scenarioId]` | Play a scenario |
| `/import` | Paste, validate, and play a scenario from JSON |
| `/compare` | Compare two completed runs side by side |

Every route is static or statically generated. The app deploys to Vercel with
no environment variables, backend, database, or API keys.

## Project structure

```
app/                  Pages: landing, scenarios, simulator, import, compare; metadata and icon
components/           Layout and simulator, import, and compare UI components
lib/simulator/        Types, pure engine, outcomes, report, replay, export, validate, lint, comparison
lib/site.ts           Site metadata helpers
lib/runStore.ts       In-memory store of completed runs for the session
lib/sampleScenario.ts Sample scenario offered on the import page
data/scenarios/       Scenario content (steps, options, rules, flags)
docs/DECISIONS.md     Audit trail of build decisions
```

## Roadmap

- [x] v1: one scenario, pure engine, end-of-day report
- [x] v2: scenario selection with three scenarios
- [x] v2: replay mode reconstructing a completed run
- [x] v2: downloadable markdown report
- [x] v3: launch metadata (Open Graph and Twitter cards, favicon)
- [x] v3: mobile layout and accessibility pass
- [x] v3: branching step paths within a scenario
- [x] v3: scenario import from JSON with validation and a structural lint
- [x] v3: side-by-side comparison of two runs
- [ ] conditional consequence text keyed off prior flags

## License

MIT, see [LICENSE](LICENSE).
