/**
 * Build-time verification for the simulator engine and scenario data.
 * Run with: npm run verify
 *
 * Plain assertions, no test framework. Two phases:
 *  1. Unit-style assertions on the engine, resolver, and report.
 *  2. Exhaustive playtest: every possible run of the scenario is
 *     enumerated to prove all five outcomes are reachable and to print
 *     the outcome distribution for tuning.
 */
import assert from "node:assert/strict";
import { justAddAButton } from "../../../data/scenarios/just-add-a-button";
import {
  applyDecision,
  createInitialState,
  getCurrentStep,
  SimulatorError,
} from "../engine";
import { generateReport } from "../report";
import type { OutcomeId, SimulatorState } from "../types";
import { END_STEP_ID } from "../types";

const scenario = justAddAButton;

// --- Phase 1: engine assertions -------------------------------------

{
  const state = createInitialState(scenario);
  assert.equal(state.currentStepId, "ticket-assigned");
  assert.equal(state.completed, false);
  assert.deepEqual(state.metrics, scenario.initialMetrics);
  assert.notEqual(state.metrics, scenario.initialMetrics, "metrics must be copied");

  // Invalid option throws a typed error.
  assert.throws(() => applyDecision(scenario, state, "nope"), SimulatorError);

  // applyDecision is pure: input state is untouched.
  const next = applyDecision(scenario, state, "ask-questions");
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
  const again = applyDecision(scenario, next, "ask-product");
  assert.equal(
    again.flags.filter((f) => f === "asked-clarifying-questions").length,
    1
  );

  // Metrics clamp to [0, 100].
  const clampProbe: SimulatorState = {
    ...state,
    metrics: { ...state.metrics, risk: 95, speed: 3 },
  };
  const clamped = applyDecision(scenario, clampProbe, "start-coding");
  assert.equal(clamped.metrics.risk, 100);
  assert.equal(clamped.metrics.speed, 13);

  // Report refuses incomplete runs.
  assert.throws(() => generateReport(scenario, state));
}

// Scenario data is internally consistent: every nextStepId resolves.
{
  const stepIds = new Set(scenario.steps.map((s) => s.id));
  for (const step of scenario.steps) {
    for (const option of step.options) {
      assert.ok(
        option.nextStepId === END_STEP_ID || stepIds.has(option.nextStepId),
        `Dangling nextStepId "${option.nextStepId}" in ${step.id}/${option.id}`
      );
    }
  }
  const outcomeIds = new Set(scenario.outcomes.map((o) => o.id));
  for (const rule of scenario.outcomeRules) {
    assert.ok(outcomeIds.has(rule.outcomeId));
  }
  assert.ok(outcomeIds.has(scenario.fallbackOutcomeId));
}

// --- Phase 2: exhaustive playtest ------------------------------------

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

console.log(`Exhaustive playtest: ${totalRuns} distinct runs`);
for (const outcome of scenario.outcomes) {
  const n = counts.get(outcome.id) ?? 0;
  const pct = ((n / totalRuns) * 100).toFixed(1);
  console.log(`  ${outcome.title.padEnd(28)} ${String(n).padStart(5)}  (${pct}%)`);
}

for (const outcome of scenario.outcomes) {
  assert.ok(
    (counts.get(outcome.id) ?? 0) > 0,
    `Outcome "${outcome.id}" is unreachable`
  );
}

console.log("\nAll verification checks passed.");
