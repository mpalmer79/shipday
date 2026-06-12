import type { Condition, Scenario } from "./types";
import { END_STEP_ID } from "./types";

/**
 * Structural lint over a valid scenario. Catches problems that are not type
 * errors but are still bugs: steps no run can reach, flags that rules read
 * but no option sets, and outcome rules whose condition can never be true.
 * Usable against built-in scenarios and imported ones alike.
 */

function collectReferencedFlags(condition: Condition, into: Set<string>): void {
  switch (condition.kind) {
    case "hasFlag":
    case "lacksFlag":
      into.add(condition.flag);
      break;
    case "anyOf":
    case "allOf":
      for (const child of condition.conditions) {
        collectReferencedFlags(child, into);
      }
      break;
    default:
      break;
  }
}

/**
 * Conservative static check: can this condition ever be true given the flags
 * the scenario can set and the metric range [0, 100]? Returns false only for
 * conditions that are provably unsatisfiable.
 */
function isSatisfiable(condition: Condition, setFlags: Set<string>): boolean {
  switch (condition.kind) {
    case "metricAtLeast":
      return condition.value <= 100;
    case "metricAtMost":
      return condition.value >= 0;
    case "hasFlag":
      return setFlags.has(condition.flag);
    case "lacksFlag":
      return true;
    case "anyOf":
      return condition.conditions.some((c) => isSatisfiable(c, setFlags));
    case "allOf": {
      if (!condition.conditions.every((c) => isSatisfiable(c, setFlags))) {
        return false;
      }
      // A required flag and its negation in the same allOf cannot both hold.
      const required = new Set<string>();
      const forbidden = new Set<string>();
      for (const c of condition.conditions) {
        if (c.kind === "hasFlag") required.add(c.flag);
        if (c.kind === "lacksFlag") forbidden.add(c.flag);
      }
      for (const flag of required) {
        if (forbidden.has(flag)) {
          return false;
        }
      }
      return true;
    }
  }
}

export function lintScenario(scenario: Scenario): string[] {
  const problems: string[] = [];

  // Reachable steps from the initial step.
  const byId = new Map(scenario.steps.map((s) => [s.id, s]));
  const reachable = new Set<string>();
  const queue = [scenario.initialStepId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (id === END_STEP_ID || reachable.has(id)) {
      continue;
    }
    reachable.add(id);
    const step = byId.get(id);
    if (!step) {
      continue;
    }
    for (const option of step.options) {
      if (!reachable.has(option.nextStepId)) {
        queue.push(option.nextStepId);
      }
    }
  }
  for (const step of scenario.steps) {
    if (!reachable.has(step.id)) {
      problems.push(`Unreachable step "${step.id}"`);
    }
  }

  // Flags an option can set.
  const setFlags = new Set<string>();
  for (const step of scenario.steps) {
    for (const option of step.options) {
      for (const flag of option.flags ?? []) {
        setFlags.add(flag);
      }
    }
  }

  // Flags read by rules but set by no option are dead.
  const referenced = new Set<string>();
  for (const rule of scenario.outcomeRules) {
    collectReferencedFlags(rule.when, referenced);
  }
  for (const flag of referenced) {
    if (!setFlags.has(flag)) {
      problems.push(`Dead flag "${flag}": read by a rule but set by no option`);
    }
  }

  // Rules whose condition can never be true.
  scenario.outcomeRules.forEach((rule, i) => {
    if (!isSatisfiable(rule.when, setFlags)) {
      problems.push(
        `Outcome rule ${i} (${rule.outcomeId}) can never fire: its condition is unsatisfiable`
      );
    }
  });

  // Consequence override conditions obey the same rules: a flag they read
  // must be set by some option, and the condition must be satisfiable.
  for (const step of scenario.steps) {
    for (const option of step.options) {
      (option.consequenceOverrides ?? []).forEach((override, i) => {
        const where = `${step.id}/${option.id} override ${i}`;
        const readFlags = new Set<string>();
        collectReferencedFlags(override.when, readFlags);
        for (const flag of readFlags) {
          if (!setFlags.has(flag)) {
            problems.push(
              `Dead flag "${flag}": read by consequence override ${where} but set by no option`
            );
          }
        }
        if (!isSatisfiable(override.when, setFlags)) {
          problems.push(
            `Consequence override ${where} can never fire: its condition is unsatisfiable`
          );
        }
      });
    }
  }

  return problems;
}
