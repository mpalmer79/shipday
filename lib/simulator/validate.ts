import type {
  Condition,
  MetricKey,
  OutcomeId,
  Scenario,
} from "./types";
import { END_STEP_ID } from "./types";

/**
 * Validates untrusted input (for example pasted JSON) into a Scenario.
 * Returns either the typed scenario or a list of specific, readable errors.
 * Nothing here trusts the shape of the input; every field is checked before
 * it is read.
 */

export const METRIC_KEYS: MetricKey[] = [
  "quality",
  "speed",
  "risk",
  "trust",
  "focus",
  "testConfidence",
];

export const OUTCOME_IDS: OutcomeId[] = [
  "safe-rollout",
  "minor-issue",
  "customer-incident",
  "responsible-delay",
  "overcontrolled",
];

const TONES = ["positive", "mixed", "negative", "neutral"];

const CONDITION_KINDS = [
  "metricAtLeast",
  "metricAtMost",
  "hasFlag",
  "lacksFlag",
  "anyOf",
  "allOf",
];

export type ValidationResult =
  | { ok: true; scenario: Scenario }
  | { ok: false; errors: string[] };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Parse a JSON string, collecting a readable error on failure. */
export function parseScenarioJson(text: string): ValidationResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, errors: [`Input is not valid JSON: ${message}`] };
  }
  return validateScenario(data);
}

function validateMetricMap(
  value: unknown,
  where: string,
  errors: string[],
  requireAll: boolean
): void {
  if (!isObject(value)) {
    errors.push(`${where} must be an object of metric values`);
    return;
  }
  for (const key of Object.keys(value)) {
    if (!METRIC_KEYS.includes(key as MetricKey)) {
      errors.push(`${where} has unknown metric key "${key}"`);
    } else if (!isNumber(value[key])) {
      errors.push(`${where} value for "${key}" must be a number`);
    }
  }
  if (requireAll) {
    for (const key of METRIC_KEYS) {
      if (!(key in value)) {
        errors.push(`${where} is missing metric "${key}"`);
      }
    }
  }
}

function validateCondition(
  value: unknown,
  where: string,
  errors: string[],
  flags: string[]
): void {
  if (!isObject(value)) {
    errors.push(`${where} must be a condition object`);
    return;
  }
  const kind = value.kind;
  if (!isString(kind) || !CONDITION_KINDS.includes(kind)) {
    errors.push(`${where} has unknown condition kind "${String(kind)}"`);
    return;
  }
  switch (kind) {
    case "metricAtLeast":
    case "metricAtMost":
      if (!METRIC_KEYS.includes(value.metric as MetricKey)) {
        errors.push(
          `${where} references unknown metric "${String(value.metric)}"`
        );
      }
      if (!isNumber(value.value)) {
        errors.push(`${where} value must be a number`);
      }
      break;
    case "hasFlag":
    case "lacksFlag":
      if (!isString(value.flag)) {
        errors.push(`${where} flag must be a string`);
      } else {
        flags.push(value.flag);
      }
      break;
    case "anyOf":
    case "allOf":
      if (!Array.isArray(value.conditions)) {
        errors.push(`${where} ${kind} must have a conditions array`);
      } else {
        value.conditions.forEach((c, i) =>
          validateCondition(c, `${where}.${kind}[${i}]`, errors, flags)
        );
      }
      break;
  }
}

