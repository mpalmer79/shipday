/**
 * Build-time verification for the simulator engine and all scenario data.
 * Run with: npm run verify
 *
 * Plain assertions, no test framework. Three phases:
 *  1. Unit-style assertions on the engine, resolver, and report,
 *     exercised against scenario 1.
 *  2. Data integrity checks for every registered scenario.
 *  3. Exhaustive playtest: every possible run of every scenario is
 *     enumerated to prove all five outcomes are reachable, that the
 *     distribution stays inside tuning bounds (no outcome above 45
 *     percent or below 2 percent), and to print distributions.
 */
import assert from "node:assert/strict";
import { scenarios } from "../../../data/scenarios";
import {
  applyDecision,
  createInitialState,
  getCurrentStep,
  SimulatorError,
} from "../engine";
import { generateReport } from "../report";
import { reconstructRun } from "../replay";
import { reportFilename, reportToMarkdown } from "../exportReport";
import { lintScenario } from "../lint";
import { parseScenarioJson, validateScenario, OUTCOME_IDS } from "../validate";
import { compareRuns } from "../comparison";
import { METRIC_ORDER } from "../metrics";
import type { OutcomeId, Scenario, SimulatorState } from "../types";
import { END_STEP_ID } from "../types";

const MAX_OUTCOME_SHARE = 0.45;
const MIN_OUTCOME_SHARE = 0.02;

/**
 * Pinned distributions. Tuned scenarios are frozen here so later changes
 * cannot silently shift their balance. A deliberate retune must update
 * these counts and the decision log together.
 */
const EXPECTED_DISTRIBUTIONS: Record<
  string,
  Partial<Record<OutcomeId, number>>
> = {
  "just-add-a-button": {
    "safe-rollout": 998,
    "minor-issue": 2058,
    "customer-incident": 151,
    "responsible-delay": 1263,
    overcontrolled: 650,
  },
  "the-broken-build": {
    "safe-rollout": 951,
    "minor-issue": 2755,
    "customer-incident": 419,
    "responsible-delay": 1545,
    overcontrolled: 730,
  },
  "friday-deploy": {
    "safe-rollout": 934,
    "minor-issue": 1458,
    "customer-incident": 371,
    "responsible-delay": 1005,
    overcontrolled: 328,
  },
  "the-page": {
    "safe-rollout": 1682,
    "minor-issue": 1452,
    "customer-incident": 645,
    "responsible-delay": 942,
    overcontrolled: 399,
  },
};

// --- Phase 1: engine assertions (against scenario 1) ------------------

const scenario1 = scenarios.find((s) => s.id === "just-add-a-button")!;
assert.ok(scenario1, "scenario 1 must be registered");

{
  const state = createInitialState(scenario1);
  assert.equal(state.currentStepId, "ticket-assigned");
  assert.equal(state.completed, false);
  assert.deepEqual(state.metrics, scenario1.initialMetrics);
  assert.notEqual(
    state.metrics,
    scenario1.initialMetrics,
    "metrics must be copied"
  );

  // Invalid option throws a typed error.
  assert.throws(() => applyDecision(scenario1, state, "nope"), SimulatorError);

  // applyDecision is pure: input state is untouched.
  const next = applyDecision(scenario1, state, "ask-questions");
  assert.equal(state.decisions.length, 0);
  assert.equal(state.metrics.trust, 60);
  assert.equal(next.decisions.length, 1);
  assert.equal(next.metrics.trust, 65);
  assert.equal(next.metrics.speed, 45);
  assert.ok(next.flags.includes("asked-clarifying-questions"));
  assert.equal(next.currentStepId, "requirements-unclear");

  // Decision records carry time and title for the timeline.
  assert.equal(next.decisions[0].stepTime, "9:00 AM");
  assert.equal(next.decisions[0].stepTitle, "The ticket arrives");

  // Flags never duplicate.
  const again = applyDecision(scenario1, next, "ask-product");
  assert.equal(
    again.flags.filter((f) => f === "asked-clarifying-questions").length,
    1
  );

  // Metrics clamp to [0, 100].
  const clampProbe: SimulatorState = {
    ...state,
    metrics: { ...state.metrics, risk: 95, speed: 3 },
  };
  const clamped = applyDecision(scenario1, clampProbe, "start-coding");
  assert.equal(clamped.metrics.risk, 100);
  assert.equal(clamped.metrics.speed, 13);

  // Report refuses incomplete runs.
  assert.throws(() => generateReport(scenario1, state));
}

