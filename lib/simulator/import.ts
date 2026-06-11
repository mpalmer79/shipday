import type {
  Condition,
  MetricKey,
  OutcomeId,
  Scenario,
} from "./types";
import { END_STEP_ID } from "./types";
import { METRIC_ORDER } from "./metrics";

const METRIC_KEYS = new Set<string>(METRIC_ORDER);
const OUTCOME_IDS = new Set<OutcomeId>([
  "safe-rollout",
  "minor-issue",
  "customer-incident",
  "responsible-delay",
  "overcontrolled",
]);
const TONES = new Set(["positive", "mixed", "negative", "neutral"]);
const CONDITION_KINDS = new Set([
  "metricAtLeast",
  "metricAtMost",
  "hasFlag",
  "lacksFlag",
  "anyOf",
  "allOf",
]);

export type ValidationResult =
  | { ok: true; scenario: Scenario }
  | { ok: false; errors: string[] };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Validates untrusted scenario data against the engine's shape. Collects
 * every problem it can find rather than failing on the first, so the
 * importer can show a full list. Returns the typed scenario on success.
 */
export function validateScenario(data: unknown): ValidationResult {
  const errors: string[] = [];
  const add = (msg: string) => errors.push(msg);

  if (!isObject(data)) {
    return { ok: false, errors: ["Top level must be a JSON object."] };
  }

  for (const field of ["id", "name", "tagline", "initialStepId"] as const) {
    if (!isString(data[field])) {
      add(`Field "${field}" must be a string.`);
    }
  }
  if (!isString(data.fallbackOutcomeId)) {
    add(`Field "fallbackOutcomeId" must be a string.`);
  }

  // Metrics: exactly the six known keys, all numeric.
  if (!isObject(data.initialMetrics)) {
    add(`Field "initialMetrics" must be an object.`);
  } else {
    for (const key of Object.keys(data.initialMetrics)) {
      if (!METRIC_KEYS.has(key)) {
        add(`initialMetrics has unknown metric key "${key}".`);
      }
    }
    for (const key of METRIC_ORDER) {
      if (!(key in data.initialMetrics)) {
        add(`initialMetrics is missing metric "${key}".`);
      } else if (!isNumber(data.initialMetrics[key])) {
        add(`initialMetrics.${key} must be a number.`);
      }
    }
  }

  // Steps.
  const stepIds = new Set<string>();
  const settableFlags = new Set<string>();
  if (!Array.isArray(data.steps) || data.steps.length === 0) {
    add(`Field "steps" must be a non-empty array.`);
  } else {
    for (const [i, rawStep] of data.steps.entries()) {
      if (!isObject(rawStep)) {
        add(`steps[${i}] must be an object.`);
        continue;
      }
      const sid = rawStep.id;
      if (!isString(sid)) {
        add(`steps[${i}].id must be a string.`);
      } else {
        if (stepIds.has(sid)) {
          add(`Duplicate step id "${sid}".`);
        }
        stepIds.add(sid);
      }
      for (const field of [
        "time",
        "title",
        "narrative",
        "context",
      ] as const) {
        if (!isString(rawStep[field])) {
          add(`steps[${i}].${field} must be a string.`);
        }
      }
      if (!Array.isArray(rawStep.options) || rawStep.options.length === 0) {
        add(`steps[${i}].options must be a non-empty array.`);
        continue;
      }
      const optionIds = new Set<string>();
      for (const [j, rawOpt] of rawStep.options.entries()) {
        if (!isObject(rawOpt)) {
          add(`steps[${i}].options[${j}] must be an object.`);
          continue;
        }
        const oid = rawOpt.id;
        if (!isString(oid)) {
          add(`steps[${i}].options[${j}].id must be a string.`);
        } else {
          if (optionIds.has(oid)) {
            add(`Duplicate option id "${oid}" in step "${String(sid)}".`);
          }
          optionIds.add(oid);
        }
        if (!isString(rawOpt.label)) {
          add(`Option "${String(oid)}" label must be a string.`);
        }
        if (!isString(rawOpt.description)) {
          add(`Option "${String(oid)}" description must be a string.`);
        }
        if (!isString(rawOpt.nextStepId)) {
          add(`Option "${String(oid)}" nextStepId must be a string.`);
        }
        if (!isObject(rawOpt.impact)) {
          add(`Option "${String(oid)}" impact must be an object.`);
        } else {
          for (const [k, v] of Object.entries(rawOpt.impact)) {
            if (!METRIC_KEYS.has(k)) {
              add(`Option "${String(oid)}" impact has unknown metric "${k}".`);
            } else if (!isNumber(v)) {
              add(`Option "${String(oid)}" impact.${k} must be a number.`);
            }
          }
        }
        if (rawOpt.flags !== undefined) {
          if (!Array.isArray(rawOpt.flags)) {
            add(`Option "${String(oid)}" flags must be an array.`);
          } else {
            for (const f of rawOpt.flags) {
              if (!isString(f)) {
                add(`Option "${String(oid)}" flags must be strings.`);
              } else {
                settableFlags.add(f);
              }
            }
          }
        }
        if (rawOpt.strong !== undefined && typeof rawOpt.strong !== "boolean") {
          add(`Option "${String(oid)}" strong must be a boolean.`);
        }
      }
    }
  }

  // initialStepId must resolve.
  if (isString(data.initialStepId) && !stepIds.has(data.initialStepId)) {
    add(`initialStepId "${data.initialStepId}" is not a defined step.`);
  }

  // Option nextStepId targets must exist (or be the end sentinel).
  if (Array.isArray(data.steps)) {
    for (const rawStep of data.steps) {
      if (!isObject(rawStep) || !Array.isArray(rawStep.options)) continue;
      for (const rawOpt of rawStep.options) {
        if (!isObject(rawOpt)) continue;
        const next = rawOpt.nextStepId;
        if (
          isString(next) &&
          next !== END_STEP_ID &&
          !stepIds.has(next)
        ) {
          add(
            `Option "${String(rawOpt.id)}" points at unknown step "${next}".`
          );
        }
      }
    }
  }

  // Outcomes.
  const outcomeIds = new Set<string>();
  if (!Array.isArray(data.outcomes) || data.outcomes.length === 0) {
    add(`Field "outcomes" must be a non-empty array.`);
  } else {
    for (const [i, rawOut] of data.outcomes.entries()) {
      if (!isObject(rawOut)) {
        add(`outcomes[${i}] must be an object.`);
        continue;
      }
      if (!isString(rawOut.id) || !OUTCOME_IDS.has(rawOut.id as OutcomeId)) {
        add(`outcomes[${i}].id "${String(rawOut.id)}" is not a known outcome.`);
      } else {
        outcomeIds.add(rawOut.id);
      }
      for (const field of ["time", "title", "summary"] as const) {
        if (!isString(rawOut[field])) {
          add(`outcomes[${i}].${field} must be a string.`);
        }
      }
      if (!isString(rawOut.tone) || !TONES.has(rawOut.tone)) {
        add(`outcomes[${i}].tone "${String(rawOut.tone)}" is not valid.`);
      }
    }
  }

  // Outcome rules.
  if (!Array.isArray(data.outcomeRules)) {
    add(`Field "outcomeRules" must be an array.`);
  } else {
    for (const [i, rawRule] of data.outcomeRules.entries()) {
      if (!isObject(rawRule)) {
        add(`outcomeRules[${i}] must be an object.`);
        continue;
      }
      if (
        !isString(rawRule.outcomeId) ||
        !outcomeIds.has(rawRule.outcomeId)
      ) {
        add(
          `outcomeRules[${i}] references outcome "${String(rawRule.outcomeId)}" which is not defined.`
        );
      }
      if (!isNumber(rawRule.priority)) {
        add(`outcomeRules[${i}].priority must be a number.`);
      }
      validateCondition(rawRule.when, `outcomeRules[${i}].when`, {
        add,
        settableFlags,
      });
    }
  }

  // fallbackOutcomeId must be a defined outcome.
  if (
    isString(data.fallbackOutcomeId) &&
    !outcomeIds.has(data.fallbackOutcomeId)
  ) {
    add(
      `fallbackOutcomeId "${data.fallbackOutcomeId}" is not a defined outcome.`
    );
  }

  // missedSignals, if present, must be a string map.
  if (data.missedSignals !== undefined) {
    if (!isObject(data.missedSignals)) {
      add(`Field "missedSignals" must be an object.`);
    } else {
      for (const [k, v] of Object.entries(data.missedSignals)) {
        if (!isString(v)) {
          add(`missedSignals["${k}"] must be a string.`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, scenario: data as unknown as Scenario };
}

type CondCtx = { add: (msg: string) => void; settableFlags: Set<string> };

function validateCondition(
  cond: unknown,
  path: string,
  ctx: CondCtx
): void {
  if (!isObject(cond) || !isString(cond.kind)) {
    ctx.add(`${path} must be a condition object with a "kind".`);
    return;
  }
  if (!CONDITION_KINDS.has(cond.kind)) {
    ctx.add(`${path} has unknown condition kind "${cond.kind}".`);
    return;
  }
  switch (cond.kind) {
    case "metricAtLeast":
    case "metricAtMost":
      if (!isString(cond.metric) || !METRIC_KEYS.has(cond.metric)) {
        ctx.add(`${path} uses unknown metric "${String(cond.metric)}".`);
      }
      if (!isNumber(cond.value)) {
        ctx.add(`${path}.value must be a number.`);
      }
      break;
    case "hasFlag":
    case "lacksFlag":
      if (!isString(cond.flag)) {
        ctx.add(`${path}.flag must be a string.`);
      } else if (!ctx.settableFlags.has(cond.flag)) {
        ctx.add(
          `${path} references flag "${cond.flag}" that no option sets.`
        );
      }
      break;
    case "anyOf":
    case "allOf":
      if (!Array.isArray(cond.conditions) || cond.conditions.length === 0) {
        ctx.add(`${path}.conditions must be a non-empty array.`);
      } else {
        cond.conditions.forEach((c, i) =>
          validateCondition(c, `${path}.conditions[${i}]`, ctx)
        );
      }
      break;
  }
}

export function parseScenarioJson(text: string): ValidationResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: [`Invalid JSON: ${(e as Error).message}`] };
  }
  return validateScenario(data);
}

// --- Structural lint (warnings, not validation errors) ----------------

function collectFlags(cond: Condition, into: Set<string>): void {
  switch (cond.kind) {
    case "hasFlag":
    case "lacksFlag":
      into.add(cond.flag);
      break;
    case "anyOf":
    case "allOf":
      cond.conditions.forEach((c) => collectFlags(c, into));
      break;
  }
}

/**
 * Statically decides whether a condition could ever be true, given the set
 * of flags some option can set and the metric range 0 to 100. Conservative:
 * it catches the common dead-rule cases (a required flag nothing sets,
 * contradictory metric bounds, a flag required present and absent at once)
 * without claiming to prove general satisfiability.
 */
function isSatisfiable(cond: Condition, settable: Set<string>): boolean {
  switch (cond.kind) {
    case "metricAtLeast":
      return cond.value <= 100;
    case "metricAtMost":
      return cond.value >= 0;
    case "hasFlag":
      return settable.has(cond.flag);
    case "lacksFlag":
      return true;
    case "anyOf":
      return cond.conditions.some((c) => isSatisfiable(c, settable));
    case "allOf": {
      if (!cond.conditions.every((c) => isSatisfiable(c, settable))) {
        return false;
      }
      // hasFlag X and lacksFlag X in the same allOf can never both hold.
      const required = new Set<string>();
      const forbidden = new Set<string>();
      for (const c of cond.conditions) {
        if (c.kind === "hasFlag") required.add(c.flag);
        if (c.kind === "lacksFlag") forbidden.add(c.flag);
      }
      for (const f of required) {
        if (forbidden.has(f)) return false;
      }
      return true;
    }
  }
}

/**
 * Structural warnings for a scenario, usable on built-in and imported
 * data: steps no path can reach, flags referenced but set by no option,
 * and outcome rules that can never fire.
 */
export function lintScenario(scenario: Scenario): string[] {
  const warnings: string[] = [];

  // Reachable steps from the initial step.
  const stepsById = new Map(scenario.steps.map((s) => [s.id, s]));
  const reachable = new Set<string>();
  const queue = [scenario.initialStepId];
  while (queue.length > 0) {
    const id = queue.pop()!;
    if (reachable.has(id) || id === END_STEP_ID) continue;
    reachable.add(id);
    const step = stepsById.get(id);
    if (!step) continue;
    for (const option of step.options) {
      queue.push(option.nextStepId);
    }
  }
  for (const step of scenario.steps) {
    if (!reachable.has(step.id)) {
      warnings.push(`Step "${step.id}" is unreachable.`);
    }
  }

  // Flags an option can set.
  const settable = new Set<string>();
  for (const step of scenario.steps) {
    for (const option of step.options) {
      for (const flag of option.flags ?? []) settable.add(flag);
    }
  }
  // Flags referenced in rules but set by no option.
  const referenced = new Set<string>();
  for (const rule of scenario.outcomeRules) {
    collectFlags(rule.when, referenced);
  }
  for (const flag of referenced) {
    if (!settable.has(flag)) {
      warnings.push(`Flag "${flag}" is referenced in a rule but set by no option.`);
    }
  }

  // Rules that can never fire.
  for (const rule of scenario.outcomeRules) {
    if (!isSatisfiable(rule.when, settable)) {
      warnings.push(
        `Outcome rule for "${rule.outcomeId}" (priority ${rule.priority}) can never fire.`
      );
    }
  }

  return warnings;
}
