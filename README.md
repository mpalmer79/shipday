# ShipDay

A real-life software engineering simulator about shipping safely under pressure.

Each scenario is one simulated workday: ambiguous requirements, failing
tests, a production page, stakeholder pressure, and a release decision at the
end. Every choice moves your metrics (quality, speed, risk, trust, focus,
test confidence), sets behavioral flags, and feeds a deterministic outcome.
Consequence text can react to what you did earlier in the day, so the same
choice reads differently after a careful morning than after a reckless one.
At the end of the day you get a report on how your choices added up, you can
replay the day decision by decision, download the report, compare two runs
side by side, and copy a link that rebuilds the whole run for anyone you send
it to. You can import a scenario as JSON and play it, or build one in the
authoring studio with live validation and a distribution preview.

Fully deterministic. Runs entirely in the browser. No API calls, no backend,
no database, no environment variables.

## Scenarios

| Scenario | Difficulty | Premise |
|---|---|---|
| Just Add a Button | starter | A one-line ticket touches checkout pricing, an AI suggestion, and a failing test. |
| The Broken Build | intermediate | Main is red, the release is at 3:00 PM, and the likely suspect is out sick. |
| The Missing Requirement | intermediate | The feature is approved and ready to merge when a stakeholder mentions the constraint nobody wrote down. |
| Friday Deploy | advanced | A two-line config change, a 5:00 PM deploy window, and half the team gone. |
| The Page | expert | A production page lands mid-afternoon while your feature branch is half done. |

Difficulty is a designed curve: the chance of a Customer Impact Incident rises
with each scenario (2.95%, 6.55%, 8.23%, 9.06%, 12.60% across the exhaustive
playtest). The Page and The Missing Requirement branch mid-day: an early
choice routes the rest of the day down one of two paths that reconverge
before the end. On The Page, Safe Rollout requires ending the day with less
risk than it started with and the fix verified, so good triage alone is not
enough. The Missing Requirement was authored through the studio's JSON
pipeline and tuned with the distribution preview before being committed as a
built-in.

Pick a scenario at `/scenarios`. The old `/simulator` path redirects to
scenario 1.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run verify     # engine assertions + exhaustive playtest + lint + import + run codes + studio round trips
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
- **Conditional consequences**: an option's consequence text can carry an
  ordered list of overrides, each pairing a `Condition` with alternative
  text. The engine resolves the text at decision time against the state
  before the decision applies and stores it in the decision record, so the
  report, replay, and comparison all show exactly what the player saw.
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
- **Shareable runs** (`lib/simulator/runCode.ts`, `lib/runLink.ts`) encode a
  completed run as `v1.<scenarioId>.<optionId>...`, a version token plus the
  decision trail. The `/run` page rebuilds the run from the code through the
  pure replay, treating the code as untrusted input with specific errors for
  anything malformed. Links carry only the scenario id, so only built-in
  scenarios travel.
- **Report download** (`lib/simulator/exportReport.ts`) renders the report as
  a self-contained markdown file, generated in the browser.
- **Validation and lint** (`lib/simulator/validate.ts`, `lib/simulator/lint.ts`)
  turn untrusted JSON into a scenario with specific error messages, and lint
  any scenario for unreachable steps, dead flags, and rules or consequence
  overrides that can never fire.
- **The studio** (`/studio`, `components/studio/`, `lib/studio.ts`) edits a
  scenario draft with plain form controls: steps, options with impacts and
  flags and conditional consequences, outcomes, and outcome rules. The draft
  runs through the validator and lint on every change, with messages routed
  to the structure they describe. Drafts load from and export to the same
  JSON the import page accepts, and play in the simulator in memory. The
  draft lives in component state only; export is the persistence story.
- **The distribution preview** (`lib/simulator/distribution.ts`) is the
  exhaustive playtest walk, shared between the verify script and a web
  worker behind the studio's preview panel, so there is exactly one walk
  implementation. Up to 100,000 structural paths the preview is exact; above
  that it draws a seeded 20,000-run sample, uniform over paths, and labels
  the result as sampled. The 2 to 45 percent band renders as advisory
  guidance.
- **Comparison** (`lib/simulator/comparison.ts`) diffs two completed runs of
  the same scenario, derived entirely from the two decision trails through the
  replay reconstruction. The compare page can also load a run from a pasted
  link, so two people can compare days.
- **Launch metadata** (`lib/site.ts`, `app/icon.svg`, `lib/ogCard.tsx`) wires
  Open Graph and Twitter cards and a favicon through the framework metadata
  API. The card images are PNGs generated at build time by the
  opengraph-image file convention, driven by the scenario registry.
- **UI state** is one `useReducer` in
  `components/simulator/SimulatorClient.tsx`; the reducer is a thin shell over
  the engine, bound to a scenario object so it can play built-in, imported,
  and studio-draft scenarios alike. Completed runs are held in memory for the
  session in `lib/runStore.ts` for the comparison view.

Five outcomes are reachable in every scenario: Safe Rollout, Minor Production
Issue, Customer Impact Incident, Responsible Delay, and Overcontrolled
Delivery. `npm run verify` enumerates every possible run of every scenario
(24,832 in total across five scenarios), asserts each outcome is reachable
within tuned distribution bounds, pins the exact distributions against
regression, asserts the incident curve is non-decreasing, checks replay and
the run-code round trip reproduce every run exactly, verifies conditional
consequence resolution against constructed cases, lints every built-in
scenario, rejects malformed import input and malformed run codes with
specific messages, round-trips every built-in through the studio's load and
export without loss, and asserts the distribution preview matches the walk
exactly (including the sampled path above the ceiling).

## Routes

| Route | What it is |
|---|---|
| `/` | Landing page |
| `/scenarios` | Scenario picker |
| `/simulator/[scenarioId]` | Play a scenario |
| `/run` | A completed run rebuilt from a shared link |
| `/import` | Paste, validate, and play a scenario from JSON |
| `/studio` | Build and tune a scenario with forms, live validation, and a distribution preview |
| `/compare` | Compare two completed runs side by side, including runs loaded from links |

Every route is static or statically generated. The app deploys to Vercel with
no environment variables, backend, database, or API keys.

## Project structure

```
app/                  Pages: landing, scenarios, simulator, run, import, studio, compare; metadata and icon
components/           Layout, simulator, run, import, studio, and compare UI components
lib/simulator/        Types, pure engine, outcomes, report, replay, export, validate, lint, comparison, run codes, distribution
lib/site.ts           Site metadata helpers
lib/runStore.ts       In-memory store of completed runs for the session
lib/runLink.ts        Run link parsing and registry resolution
lib/studio.ts         Studio draft load and export, issue routing
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
- [x] v4: conditional consequence text keyed off prior flags
- [x] v4: shareable run links with a static run page
- [x] v4: authoring studio with live validation and JSON round trips
- [x] v4: live outcome distribution preview in a web worker
- [x] v4: a fifth scenario authored through the studio pipeline
- [ ] studio: duplicate and reorder steps and options
- [ ] studio: suggest the draft's existing flags instead of free-text only
- [ ] distribution preview: show an example decision trail per outcome

## License

MIT, see [LICENSE](LICENSE).