// --- Phase 2: data integrity for every scenario ----------------------

for (const scenario of scenarios) {
  const stepIds = new Set(scenario.steps.map((s) => s.id));
  assert.equal(
    stepIds.size,
    scenario.steps.length,
    `Duplicate step ids in ${scenario.id}`
  );
  assert.ok(
    stepIds.has(scenario.initialStepId),
    `Initial step missing in ${scenario.id}`
  );
  for (const step of scenario.steps) {
    assert.ok(
      step.options.length >= 4 && step.options.length <= 5,
      `Step ${scenario.id}/${step.id} must have 4 or 5 options`
    );
    const optionIds = new Set(step.options.map((o) => o.id));
    assert.equal(
      optionIds.size,
      step.options.length,
      `Duplicate option ids in ${scenario.id}/${step.id}`
    );
    for (const option of step.options) {
      assert.ok(
        option.nextStepId === END_STEP_ID || stepIds.has(option.nextStepId),
        `Dangling nextStepId "${option.nextStepId}" in ${scenario.id}/${step.id}/${option.id}`
      );
    }
  }
  // Copy rules: no em dashes, no marketing vocabulary, anywhere in the
  // scenario's strings (narratives, options, consequences, lessons,
  // outcomes, snippets, signals).
  const serialized = JSON.stringify(scenario);
  assert.ok(
    !serialized.includes("\u2014"),
    `Em dash found in ${scenario.id} copy`
  );
  for (const banned of [
    "seamless",
    "robust",
    "delve",
    "leverage",
    "elevate",
    "supercharge",
    "game-changing",
  ]) {
    assert.ok(
      !serialized.toLowerCase().includes(banned),
      `Banned word "${banned}" found in ${scenario.id} copy`
    );
  }

  const outcomeIds = new Set(scenario.outcomes.map((o) => o.id));
  assert.equal(outcomeIds.size, 5, `${scenario.id} must define 5 outcomes`);
  for (const rule of scenario.outcomeRules) {
    assert.ok(
      outcomeIds.has(rule.outcomeId),
      `Rule references unknown outcome in ${scenario.id}`
    );
  }
  assert.ok(outcomeIds.has(scenario.fallbackOutcomeId));

  // Structural lint: every built-in scenario must be clean.
  const lintProblems = lintScenario(scenario);
  assert.equal(
    lintProblems.length,
    0,
    `Lint problems in ${scenario.id}: ${lintProblems.join("; ")}`
  );
}

// --- Phase 3: exhaustive playtest per scenario ------------------------

const EXPORT_DATE = new Date("2026-01-01T00:00:00Z");

{
  // Filename is stable and filesystem-safe.
  const name = reportFilename(scenarios[0], EXPORT_DATE);
  assert.equal(name, "shipday-just-add-a-button-2026-01-01.md");
}

export type Distribution = {
  totalRuns: number;
  counts: Map<OutcomeId, number>;
};

/**
 * Number of distinct complete runs through a scenario, computed by
 * memoizing the path count from each step. This is purely structural (it
 * does not depend on metrics or flags), so it stays linear in the graph
 * even when paths reconverge, and it cross-checks the brute-force walk
 * below. Throws on a cycle, which would make the count unbounded.
 */
function countPaths(scenario: Scenario): number {
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  function from(stepId: string): number {
    if (stepId === END_STEP_ID) {
      return 1;
    }
    const cached = memo.get(stepId);
    if (cached !== undefined) {
      return cached;
    }
    assert.ok(
      !visiting.has(stepId),
      `Cycle through step "${stepId}" in ${scenario.id}`
    );
    visiting.add(stepId);
    const step = scenario.steps.find((s) => s.id === stepId);
    assert.ok(step, `Unknown step "${stepId}" in ${scenario.id}`);
    let total = 0;
    for (const option of step.options) {
      total += from(option.nextStepId);
    }
    visiting.delete(stepId);
    memo.set(stepId, total);
    return total;
  }

  return from(scenario.initialStepId);
}

