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
    "minor-issue": 2735,
    "customer-incident": 439,
    "responsible-delay": 1545,
    overcontrolled: 730,
  },
  "friday-deploy": {
    "safe-rollout": 934,
    "minor-issue": 1444,
    "customer-incident": 389,
    "responsible-delay": 1002,
    overcontrolled: 327,
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

  // Built-in scenarios curate strong decisions deliberately.
  assert.ok(
    scenario.steps.some((step) => step.options.some((o) => o.strong)),
    `${scenario.id} must mark at least one option strong`
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
      // Curated strong decisions: every reported strong decision was
      // explicitly marked in the scenario data, not inferred.
      for (const strong of report.strongDecisions) {
        assert.equal(
          strong.strong,
          true,
          `Reported strong decision ${strong.optionId} must be marked strong`
        );
      }
      // Scenario-specific missed-signal copy takes precedence over the
      // shared fallback whenever the scenario defines it for a set flag.
      for (const flag of state.flags) {
        const specific = scenario.missedSignals?.[flag];
        if (specific) {
          assert.ok(
            report.missedSignals.includes(specific),
            `Missed signal for ${flag} should use scenario copy in ${scenario.id}`
          );
        }
      }
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

console.log("\nAll verification checks passed.");
