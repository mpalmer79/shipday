import type {
  DecisionRecord,
  Metrics,
  OutcomeId,
  Scenario,
} from "./types";
import { reconstructRun } from "./replay";
import { METRIC_ORDER } from "./metrics";

export type StepComparison = {
  index: number;
  time: string;
  title: string;
  /** Both runs were at the same step at this position (branching aside). */
  sameStep: boolean;
  aLabel?: string;
  bLabel?: string;
  sameChoice: boolean;
};

export type RunComparison = {
  steps: StepComparison[];
  /** Metrics after each decision, for the trajectory table. */
  trajectoryA: Metrics[];
  trajectoryB: Metrics[];
  finalA: Metrics;
  finalB: Metrics;
  /** finalB minus finalA, per metric. */
  metricDelta: Metrics;
  outcomeA: OutcomeId;
  outcomeB: OutcomeId;
  sameOutcome: boolean;
  differingChoices: number;
};

/**
 * Compares two completed runs of the same scenario, derived entirely from
 * their decision trails through the existing replay reconstruction. Pure:
 * no stored state, no engine changes. Aligns the two runs by decision
 * position, so a branch divergence shows up as steps that differ.
 */
export function compareRuns(
  scenario: Scenario,
  a: DecisionRecord[],
  b: DecisionRecord[]
): RunComparison {
  const ra = reconstructRun(scenario, a);
  const rb = reconstructRun(scenario, b);

  const length = Math.max(ra.frames.length, rb.frames.length);
  const steps: StepComparison[] = [];
  let differingChoices = 0;

  for (let i = 0; i < length; i += 1) {
    const fa = ra.frames[i];
    const fb = rb.frames[i];
    const reference = fa ?? fb;
    const sameStep = Boolean(fa && fb && fa.step.id === fb.step.id);
    const sameChoice = Boolean(
      fa && fb && sameStep && fa.chosen.id === fb.chosen.id
    );
    if (!sameChoice) {
      differingChoices += 1;
    }
    steps.push({
      index: i,
      time: reference!.step.time,
      title: reference!.step.title,
      sameStep,
      aLabel: fa?.chosen.label,
      bLabel: fb?.chosen.label,
      sameChoice,
    });
  }

  const finalA = ra.finalState.metrics;
  const finalB = rb.finalState.metrics;
  const metricDelta = {} as Metrics;
  for (const key of METRIC_ORDER) {
    metricDelta[key] = finalB[key] - finalA[key];
  }

  return {
    steps,
    trajectoryA: ra.frames.map((f) => f.metricsAfter),
    trajectoryB: rb.frames.map((f) => f.metricsAfter),
    finalA,
    finalB,
    metricDelta,
    outcomeA: ra.finalState.outcomeId!,
    outcomeB: rb.finalState.outcomeId!,
    sameOutcome: ra.finalState.outcomeId === rb.finalState.outcomeId,
    differingChoices,
  };
}
