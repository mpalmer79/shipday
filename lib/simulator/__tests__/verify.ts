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
import type { OutcomeId, Scenario, SimulatorState } from "../types";
import { END_STEP_ID } from "../types";

const MAX_OUTCOME_SHARE = 0.45;
const MIN_OUTCOME_SHARE = 0.02;

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
  const outcomeIds = new Set(scenario.outcomes.map((o) => o.id));
  assert.equal(outcomeIds.size, 5, `${scenario.id} must define 5 outcomes`);
  for (const rule of scenario.outcomeRules) {
    assert.ok(
      outcomeIds.has(rule.outcomeId),
      `Rule references unknown outcome in ${scenario.id}`
    );
  }
  assert.ok(outcomeIds.has(scenario.fallbackOutcomeId));
}

// --- Phase 3: exhaustive playtest per scenario ------------------------

export type Distribution = {
  totalRuns: number;
  counts: Map<OutcomeId, number>;
};

function enumerateRuns(scenario: Scenario): Distribution {
  const counts = new Map<OutcomeId, number>();
  let totalRuns = 0;

  function walk(state: SimulatorState): void {
    if (state.completed) {
      totalRuns += 1;
      assert.ok(state.outcomeId, "completed run must have an outcome");
      counts.set(state.outcomeId!, (counts.get(state.outcomeId!) ?? 0) + 1);
      // Every completed run must produce a coherent report.
      const report = generateReport(scenario, state);
      assert.equal(report.timeline.length, state.decisions.length);
      assert.ok(report.staffLevelLesson.length > 0);
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

for (const scenario of scenarios) {
  const { totalRuns, counts } = enumerateRuns(scenario);

  console.log(`\n${scenario.name}: ${totalRuns} distinct runs`);
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
}

console.log("\nAll verification checks passed.");
