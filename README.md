# ShipDay

A real-life software engineering simulator about shipping safely under pressure.

It's 9:00 AM and the ticket says *"just add a button."* Over one simulated
workday you'll navigate ambiguous requirements, a confident AI code
suggestion, a failing test nobody owns, stakeholder pressure, and a release
decision — and at 5:00 PM you'll see exactly how your choices added up.

Fully deterministic. Runs entirely in the browser. No API calls.

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
  metric impacts, behavioral flags, and outcome rules for a workday.
  Scenario 1 is *Just Add a Button*.
- **The engine** (`lib/simulator/engine.ts`) is a set of pure functions:
  `createInitialState` → `applyDecision` × N → outcome. No randomness, no
  side effects, so any run is reproducible from its decision history.
- **Outcomes** (`lib/simulator/outcomes.ts`) are resolved by a small
  interpreter over declarative `Condition` trees stored in scenario data —
  rules are serializable, which keeps the door open for JSON-imported
  scenarios later.
- **The report** (`lib/simulator/report.ts`) derives strong decisions,
  missed signals, and a staff-level lesson from the completed run.
- **UI state** is one `useReducer` in `app/simulator/page.tsx`; the reducer
  is a thin shell over the engine.

Five outcomes are reachable: Safe Rollout, Minor Production Issue,
Customer Impact Incident, Responsible Delay, and Overcontrolled Delivery.
`npm run verify` enumerates all 5,120 possible runs and asserts each
outcome has at least one natural path.

## Project structure

```
app/                  Next.js App Router pages
components/           Layout and simulator UI components
lib/simulator/        Types, pure engine, outcome resolver, report
data/scenarios/       Scenario content (steps, options, rules, flags)
```

## License

MIT — see [LICENSE](LICENSE).
