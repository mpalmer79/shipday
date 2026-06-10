# ShipDay

A real-life software engineering simulator about shipping safely under pressure.

Each scenario is one simulated workday: ambiguous requirements, failing
tests, stakeholder pressure, and a release decision at the end. Every choice
moves your metrics (quality, speed, risk, trust, focus, test confidence),
sets behavioral flags, and feeds a deterministic outcome. At the end of the
day you get a report on how your choices added up, you can replay the day
decision by decision, and you can download the report as a file.

Fully deterministic. Runs entirely in the browser. No API calls.

## Scenarios

| Scenario | Difficulty | Premise |
|---|---|---|
| Just Add a Button | starter | A one-line ticket touches checkout pricing, an AI suggestion, and a failing test. |
| The Broken Build | intermediate | Main is red, the release is at 3:00 PM, and the likely suspect is out sick. |
| Friday Deploy | advanced | A two-line config change, a 5:00 PM deploy window, and half the team gone. |

Pick a scenario at `/scenarios`. The old `/simulator` path redirects to
scenario 1.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run verify     # engine assertions + exhaustive playtest of every run
npm run build      # production build
```

## How it works

- **Scenario data** (`data/scenarios/`) defines the steps, decision options,
  metric impacts, behavioral flags, and outcome rules for each workday.
  Scenarios share a flag vocabulary (`data/scenarios/flags.ts`) and are
  registered with difficulty and step count in `data/scenarios/index.ts`.
- **The engine** (`lib/simulator/engine.ts`) is a set of pure functions:
  `createInitialState`, then `applyDecision` per choice, then outcome
  resolution. No randomness, no side effects, so any run is reproducible
  from its decision history.
- **Outcomes** (`lib/simulator/outcomes.ts`) are resolved by a small
  interpreter over declarative `Condition` trees stored in scenario data.
  Rules are serializable, which keeps the door open for JSON-imported
  scenarios later.
- **The report** (`lib/simulator/report.ts`) derives strong decisions,
  missed signals, and a staff-level lesson from the completed run.
- **Replay** (`lib/simulator/replay.ts`) rebuilds a completed run from its
  decision trail with a pure function, recomputing every intermediate
  metric snapshot through the engine. The replay view steps through each
  decision: the situation, the option chosen, the options not taken, the
  metric deltas, and the consequence.
- **Report download** (`lib/simulator/exportReport.ts`) renders the report
  as a self-contained markdown file, generated in the browser from
  in-memory state.
- **UI state** is one `useReducer` in
  `components/simulator/SimulatorClient.tsx`; the reducer is a thin shell
  over the engine.

Five outcomes are reachable in every scenario: Safe Rollout, Minor
Production Issue, Customer Impact Incident, Responsible Delay, and
Overcontrolled Delivery. `npm run verify` enumerates every possible run of
every scenario (15,616 in total), asserts each outcome is reachable within
tuned distribution bounds, pins the exact distributions against regression,
and asserts that replay reproduces every run exactly.

## Project structure

```
app/                  Pages: landing, /scenarios, /simulator/[scenarioId]
components/           Layout and simulator UI components
lib/simulator/        Types, pure engine, outcomes, report, replay, export
data/scenarios/       Scenario content (steps, options, rules, flags)
docs/DECISIONS.md     Audit trail of build decisions
```

## Roadmap

- [x] v1: one scenario, pure engine, end-of-day report
- [x] v2: scenario selection with three scenarios
- [x] v2: replay mode reconstructing a completed run
- [x] v2: downloadable markdown report
- [ ] v3: branching step paths within a scenario
- [ ] v3: conditional consequence text keyed off prior flags
- [ ] v3: scenario import from JSON

## License

MIT, see [LICENSE](LICENSE).
