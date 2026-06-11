import type {
  Metrics,
  Scenario,
  ScenarioStep,
  SimulatorState,
} from "./types";
import { END_STEP_ID } from "./types";
import { resolveOutcome } from "./outcomes";

export class SimulatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulatorError";
  }
}

export function createInitialState(scenario: Scenario): SimulatorState {
  return {
    scenarioId: scenario.id,
    currentStepId: scenario.initialStepId,
    metrics: { ...scenario.initialMetrics },
    flags: [],
    decisions: [],
    completed: false,
  };
}

export function getStep(scenario: Scenario, stepId: string): ScenarioStep {
  const step = scenario.steps.find((s) => s.id === stepId);
  if (!step) {
    throw new SimulatorError(`Unknown step: ${stepId}`);
  }
  return step;
}

export function getCurrentStep(
  scenario: Scenario,
  state: SimulatorState
): ScenarioStep {
  return getStep(scenario, state.currentStepId);
}

export function clampMetrics(metrics: Metrics): Metrics {
  const clamped = { ...metrics };
  for (const key of Object.keys(clamped) as (keyof Metrics)[]) {
    clamped[key] = Math.max(0, Math.min(100, clamped[key]));
  }
  return clamped;
}

export function isComplete(state: SimulatorState): boolean {
  return state.completed;
}

export function applyDecision(
  scenario: Scenario,
  state: SimulatorState,
  optionId: string
): SimulatorState {
  if (state.completed) {
    throw new SimulatorError("The workday is already over.");
  }

  const step = getCurrentStep(scenario, state);
  const option = step.options.find((o) => o.id === optionId);
  if (!option) {
    throw new SimulatorError(
      `Unknown option "${optionId}" for step "${step.id}"`
    );
  }

  const metrics = { ...state.metrics };
  for (const [key, delta] of Object.entries(option.impact) as [
    keyof Metrics,
    number,
  ][]) {
    metrics[key] += delta;
  }

  const flags = [...state.flags];
  for (const flag of option.flags ?? []) {
    if (!flags.includes(flag)) {
      flags.push(flag);
    }
  }

  const next: SimulatorState = {
    ...state,
    metrics: clampMetrics(metrics),
    flags,
    decisions: [
      ...state.decisions,
      {
        stepId: step.id,
        optionId: option.id,
        stepTitle: step.title,
        stepTime: step.time,
        optionLabel: option.label,
        impact: option.impact,
        consequence: option.consequence,
        lesson: option.lesson,
        strong: option.strong,
      },
    ],
    currentStepId: option.nextStepId,
  };

  if (option.nextStepId === END_STEP_ID) {
    next.completed = true;
    next.outcomeId = resolveOutcome(scenario, next);
  }

  return next;
}
