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
import { decodeRunCode, encodeRun, playRunCode } from "../runCode";
import { extractRunCode, loadRunFromCode } from "../../runLink";
import {
  exportDraft,
  lintTarget,
  loadDraft,
  validationTarget,
} from "../../studio";
import { METRIC_ORDER } from "../metrics";
import { SAMPLE_SCENARIO } from "../../sampleScenario";
import type { OutcomeId, Scenario, SimulatorState } from "../types";
import { END_STEP_ID } from "../types";

const BANNED_WORDS = [
  "seamless",
  "robust",
  "delve",
  "leverage",
  "elevate",
  "supercharge",
  "game-changing",
];

function assertCleanCopy(text: string, where: string): void {
  assert.ok(!text.includes("\u2014"), `Em dash found in ${where}`);
  for (const banned of BANNED_WORDS) {
    assert.ok(
      !text.toLowerCase().includes(banned),
      `Banned word "${banned}" found in ${where}`
    );
  }
}

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
    "safe-rollout": 1035,
    "minor-issue": 2099,
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

  // Every built-in scenario carries at least three conditional consequences.
  const overrideCount = scenario.steps.reduce(
    (total, step) =>
      total +
      step.options.reduce(
        (n, option) => n + (option.consequenceOverrides?.length ?? 0),
        0
      ),
    0
  );
  assert.ok(
    overrideCount >= 3,
    `${scenario.id} must carry at least 3 consequence overrides, has ${overrideCount}`
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
      // Replaying the decision trail must reproduce the run exactly,
      // including each decision's resolved consequence text.
      const replay = reconstructRun(scenario, state.decisions);
      assert.deepEqual(replay.finalState.metrics, state.metrics);
      assert.equal(replay.finalState.outcomeId, state.outcomeId);
      assert.equal(replay.finalState.completed, true);
      assert.equal(replay.frames.length, state.decisions.length);
      replay.frames.forEach((frame, i) => {
        assert.equal(
          frame.consequence,
          state.decisions[i].consequence,
          `replayed consequence diverges at decision ${i} in ${scenario.id}`
        );
      });
      // Run-link round trip: encode, decode, and replay through the code
      // path must reproduce the exact trail, final metrics, and outcome.
      const trail = state.decisions.map((d) => d.optionId);
      const decoded = decodeRunCode(encodeRun(scenario.id, trail));
      assert.ok(decoded.ok, `run code must decode in ${scenario.id}`);
      if (decoded.ok) {
        assert.equal(decoded.scenarioId, scenario.id);
        assert.deepEqual(decoded.optionIds, trail);
        const played = playRunCode(scenario, decoded.optionIds);
        assert.ok(played.ok, `decoded run must play in ${scenario.id}`);
        if (played.ok) {
          assert.deepEqual(played.state.metrics, state.metrics);
          assert.equal(played.state.outcomeId, state.outcomeId);
          assert.deepEqual(
            played.state.decisions.map((d) => d.optionId),
            trail
          );
        }
      }
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

  {
    const s = clone();
    s.steps[0].options[0].consequenceOverrides = "not-an-array";
    rejections.push({
      name: "overrides not an array",
      input: s,
      expect: "consequenceOverrides must be an array of overrides",
    });
  }

  {
    const s = clone();
    s.steps[0].options[0].consequenceOverrides = [
      { when: { kind: "hasFlag", flag: "skipped-validation" } },
    ];
    rejections.push({
      name: "override missing text",
      input: s,
      expect: "consequenceOverrides[0].text must be a non-empty string",
    });
  }

  {
    const s = clone();
    s.steps[0].options[0].consequenceOverrides = [
      { when: { kind: "frobnicate" }, text: "alternate text" },
    ];
    rejections.push({
      name: "override malformed condition",
      input: s,
      expect:
        'consequenceOverrides[0].when has unknown condition kind "frobnicate"',
    });
  }

  {
    const s = clone();
    s.steps[0].options[0].consequenceOverrides = [
      {
        when: { kind: "hasFlag", flag: "never-set-flag" },
        text: "alternate text",
      },
    ];
    rejections.push({
      name: "override references undefined flag",
      input: s,
      expect:
        'consequence overrides reference flag "never-set-flag" that no option ever sets',
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
      // Importer-facing strings: validator messages obey the copy rules.
      for (const error of result.errors) {
        assertCleanCopy(error, `validator message for ${name}`);
      }
    }
  }

  // The sample scenario offered on the import page is held to the same copy
  // rules, validates, lints clean, and plays to a known outcome.
  assertCleanCopy(JSON.stringify(SAMPLE_SCENARIO), "sample scenario");
  const sampleResult = parseScenarioJson(JSON.stringify(SAMPLE_SCENARIO));
  assert.ok(sampleResult.ok, "the sample scenario must validate");
  assert.equal(
    lintScenario(SAMPLE_SCENARIO).length,
    0,
    "the sample scenario must lint clean"
  );
  {
    let state = createInitialState(SAMPLE_SCENARIO);
    while (!state.completed) {
      const step = getCurrentStep(SAMPLE_SCENARIO, state);
      state = applyDecision(SAMPLE_SCENARIO, state, step.options[0].id);
    }
    assert.ok(
      OUTCOME_IDS.includes(state.outcomeId!),
      "the sample scenario must play to a known outcome"
    );
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

// --- Phase 6: conditional consequence resolution ----------------------

{
  // Plays a sequence of option ids and returns the recorded consequence at
  // the given decision index. Resolution happens in the engine at decision
  // time, so the record is the single source of truth being asserted.
  function consequenceAt(
    scenarioId: string,
    optionIds: string[],
    index: number
  ): string | undefined {
    const scenario = scenarios.find((s) => s.id === scenarioId)!;
    assert.ok(scenario, `scenario ${scenarioId} must be registered`);
    let state = createInitialState(scenario);
    for (const optionId of optionIds) {
      state = applyDecision(scenario, state, optionId);
    }
    return state.decisions[index]?.consequence;
  }

  // Scenario 1: accepting the AI code reads differently after reading the
  // pricing module that morning.
  assert.match(
    consequenceAt(
      "just-add-a-button",
      ["inspect-checkout", "conservative-interpretation", "accept-as-is"],
      2
    )!,
    /read the pricing module this morning/,
    "scenario 1: accept-as-is override after inspecting checkout"
  );
  assert.match(
    consequenceAt(
      "just-add-a-button",
      ["start-coding", "conservative-interpretation", "accept-as-is"],
      2
    )!,
    /merged code you can't fully explain/,
    "scenario 1: accept-as-is base without inspection"
  );

  // Scenario 1: skipping the failing test reads differently when the code
  // it covered was unreviewed AI output.
  assert.match(
    consequenceAt(
      "just-add-a-button",
      ["ask-questions", "ask-product", "accept-as-is", "push-forward"],
      3
    )!,
    /generated code you never reviewed/,
    "scenario 1: push-forward override after unreviewed AI code"
  );
  assert.match(
    consequenceAt(
      "just-add-a-button",
      ["ask-questions", "ask-product", "review-line-by-line", "push-forward"],
      3
    )!,
    /backlog both know how this usually ends/,
    "scenario 1: push-forward base after a real review"
  );

  // Scenario 1: ordered overrides on full-release. When both the deleted
  // test and the feature flag are in play, the first override wins.
  assert.match(
    consequenceAt(
      "just-add-a-button",
      [
        "start-coding",
        "assume-stacking",
        "accept-as-is",
        "delete-test",
        "feature-flag",
        "full-release",
      ],
      5
    )!,
    /promo-interaction test you deleted/,
    "scenario 1: first matching override wins when both match"
  );
  assert.match(
    consequenceAt(
      "just-add-a-button",
      [
        "ask-questions",
        "ask-product",
        "review-line-by-line",
        "investigate-test",
        "feature-flag",
        "full-release",
      ],
      5
    )!,
    /chose not to use the dial/,
    "scenario 1: second override fires when only it matches"
  );
  assert.match(
    consequenceAt(
      "just-add-a-button",
      [
        "ask-questions",
        "ask-product",
        "review-line-by-line",
        "investigate-test",
        "delay-explain",
        "full-release",
      ],
      5
    )!,
    /every cart in production at once/,
    "scenario 1: base consequence when no override matches"
  );

  // Scenario 2: quarantining the test reads differently after proving the
  // failure is real.
  assert.match(
    consequenceAt("the-broken-build", ["reproduce-locally", "mark-flaky"], 1)!,
    /proving this failure is real/,
    "scenario 2: mark-flaky override after reproducing"
  );
  assert.match(
    consequenceAt("the-broken-build", ["rerun-ci", "mark-flaky"], 1)!,
    /no longer gets a vote/,
    "scenario 2: mark-flaky base without reproduction"
  );
  assert.match(
    consequenceAt(
      "the-broken-build",
      ["rerun-ci", "run-twenty-times", "revert-refactor", "sleep-bandage"],
      3
    )!,
    /which race the bigger sleep is papering over/,
    "scenario 2: sleep-bandage override after characterizing the test"
  );
  assert.match(
    consequenceAt(
      "the-broken-build",
      [
        "rerun-ci",
        "delete-flaky-test",
        "revert-refactor",
        "fix-code-only",
        "say-green",
      ],
      4
    )!,
    /only integration test you deleted/,
    "scenario 2: say-green override after deleting the test"
  );
  assert.match(
    consequenceAt(
      "the-broken-build",
      [
        "reproduce-locally",
        "run-twenty-times",
        "bisect-commits",
        "fix-both",
        "say-green",
      ],
      4
    )!,
    /bisection gave you real evidence/,
    "scenario 2: say-green second override after bisecting"
  );

  // Scenario 3: approving the diff reads differently after finding the
  // three consumers; self-merge and the global deploy read differently
  // with a written rollback in hand.
  assert.match(
    consequenceAt(
      "friday-deploy",
      ["find-consumers", "proceed-anyway", "trust-the-diff"],
      2
    )!,
    /only answers for one of them/,
    "scenario 3: trust-the-diff override after finding consumers"
  );
  assert.match(
    consequenceAt(
      "friday-deploy",
      ["edit-and-deploy", "proceed-anyway", "trust-the-diff"],
      2
    )!,
    /neither did you/,
    "scenario 3: trust-the-diff base without the search"
  );
  assert.match(
    consequenceAt(
      "friday-deploy",
      ["edit-and-deploy", "proceed-anyway", "write-rollback-plan", "self-merge"],
      3
    )!,
    /four minute undo/,
    "scenario 3: self-merge override with a rollback plan"
  );
  assert.match(
    consequenceAt(
      "friday-deploy",
      [
        "edit-and-deploy",
        "proceed-anyway",
        "write-rollback-plan",
        "self-merge",
        "promise-today",
        "deploy-global",
      ],
      5
    )!,
    /the revert you wrote this afternoon/,
    "scenario 3: deploy-global override with a rollback plan"
  );
  assert.match(
    consequenceAt(
      "friday-deploy",
      [
        "edit-and-deploy",
        "proceed-anyway",
        "trust-the-diff",
        "self-merge",
        "promise-today",
        "deploy-global",
      ],
      5
    )!,
    /quietest support hours of the week/,
    "scenario 3: deploy-global base without a rollback plan"
  );

  // Scenario 4 (branching): walking away reads differently on the
  // kill-switch path, where there was no rollback to explain.
  assert.match(
    consequenceAt(
      "the-page",
      ["stash-and-ack", "flip-killswitch", "move-on-to-feature"],
      2
    )!,
    /bypass you flipped/,
    "scenario 4: move-on override on the kill-switch path"
  );
  assert.match(
    consequenceAt(
      "the-page",
      ["stash-and-ack", "rollback-last-deploy", "move-on-to-feature"],
      2
    )!,
    /rollback still unexplained/,
    "scenario 4: move-on base on the rollback path"
  );
  assert.match(
    consequenceAt(
      "the-page",
      ["stash-and-ack", "reproduce-incident", "find-shared-dep", "quick-patch"],
      3
    )!,
    /fails on demand/,
    "scenario 4: quick-patch override after reproducing"
  );
  assert.match(
    consequenceAt(
      "the-page",
      ["stash-and-ack", "read-dashboards", "find-shared-dep", "quick-patch"],
      3
    )!,
    /next cart you have not seen/,
    "scenario 4: quick-patch base without a reproduction"
  );
  assert.match(
    consequenceAt(
      "the-page",
      [
        "stash-and-ack",
        "flip-killswitch",
        "explain-to-team",
        "pin-library",
        "ship-it-now",
      ],
      4
    )!,
    /kill switch bought you all the time/,
    "scenario 4: ship-it-now override after mitigating"
  );
  assert.match(
    consequenceAt(
      "the-page",
      [
        "stash-and-ack",
        "read-dashboards",
        "find-shared-dep",
        "pin-library",
        "ship-it-now",
      ],
      4
    )!,
    /paged about an hour ago/,
    "scenario 4: ship-it-now base without mitigation"
  );

  console.log(
    "\nConditional consequences: override resolution verified across all scenarios."
  );
}

// --- Phase 7: shareable run codes --------------------------------------

{
  // The loader accepts a full link or a bare code.
  const trail = [
    "ask-questions",
    "ask-product",
    "review-line-by-line",
    "investigate-test",
    "feature-flag",
    "flagged-staged",
  ];
  const code = encodeRun("just-add-a-button", trail);
  assert.equal(
    extractRunCode(`https://example.com/run?code=${encodeURIComponent(code)}`),
    code,
    "extractRunCode must pull the code parameter out of a full link"
  );
  assert.equal(
    extractRunCode(`  ${code}  `),
    code,
    "extractRunCode must accept a bare code"
  );
  const viaLink = loadRunFromCode(code);
  assert.ok(viaLink.ok, "a valid code must load through the registry");
  if (viaLink.ok) {
    assert.equal(viaLink.run.scenario.id, "just-add-a-button");
    assert.equal(viaLink.run.state.completed, true);
    assert.ok(OUTCOME_IDS.includes(viaLink.run.state.outcomeId!));
  }

  // Malformed codes are rejected with specific, readable messages.
  const badCodes: { name: string; code: string; expect: string }[] = [
    {
      name: "empty code",
      code: "   ",
      expect: "The run code is empty.",
    },
    {
      name: "unknown version",
      code: "v9.just-add-a-button.start-coding",
      expect: 'Unrecognized run code version "v9"',
    },
    {
      name: "missing scenario id",
      code: "v1",
      expect: "missing its scenario id",
    },
    {
      name: "no decisions",
      code: "v1.just-add-a-button",
      expect: "carries no decisions",
    },
    {
      name: "empty decision entry",
      code: "v1.just-add-a-button.start-coding..accept-as-is",
      expect: "contains an empty decision entry",
    },
    {
      name: "unknown scenario",
      code: "v1.no-such-scenario.start-coding",
      expect: 'No built-in scenario is named "no-such-scenario"',
    },
    {
      name: "unknown option",
      code: "v1.just-add-a-button.do-a-backflip",
      expect: '"do-a-backflip") is not an option at the 9:00 AM step',
    },
    {
      name: "option from the wrong step",
      code: "v1.just-add-a-button.delete-test",
      expect: 'Decision 1 ("delete-test") is not an option',
    },
    {
      name: "truncated trail",
      code: "v1.just-add-a-button.start-coding.assume-stacking",
      expect: "ends before the day does",
    },
    {
      name: "trail past the end",
      code: encodeRun("just-add-a-button", [...trail, "flagged-staged"]),
      expect: "continues past the end of the day",
    },
  ];
  assert.ok(
    badCodes.length >= 6,
    "expected at least 6 malformed run code cases"
  );
  for (const { name, code: bad, expect } of badCodes) {
    const result = loadRunFromCode(bad);
    assert.equal(result.ok, false, `expected rejection for run code: ${name}`);
    if (!result.ok) {
      assert.ok(
        result.error.includes(expect),
        `run code rejection "${name}" should report "${expect}"; got: ${result.error}`
      );
      assertCleanCopy(result.error, `run code message for ${name}`);
    }
  }

  console.log(
    `\nRun codes: round trip asserted for every enumerated run; ${badCodes.length} malformed codes rejected.`
  );
}

// --- Phase 8: authoring studio round trips -----------------------------

{
  // Every built-in scenario loads into the studio and re-exports without
  // loss: the exported JSON is deep-equal to the scenario's own JSON, still
  // validates through the import path, and still lints clean.
  for (const scenario of scenarios) {
    const loaded = loadDraft(JSON.stringify(scenario));
    assert.ok(loaded.ok, `${scenario.id} must load into the studio`);
    if (!loaded.ok) {
      continue;
    }
    const exported = exportDraft(loaded.draft);
    assert.deepEqual(
      JSON.parse(exported),
      JSON.parse(JSON.stringify(scenario)),
      `${scenario.id} must re-export from the studio without loss`
    );
    const reimported = parseScenarioJson(exported);
    assert.ok(
      reimported.ok,
      `${scenario.id} exported from the studio must pass the import validator`
    );
    if (reimported.ok) {
      assert.equal(
        lintScenario(reimported.scenario).length,
        0,
        `${scenario.id} exported from the studio must lint clean`
      );
    }
  }

  // A scenario authored as a draft (the shape the studio's forms build)
  // exports to JSON that the import path accepts and plays to an outcome.
  const authored = {
    id: "studio-smoke",
    name: "Studio Smoke",
    tagline: "A two-step day to prove the authoring loop.",
    initialStepId: "first",
    initialMetrics: {
      quality: 50,
      speed: 50,
      risk: 20,
      trust: 60,
      focus: 70,
      testConfidence: 50,
    },
    steps: [
      {
        id: "first",
        time: "9:00 AM",
        title: "First call",
        narrative: "The day starts.",
        context: "One early decision.",
        options: [
          {
            id: "careful",
            label: "Take it slow",
            description: "Check before acting.",
            impact: { risk: -10 },
            nextStepId: "second",
            flags: ["took-care"],
          },
          {
            id: "rushed",
            label: "Rush it",
            description: "Act before checking.",
            impact: { risk: 60 },
            nextStepId: "second",
          },
        ],
      },
      {
        id: "second",
        time: "4:00 PM",
        title: "Last call",
        narrative: "The day ends.",
        context: "One late decision.",
        options: [
          {
            id: "wrap-up",
            label: "Wrap up",
            description: "Close it out.",
            impact: { quality: 5 },
            nextStepId: "__end__",
            consequence: "The day closes quietly.",
            consequenceOverrides: [
              {
                when: { kind: "hasFlag", flag: "took-care" },
                text: "The day closes quietly, on the margin you bought this morning.",
              },
            ],
          },
        ],
      },
    ],
    outcomes: [
      {
        id: "safe-rollout",
        time: "5:00 PM",
        title: "Safe Rollout",
        summary: "It ships clean.",
        tone: "positive",
      },
      {
        id: "minor-issue",
        time: "5:00 PM",
        title: "Minor Production Issue",
        summary: "It mostly ships clean.",
        tone: "mixed",
      },
    ],
    outcomeRules: [
      {
        outcomeId: "safe-rollout",
        priority: 1,
        when: { kind: "metricAtMost", metric: "risk", value: 40 },
      },
    ],
    fallbackOutcomeId: "minor-issue",
  };
  const authoredJson = exportDraft(
    (loadDraft(JSON.stringify(authored)) as { ok: true; draft: Scenario })
      .draft
  );
  const authoredImport = parseScenarioJson(authoredJson);
  assert.ok(
    authoredImport.ok,
    `a studio-authored draft must pass the import validator: ${
      authoredImport.ok ? "" : authoredImport.errors.join("; ")
    }`
  );
  if (authoredImport.ok) {
    let state = createInitialState(authoredImport.scenario);
    state = applyDecision(authoredImport.scenario, state, "careful");
    state = applyDecision(authoredImport.scenario, state, "wrap-up");
    assert.equal(state.completed, true);
    assert.equal(state.outcomeId, "safe-rollout");
    assert.match(
      state.decisions[1].consequence!,
      /margin you bought this morning/,
      "an authored conditional consequence must resolve"
    );
  }

  // Issues route to the structure they describe, so the studio can render
  // them in place rather than in a distant console.
  assert.deepEqual(
    validationTarget('steps[1].options[2].label must be a string'),
    { section: "option", step: 1, option: 2 }
  );
  assert.deepEqual(validationTarget("steps[3].time must be a string"), {
    section: "step",
    step: 3,
  });
  assert.deepEqual(validationTarget('outcomes[4].tone must be one of x'), {
    section: "outcome",
    outcome: 4,
  });
  assert.deepEqual(
    validationTarget('outcomeRules[0].priority must be a number'),
    { section: "rule", rule: 0 }
  );
  assert.deepEqual(
    validationTarget('Field "name" must be a non-empty string'),
    { section: "scenario" }
  );

  // End to end: break one option in a clone and assert the validator's
  // message lands on that option.
  {
    const broken = JSON.parse(JSON.stringify(scenario1));
    broken.steps[2].options[1].label = 42;
    const result = validateScenario(broken);
    assert.equal(result.ok, false);
    if (!result.ok) {
      const message = result.errors.find((e) => e.includes("label"));
      assert.ok(message, "breaking a label must produce a label error");
      assert.deepEqual(validationTarget(message!), {
        section: "option",
        step: 2,
        option: 1,
      });
    }
  }

  // Lint warnings route by the ids they name.
  {
    const draft = (
      loadDraft(JSON.stringify(scenario1)) as { ok: true; draft: Scenario }
    ).draft;
    assert.deepEqual(lintTarget('Unreachable step "tests-fail"', draft), {
      section: "step",
      step: 3,
    });
    assert.deepEqual(
      lintTarget(
        "Outcome rule 2 (responsible-delay) can never fire: its condition is unsatisfiable",
        draft
      ),
      { section: "rule", rule: 2 }
    );
    assert.deepEqual(
      lintTarget(
        'Dead flag "x": read by consequence override 0 on release-decision/full-release but set by no option',
        draft
      ),
      { section: "option", step: 5, option: 0 }
    );
  }

  console.log(
    "\nStudio: lossless round trips for all built-ins, authored-draft import, and issue routing verified."
  );
}

console.log("\nAll verification checks passed.");
