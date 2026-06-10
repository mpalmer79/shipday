import type {
  Condition,
  OutcomeDefinition,
  OutcomeId,
  Scenario,
  SimulatorState,
} from "./types";

export function evaluateCondition(
  condition: Condition,
  state: SimulatorState
): boolean {
  switch (condition.kind) {
    case "metricAtLeast":
      return state.metrics[condition.metric] >= condition.value;
    case "metricAtMost":
      return state.metrics[condition.metric] <= condition.value;
    case "hasFlag":
      return state.flags.includes(condition.flag);
    case "lacksFlag":
      return !state.flags.includes(condition.flag);
    case "anyOf":
      return condition.conditions.some((c) => evaluateCondition(c, state));
    case "allOf":
      return condition.conditions.every((c) => evaluateCondition(c, state));
  }
}

export function resolveOutcome(
  scenario: Scenario,
  state: SimulatorState
): OutcomeId {
  const rules = [...scenario.outcomeRules].sort(
    (a, b) => a.priority - b.priority
  );
  for (const rule of rules) {
    if (evaluateCondition(rule.when, state)) {
      return rule.outcomeId;
    }
  }
  return scenario.fallbackOutcomeId;
}

export function getOutcome(
  scenario: Scenario,
  outcomeId: OutcomeId
): OutcomeDefinition {
  const outcome = scenario.outcomes.find((o) => o.id === outcomeId);
  if (!outcome) {
    throw new Error(`Unknown outcome: ${outcomeId}`);
  }
  return outcome;
}
