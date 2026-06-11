import type {
  DecisionRecord,
  MetricKey,
  Metrics,
  OutcomeId,
  Scenario,
} from "./types";
import { reconstructRun } from "./replay";
import { METRIC_ORDER } from "./metrics";

/**
 * Side-by-side comparison of two completed runs of the same scenario. It is
 * derived entirely from the two decision trails through reconstructRun, so it
 * holds no state of its own and cannot disagree with what each run did.
 */

export type ChoiceSummary = {
  stepId: string;
  stepTitle: string;
  stepTime: string;
  optionId: string;
  optionLabel: string;
};

export type StepDiff = {
  index: number;
  a?: ChoiceSummary;
  b?: ChoiceSummary;
  /** Same step reached and same option chosen. */
  sameChoice: boolean;
};

export type TrajectoryPoint = {
  index: number;
  label: string;
  a?: Metrics;
  b?: Metrics;
};

export type RunComparison = {
  steps: StepDiff[];
  trajectory: TrajectoryPoint[];
  finalA: { metrics: Metrics; outcomeId?: OutcomeId };
  finalB: { metrics: Metrics; outcomeId?: OutcomeId };
  /** Count of step indices where the two runs chose differently. */
  decisionDifferences: number;
  /** Final metric A minus final metric B, per metric. */
  metricDifferences: Record<MetricKey, number>;
};

function summarize(
  frame: ReturnType<typeof reconstructRun>["frames"][number]
): ChoiceSummary {
  return {
    stepId: frame.step.id,
    stepTitle: frame.step.title,
    stepTime: frame.step.time,
    optionId: frame.chosen.id,
    optionLabel: frame.chosen.label,
  };
}

export function compareRuns(
  scenario: Scenario,
  decisionsA: readonly DecisionRecord[],
  decisionsB: readonly DecisionRecord[]
): RunComparison {
  const runA = reconstructRun(scenario, decisionsA);
  const runB = reconstructRun(scenario, decisionsB);
  const maxLen = Math.max(runA.frames.length, runB.frames.length);

  const steps: StepDiff[] = [];
  let decisionDifferences = 0;
  for (let i = 0; i < maxLen; i += 1) {
    const fa = runA.frames[i];
    const fb = runB.frames[i];
    const a = fa ? summarize(fa) : undefined;
    const b = fb ? summarize(fb) : undefined;
    const sameChoice =
      !!a && !!b && a.stepId === b.stepId && a.optionId === b.optionId;
    if (!sameChoice) {
      decisionDifferences += 1;
    }
    steps.push({ index: i, a, b, sameChoice });
  }

  const trajectory: TrajectoryPoint[] = [];
  trajectory.push({
    index: 0,
    label: "Start",
    a: runA.frames[0]?.metricsBefore ?? runA.finalState.metrics,
    b: runB.frames[0]?.metricsBefore ?? runB.finalState.metrics,
  });
  for (let i = 0; i < maxLen; i += 1) {
    const fa = runA.frames[i];
    const fb = runB.frames[i];
    trajectory.push({
      index: i + 1,
      label: fa?.step.time ?? fb?.step.time ?? `Step ${i + 1}`,
      a: fa?.metricsAfter,
      b: fb?.metricsAfter,
    });
  }

  const metricDifferences = {} as Record<MetricKey, number>;
  for (const key of METRIC_ORDER) {
    metricDifferences[key] =
      runA.finalState.metrics[key] - runB.finalState.metrics[key];
  }

  return {
    steps,
    trajectory,
    finalA: {
      metrics: runA.finalState.metrics,
      outcomeId: runA.finalState.outcomeId,
    },
    finalB: {
      metrics: runB.finalState.metrics,
      outcomeId: runB.finalState.outcomeId,
    },
    decisionDifferences,
    metricDifferences,
  };
}