export function validateScenario(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isObject(input)) {
    return { ok: false, errors: ["Scenario must be a JSON object"] };
  }

  for (const field of ["id", "name", "tagline", "initialStepId"]) {
    if (!isString(input[field]) || (input[field] as string).length === 0) {
      errors.push(`Field "${field}" must be a non-empty string`);
    }
  }

  validateMetricMap(input.initialMetrics, "initialMetrics", errors, true);

  // Steps.
  const stepIds = new Set<string>();
  const setFlags = new Set<string>();
  if (!Array.isArray(input.steps) || input.steps.length === 0) {
    errors.push("steps must be a non-empty array");
  } else {
    for (let i = 0; i < input.steps.length; i += 1) {
      const step = input.steps[i];
      const sw = `steps[${i}]`;
      if (!isObject(step)) {
        errors.push(`${sw} must be an object`);
        continue;
      }
      if (!isString(step.id) || step.id.length === 0) {
        errors.push(`${sw}.id must be a non-empty string`);
      } else if (stepIds.has(step.id)) {
        errors.push(`${sw}.id "${step.id}" is a duplicate step id`);
      } else {
        stepIds.add(step.id);
      }
      for (const field of ["time", "title", "narrative", "context"]) {
        if (!isString(step[field])) {
          errors.push(`${sw}.${field} must be a string`);
        }
      }
      if (!Array.isArray(step.options) || step.options.length === 0) {
        errors.push(`${sw}.options must be a non-empty array`);
        continue;
      }
      const optionIds = new Set<string>();
      for (let j = 0; j < step.options.length; j += 1) {
        const option = step.options[j];
        const ow = `${sw}.options[${j}]`;
        if (!isObject(option)) {
          errors.push(`${ow} must be an object`);
          continue;
        }
        if (!isString(option.id) || option.id.length === 0) {
          errors.push(`${ow}.id must be a non-empty string`);
        } else if (optionIds.has(option.id)) {
          errors.push(`${ow}.id "${option.id}" is a duplicate option id`);
        } else {
          optionIds.add(option.id);
        }
        for (const field of ["label", "description"]) {
          if (!isString(option[field])) {
            errors.push(`${ow}.${field} must be a string`);
          }
        }
        validateMetricMap(option.impact, `${ow}.impact`, errors, false);
        if (!isString(option.nextStepId)) {
          errors.push(`${ow}.nextStepId must be a string`);
        }
        if (option.flags !== undefined) {
          if (!Array.isArray(option.flags)) {
            errors.push(`${ow}.flags must be an array of strings`);
          } else {
            for (const flag of option.flags) {
              if (!isString(flag)) {
                errors.push(`${ow}.flags must contain only strings`);
              } else {
                setFlags.add(flag);
              }
            }
          }
        }
      }
    }
  }

  // initialStepId must point at a real step.
  if (isString(input.initialStepId) && !stepIds.has(input.initialStepId)) {
    errors.push(
      `initialStepId "${input.initialStepId}" does not match any step`
    );
  }

  // Every nextStepId must be the end sentinel or a real step.
  if (Array.isArray(input.steps)) {
    input.steps.forEach((step, i) => {
      if (!isObject(step) || !Array.isArray(step.options)) {
        return;
      }
      step.options.forEach((option, j) => {
        if (!isObject(option) || !isString(option.nextStepId)) {
          return;
        }
        if (
          option.nextStepId !== END_STEP_ID &&
          !stepIds.has(option.nextStepId)
        ) {
          errors.push(
            `steps[${i}].options[${j}] points at unknown step "${option.nextStepId}"`
          );
        }
      });
    });
  }

  // Outcomes.
  const outcomeIds = new Set<string>();
  if (!Array.isArray(input.outcomes) || input.outcomes.length === 0) {
    errors.push("outcomes must be a non-empty array");
  } else {
    input.outcomes.forEach((outcome, i) => {
      const ow = `outcomes[${i}]`;
      if (!isObject(outcome)) {
        errors.push(`${ow} must be an object`);
        return;
      }
      if (!OUTCOME_IDS.includes(outcome.id as OutcomeId)) {
        errors.push(`${ow}.id "${String(outcome.id)}" is not a known outcome`);
      } else {
        outcomeIds.add(outcome.id as string);
      }
      for (const field of ["time", "title", "summary"]) {
        if (!isString(outcome[field])) {
          errors.push(`${ow}.${field} must be a string`);
        }
      }
      if (!isString(outcome.tone) || !TONES.includes(outcome.tone)) {
        errors.push(`${ow}.tone must be one of ${TONES.join(", ")}`);
      }
    });
  }

  // Outcome rules.
  const referencedFlags: string[] = [];
  if (!Array.isArray(input.outcomeRules)) {
    errors.push("outcomeRules must be an array");
  } else {
    input.outcomeRules.forEach((rule, i) => {
      const rw = `outcomeRules[${i}]`;
      if (!isObject(rule)) {
        errors.push(`${rw} must be an object`);
        return;
      }
      if (!OUTCOME_IDS.includes(rule.outcomeId as OutcomeId)) {
        errors.push(`${rw}.outcomeId "${String(rule.outcomeId)}" is not known`);
      } else if (!outcomeIds.has(rule.outcomeId as string)) {
        errors.push(
          `${rw}.outcomeId "${String(rule.outcomeId)}" has no matching outcome`
        );
      }
      if (!isNumber(rule.priority)) {
        errors.push(`${rw}.priority must be a number`);
      }
      validateCondition(rule.when, `${rw}.when`, errors, referencedFlags);
    });
  }

  // Flags referenced by rules but set by no option are undefined flags.
  for (const flag of referencedFlags) {
    if (!setFlags.has(flag)) {
      errors.push(
        `outcome rules reference flag "${flag}" that no option ever sets`
      );
    }
  }

  // Fallback outcome.
  if (!OUTCOME_IDS.includes(input.fallbackOutcomeId as OutcomeId)) {
    errors.push(
      `fallbackOutcomeId "${String(input.fallbackOutcomeId)}" is not a known outcome`
    );
  } else if (!outcomeIds.has(input.fallbackOutcomeId as string)) {
    errors.push(
      `fallbackOutcomeId "${String(input.fallbackOutcomeId)}" has no matching outcome`
    );
  }

  // missedSignals is optional; if present it must be a map of strings.
  if (input.missedSignals !== undefined) {
    if (!isObject(input.missedSignals)) {
      errors.push("missedSignals must be an object of flag to text");
    } else {
      for (const [key, text] of Object.entries(input.missedSignals)) {
        if (!isString(text)) {
          errors.push(`missedSignals["${key}"] must be a string`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, scenario: input as unknown as Scenario };
}
