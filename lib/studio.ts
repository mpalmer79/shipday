import type { Scenario } from "./simulator";

/**
 * Pure helpers behind the authoring studio. The draft is a plain
 * Scenario-shaped object held in component state; these functions cover the
 * parts verify can hold to account: loading JSON into a draft, exporting a
 * draft back to JSON, and routing validator and lint messages to the
 * structure they describe so the studio can show them in place.
 */

/**
 * A draft is scenario-shaped but makes no promise of being valid; the
 * studio runs every draft through the validator live. Loosening the outcome
 * and metric unions to plain strings would buy little (the editors only
 * offer legal values), so the Scenario type is reused directly.
 */
export type ScenarioDraft = Scenario;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function emptyDraft(): ScenarioDraft {
  return {
    id: "",
    name: "",
    tagline: "",
    initialStepId: "",
    initialMetrics: {
      quality: 50,
      speed: 50,
      risk: 20,
      trust: 60,
      focus: 70,
      testConfidence: 50,
    },
    steps: [],
    outcomes: [],
    outcomeRules: [],
    fallbackOutcomeId: "minor-issue",
  };
}

/**
 * Structural normalization so the form can always render: containers the
 * editors iterate (steps, options, impact, flags, overrides, outcomes,
 * rules) are coerced to their container type when the JSON has something
 * else there. A valid scenario passes through unchanged, which is what the
 * round-trip assertion in verify pins; an invalid one becomes editable and
 * its remaining problems surface through live validation.
 */
function normalizeDraft(data: Record<string, unknown>): ScenarioDraft {
  const draft = { ...data } as Record<string, unknown>;
  draft.initialMetrics = isObject(draft.initialMetrics)
    ? draft.initialMetrics
    : {};
  draft.steps = Array.isArray(draft.steps)
    ? draft.steps.map((step) => {
        if (!isObject(step)) {
          return { id: "", time: "", title: "", narrative: "", context: "", options: [] };
        }
        const s = { ...step };
        s.options = Array.isArray(s.options)
          ? s.options.map((option) => {
              if (!isObject(option)) {
                return { id: "", label: "", description: "", impact: {}, nextStepId: "" };
              }
              const o = { ...option };
              o.impact = isObject(o.impact) ? o.impact : {};
              if (o.flags !== undefined && !Array.isArray(o.flags)) {
                o.flags = [];
              }
              if (
                o.consequenceOverrides !== undefined &&
                !Array.isArray(o.consequenceOverrides)
              ) {
                o.consequenceOverrides = [];
              }
              return o;
            })
          : [];
        return s;
      })
    : [];
  draft.outcomes = Array.isArray(draft.outcomes)
    ? draft.outcomes.map((o) => (isObject(o) ? o : {}))
    : [];
  draft.outcomeRules = Array.isArray(draft.outcomeRules)
    ? draft.outcomeRules.map((r) => (isObject(r) ? r : {}))
    : [];
  if (draft.missedSignals !== undefined && !isObject(draft.missedSignals)) {
    delete draft.missedSignals;
  }
  return draft as unknown as ScenarioDraft;
}

export type LoadDraftResult =
  | { ok: true; draft: ScenarioDraft }
  | { ok: false; error: string };

export function loadDraft(text: string): LoadDraftResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Input is not valid JSON: ${message}` };
  }
  if (!isObject(data)) {
    return { ok: false, error: "Scenario JSON must be an object." };
  }
  return { ok: true, draft: normalizeDraft(data) };
}

/** Export matches the import schema exactly: the draft is the scenario. */
export function exportDraft(draft: ScenarioDraft): string {
  return JSON.stringify(draft, null, 2);
}

/**
 * Where in the studio an issue belongs. Validation messages carry their
 * path (`steps[2].options[1].label ...`); lint messages name structures by
 * id. Anything unrecognized lands on the scenario header.
 */
export type IssueTarget =
  | { section: "scenario" }
  | { section: "step"; step: number }
  | { section: "option"; step: number; option: number }
  | { section: "outcome"; outcome: number }
  | { section: "rule"; rule: number };

export function validationTarget(message: string): IssueTarget {
  const option = message.match(/^steps\[(\d+)\]\.options\[(\d+)\]/);
  if (option) {
    return {
      section: "option",
      step: Number(option[1]),
      option: Number(option[2]),
    };
  }
  const step = message.match(/^steps\[(\d+)\]/);
  if (step) {
    return { section: "step", step: Number(step[1]) };
  }
  const outcome = message.match(/^outcomes\[(\d+)\]/);
  if (outcome) {
    return { section: "outcome", outcome: Number(outcome[1]) };
  }
  const rule = message.match(/^outcomeRules\[(\d+)\]/);
  if (rule) {
    return { section: "rule", rule: Number(rule[1]) };
  }
  return { section: "scenario" };
}

export function lintTarget(
  message: string,
  draft: ScenarioDraft
): IssueTarget {
  const unreachable = message.match(/^Unreachable step "(.+)"$/);
  if (unreachable) {
    const index = draft.steps.findIndex((s) => s.id === unreachable[1]);
    if (index >= 0) {
      return { section: "step", step: index };
    }
  }
  const rule = message.match(/^Outcome rule (\d+) /);
  if (rule) {
    return { section: "rule", rule: Number(rule[1]) };
  }
  const override = message.match(
    /consequence override \d+ on ([^/ ]+)\/([^ :]+)/
  );
  if (override) {
    const stepIndex = draft.steps.findIndex((s) => s.id === override[1]);
    const optionIndex =
      stepIndex >= 0
        ? draft.steps[stepIndex].options.findIndex(
            (o) => o.id === override[2]
          )
        : -1;
    if (stepIndex >= 0 && optionIndex >= 0) {
      return { section: "option", step: stepIndex, option: optionIndex };
    }
  }
  return { section: "scenario" };
}
