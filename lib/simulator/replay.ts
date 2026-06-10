import type {
  DecisionImpact,
  DecisionOption,
  DecisionRecord,
  Metrics,
  Scenario,
  ScenarioStep,
  SimulatorState,
} from "./types";
import { applyDecision, createInitialState, getStep } from "./engine";

export type ReplayFrame = {
  index: number;
  step: ScenarioStep;
  chosen: DecisionOption;
  notChosen: DecisionOption[];
  impact: DecisionImpact;
  metricsBefore: Metrics;
  metricsAfter: Metrics;
  consequence?: string;
};

export type ReconstructedRun = {
  frames: ReplayFrame[];
  finalState: SimulatorState;
};

/**
 * Rebuilds a completed run from its decision trail. Pure: given the same
 * scenario and decisions, it returns identical frames and final state.
 * Every intermediate metric snapshot is recomputed through the engine, so
 * replay can never disagree with what the original run did.
 */
export function reconstructRun(
  scenario: Scenario,
  decisions: readonly DecisionRecord[]
): ReconstructedRun {
  const frames: ReplayFrame[] = [];
  let state = createInitialState(scenario);

  decisions.forEach((record, index) => {
    if (record.stepId !== state.currentStepId) {
      throw new Error(
        `Replay mismatch at decision ${index}: recorded step "${record.stepId}", expected "${state.currentStepId}"`
      );
    }
    const step = getStep(scenario, record.stepId);
    const chosen = step.options.find((o) => o.id === record.optionId);
    if (!chosen) {
      throw new Error(
        `Replay mismatch at decision ${index}: option "${record.optionId}" not found in step "${step.id}"`
      );
    }

    const metricsBefore = state.metrics;
    state = applyDecision(scenario, state, record.optionId);

    frames.push({
      index,
      step,
      chosen,
      notChosen: step.options.filter((o) => o.id !== record.optionId),
      impact: chosen.impact,
      metricsBefore,
      metricsAfter: state.metrics,
      consequence: chosen.consequence,
    });
  });

  return { frames, finalState: state };
}