function enumerateRuns(scenario: Scenario): Distribution {
  const counts = new Map<OutcomeId, number>();
  let totalRuns = 0;

  const curated = scenario.steps.some((step) =>
    step.options.some((option) => option.strong !== undefined)
  );

  function walk(state: SimulatorState): void {
    if (state.completed) {
      totalRuns += 1;
      assert.ok(state.outcomeId, "completed run must have an outcome");
      counts.set(state.outcomeId!, (counts.get(state.outcomeId!) ?? 0) + 1);
      // Every completed run must produce a coherent report.
      const report = generateReport(scenario, state);
      assert.equal(report.timeline.length, state.decisions.length);
      assert.ok(report.staffLevelLesson.length > 0);
      // Curated scenarios surface exactly their marked strong decisions.
      if (curated) {
        const marked = state.decisions.filter((d) => d.strong === true).length;
        assert.equal(
          report.strongDecisions.length,
          marked,
          `Strong decision count mismatch in ${scenario.id}`
        );
        assert.ok(
          report.strongDecisions.every((d) => d.strong === true),
          `Uncurated decision surfaced as strong in ${scenario.id}`
        );
      }
      // Replaying the decision trail must reproduce the run exactly.
      const replay = reconstructRun(scenario, state.decisions);
      assert.deepEqual(replay.finalState.metrics, state.metrics);
      assert.equal(replay.finalState.outcomeId, state.outcomeId);
      assert.equal(replay.finalState.completed, true);
      assert.equal(replay.frames.length, state.decisions.length);
      assert.deepEqual(
        replay.frames[replay.frames.length - 1].metricsAfter,
        state.metrics
      );
      // The exported report must carry every required section.
      const markdown = reportToMarkdown(scenario, report, EXPORT_DATE);
      assert.ok(markdown.includes(`# ShipDay report: ${scenario.name}`));
      assert.ok(markdown.includes(`Outcome: ${report.outcome.title}`));
      assert.ok(markdown.includes("## Final metrics"));
      assert.ok(markdown.includes("## How the day unfolded"));
      assert.ok(markdown.includes("## The staff-level lesson"));
      assert.ok(
        !markdown.includes("\u2014"),
        "exported report must not contain em dashes"
      );
      assert.equal(
        (markdown.match(/^### /gm) ?? []).length,
        state.decisions.length,
        "one timeline section per decision"
      );
      return;
    }
    const step = getCurrentStep(scenario, state);
    for (const option of step.options) {
      walk(applyDecision(scenario, state, option.id));
    }
  }

  walk(createInitialState(scenario));
  return { totalRuns, counts };
}

/**
 * Incident rate per scenario in registry order. The registry order is the
 * difficulty order, and Milestone 3 designs the incident rate to rise with
 * difficulty, so this sequence must be non-decreasing.
 */
// Branching support must stay exercised: at least one scenario routes
// different options to different next steps.
const branchingScenarios = scenarios.filter((scenario) =>
  scenario.steps.some(
    (step) => new Set(step.options.map((o) => o.nextStepId)).size > 1
  )
);
assert.ok(
  branchingScenarios.length > 0,
  "expected at least one branching scenario in the registry"
);

const incidentCurve: { id: string; share: number }[] = [];

const WALK_BUDGET_MS = 10_000;
const walkStart = Date.now();

for (const scenario of scenarios) {
  // Memoized structural path count, cross-checked against the brute walk.
  const pathCount = countPaths(scenario);
  const { totalRuns, counts } = enumerateRuns(scenario);
  assert.equal(
    totalRuns,
    pathCount,
    `Walk visited ${totalRuns} runs but the path count is ${pathCount} in ${scenario.id}`
  );

  incidentCurve.push({
    id: scenario.id,
    share: (counts.get("customer-incident") ?? 0) / totalRuns,
  });

  console.log(`\n${scenario.name}: ${totalRuns} distinct runs (${pathCount} paths)`);
  for (const outcome of scenario.outcomes) {
    const n = counts.get(outcome.id) ?? 0;
    const pct = ((n / totalRuns) * 100).toFixed(1);
    console.log(
      `  ${outcome.title.padEnd(28)} ${String(n).padStart(5)}  (${pct}%)`
    );
  }

  for (const outcome of scenario.outcomes) {
    const n = counts.get(outcome.id) ?? 0;
    assert.ok(n > 0, `Outcome "${outcome.id}" unreachable in ${scenario.id}`);
    const share = n / totalRuns;
    assert.ok(
      share <= MAX_OUTCOME_SHARE,
      `Outcome "${outcome.id}" exceeds ${MAX_OUTCOME_SHARE * 100}% in ${scenario.id}: ${(share * 100).toFixed(1)}%`
    );
    assert.ok(
      share >= MIN_OUTCOME_SHARE,
      `Outcome "${outcome.id}" below ${MIN_OUTCOME_SHARE * 100}% in ${scenario.id}: ${(share * 100).toFixed(1)}%`
    );
  }

  const expected = EXPECTED_DISTRIBUTIONS[scenario.id];
  if (expected) {
    for (const [outcomeId, expectedCount] of Object.entries(expected)) {
      assert.equal(
        counts.get(outcomeId as OutcomeId) ?? 0,
        expectedCount,
        `Distribution regression in ${scenario.id}: ${outcomeId}`
      );
    }
  }
}

const walkElapsed = Date.now() - walkStart;
assert.ok(
  walkElapsed < WALK_BUDGET_MS,
  `Registry walk took ${walkElapsed}ms, over the ${WALK_BUDGET_MS}ms budget`
);
console.log(`\nFull registry walk: ${walkElapsed}ms`);

// The designed difficulty curve: incident rate rises with difficulty.
for (let i = 1; i < incidentCurve.length; i += 1) {
  const prev = incidentCurve[i - 1];
  const curr = incidentCurve[i];
  assert.ok(
    curr.share >= prev.share,
    `Incident curve not monotonic: ${curr.id} (${(curr.share * 100).toFixed(2)}%) is below ${prev.id} (${(prev.share * 100).toFixed(2)}%)`
  );
}
console.log(
  `\nIncident curve: ${incidentCurve
    .map((s) => `${(s.share * 100).toFixed(2)}%`)
    .join(" -> ")}`
);

// --- Phase 4: scenario import validator ------------------------------

{
  // A real scenario round-trips through the validator and plays to an end.
  const valid = parseScenarioJson(JSON.stringify(scenario1));
  assert.ok(valid.ok, "a built-in scenario must validate as JSON");
  if (valid.ok) {
    let state = createInitialState(valid.scenario);
    while (!state.completed) {
      const step = getCurrentStep(valid.scenario, state);
      state = applyDecision(valid.scenario, state, step.options[0].id);
    }
    assert.ok(
      OUTCOME_IDS.includes(state.outcomeId!),
      "a validated scenario must play to a known outcome"
    );
  }

  // The validator rejects malformed input with specific messages. Each case
  // mutates a clone of a valid scenario to break exactly one thing.
  const clone = () => JSON.parse(JSON.stringify(scenario1));
  const rejections: { name: string; input: unknown; expect: string }[] = [];

  rejections.push({
    name: "not an object",
    input: "this is not a scenario",
    expect: "must be a JSON object",
  });

  {
    const s = clone();
    delete s.steps;
    rejections.push({
      name: "missing steps",
      input: s,
      expect: "steps must be a non-empty array",
    });
  }

  {
    const s = clone();
    s.initialMetrics.energy = 5;
    rejections.push({
      name: "unknown metric key",
      input: s,
      expect: 'unknown metric key "energy"',
    });
  }

  {
    const s = clone();
    s.steps[0].options[0].nextStepId = "nowhere";
    rejections.push({
      name: "dangling nextStepId",
      input: s,
      expect: 'points at unknown step "nowhere"',
    });
  }

  {
    const s = clone();
    s.initialStepId = "missing-step";
    rejections.push({
      name: "bad initialStepId",
      input: s,
      expect: 'initialStepId "missing-step" does not match any step',
    });
  }

  {
    const s = clone();
    s.steps[1].id = s.steps[0].id;
    rejections.push({
      name: "duplicate step id",
      input: s,
      expect: "is a duplicate step id",
    });
  }

  {
    const s = clone();
    s.outcomeRules.push({
      outcomeId: "minor-issue",
      priority: 99,
      when: { kind: "hasFlag", flag: "never-set-flag" },
    });
    rejections.push({
      name: "rule references undefined flag",
      input: s,
      expect: 'flag "never-set-flag" that no option ever sets',
    });
  }

  {
    const s = clone();
    s.outcomeRules[0].when = { kind: "frobnicate" };
    rejections.push({
      name: "malformed condition kind",
      input: s,
      expect: 'unknown condition kind "frobnicate"',
    });
  }

  {
    const s = clone();
    s.outcomes[0].tone = "spicy";
    rejections.push({
      name: "invalid tone",
      input: s,
      expect: "tone must be one of",
    });
  }

  {
    const s = clone();
    s.steps[0].options[0].impact.energy = 3;
    rejections.push({
      name: "impact unknown metric",
      input: s,
      expect: 'unknown metric key "energy"',
    });
  }

  {
    const s = clone();
    s.outcomes = s.outcomes.filter(
      (o: { id: string }) => o.id !== "customer-incident"
    );
    rejections.push({
      name: "rule outcome has no matching outcome",
      input: s,
      expect: 'outcomeId "customer-incident" has no matching outcome',
    });
  }

  assert.ok(
    rejections.length >= 8,
    "expected at least 8 malformed-input rejection cases"
  );

  for (const { name, input, expect } of rejections) {
    const result = validateScenario(input);
    assert.equal(result.ok, false, `expected rejection for: ${name}`);
    if (!result.ok) {
      assert.ok(
        result.errors.some((e) => e.includes(expect)),
        `rejection "${name}" should report "${expect}"; got: ${result.errors.join(" | ")}`
      );
    }
  }

  console.log(
    `\nImport validator: ${rejections.length} malformed inputs rejected with specific messages.`
  );
}

// --- Phase 5: run comparison -----------------------------------------

{
  // Play a scenario along a chosen sequence of option ids to completion.
  function play(scenario: Scenario, optionIds: string[]): SimulatorState {
    let state = createInitialState(scenario);
    for (const optionId of optionIds) {
      state = applyDecision(scenario, state, optionId);
    }
    assert.ok(state.completed, "play sequence must finish the scenario");
    return state;
  }

  // Comparing a run against itself yields zero differences, for every
  // scenario, including the branching one.
  for (const scenario of scenarios) {
    let state = createInitialState(scenario);
    while (!state.completed) {
      const step = getCurrentStep(scenario, state);
      state = applyDecision(scenario, state, step.options[0].id);
    }
    const self = compareRuns(scenario, state.decisions, state.decisions);
    assert.equal(
      self.decisionDifferences,
      0,
      `self-comparison must have zero decision differences in ${scenario.id}`
    );
    assert.ok(
      self.steps.every((s) => s.sameChoice),
      `self-comparison steps must all match in ${scenario.id}`
    );
    for (const metric of METRIC_ORDER) {
      assert.equal(
        self.metricDifferences[metric],
        0,
        `self-comparison metric ${metric} must be zero in ${scenario.id}`
      );
    }
  }

  // Two known runs of scenario 1: a careful line and a reckless line. They
  // differ on every decision, and the metric deltas match the two runs'
  // independently computed final metrics exactly.
  const careful = play(scenario1, [
    "ask-questions",
    "ask-product",
    "review-line-by-line",
    "investigate-test",
    "feature-flag",
    "flagged-staged",
  ]);
  const reckless = play(scenario1, [
    "start-coding",
    "assume-stacking",
    "accept-as-is",
    "delete-test",
    "ship-today",
    "full-release",
  ]);

  const cmp = compareRuns(scenario1, careful.decisions, reckless.decisions);
  assert.equal(
    cmp.decisionDifferences,
    6,
    "the careful and reckless lines differ on all six decisions"
  );
  for (const metric of METRIC_ORDER) {
    assert.equal(
      cmp.metricDifferences[metric],
      careful.metrics[metric] - reckless.metrics[metric],
      `metric delta for ${metric} must match the two final states`
    );
  }
  assert.equal(cmp.finalA.outcomeId, careful.outcomeId);
  assert.equal(cmp.finalB.outcomeId, reckless.outcomeId);
  // The trajectory has one point per step plus the start.
  assert.equal(cmp.trajectory.length, careful.decisions.length + 1);

  // A branching pair on scenario 4 diverges at triage and stays diverged.
  const thePage = scenarios.find((s) => s.id === "the-page")!;
  const viaDiagnose = play(thePage, [
    "stash-and-ack",
    "read-dashboards",
    "find-shared-dep",
    "pin-library",
    "canary-the-fix",
    "write-timeline",
  ]);
  const viaRollback = play(thePage, [
    "stash-and-ack",
    "rollback-last-deploy",
    "explain-to-team",
    "pin-library",
    "canary-the-fix",
    "write-timeline",
  ]);
  const branchCmp = compareRuns(
    thePage,
    viaDiagnose.decisions,
    viaRollback.decisions
  );
  assert.ok(
    branchCmp.decisionDifferences > 0,
    "the branching pair must differ"
  );
  assert.equal(
    branchCmp.steps[1].sameChoice,
    false,
    "the triage step diverges between the two paths"
  );
  assert.notEqual(
    branchCmp.steps[2].a?.stepId,
    branchCmp.steps[2].b?.stepId,
    "the two paths visit different steps after triage"
  );

  console.log("\nRun comparison: self-compare and known-pair deltas verified.");
}

console.log("\nAll verification checks passed.");
