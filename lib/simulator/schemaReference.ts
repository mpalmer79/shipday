import { CONDITION_KINDS, METRIC_KEYS, OUTCOME_IDS, OUTCOME_TONES } from "./validate";

/**
 * A compact, human-readable description of the scenario format, generated from
 * the same constants the validator enforces (metric keys, outcome ids, tones,
 * condition kinds). The import and studio pages render this as an in-UI
 * cheatsheet; because the enumerations below are imported rather than retyped,
 * the reference cannot drift from the validator, and a test pins the condition
 * kinds to the validator's own list.
 */

export type SchemaField = {
  name: string;
  type: string;
  required: boolean;
  note?: string;
};

export type SchemaShape = {
  title: string;
  blurb: string;
  fields: SchemaField[];
};

/** One condition kind and the fields it carries, keyed by the validator kind. */
export type ConditionKindReference = {
  kind: (typeof CONDITION_KINDS)[number];
  fields: string;
  description: string;
};

export const SCENARIO_SHAPE: SchemaShape = {
  title: "Scenario",
  blurb: "The top-level object. One simulated workday.",
  fields: [
    { name: "id", type: "string", required: true, note: "non-empty, kebab-case" },
    { name: "name", type: "string", required: true },
    { name: "tagline", type: "string", required: true },
    {
      name: "initialStepId",
      type: "string",
      required: true,
      note: "must match a step id",
    },
    {
      name: "initialMetrics",
      type: "object",
      required: true,
      note: `all of: ${METRIC_KEYS.join(", ")}`,
    },
    { name: "steps", type: "Step[]", required: true, note: "non-empty" },
    { name: "outcomes", type: "Outcome[]", required: true, note: "non-empty" },
    {
      name: "outcomeRules",
      type: "Rule[]",
      required: true,
      note: "may be empty; no rule matching means the fallback is used",
    },
    {
      name: "fallbackOutcomeId",
      type: "OutcomeId",
      required: true,
      note: "must match an outcome id",
    },
    {
      name: "missedSignals",
      type: "Record<flag, string>",
      required: false,
      note: "copy shown when a warning-sign flag was set",
    },
  ],
};

export const STEP_SHAPE: SchemaShape = {
  title: "Step",
  blurb: "One moment in the day with a set of choices.",
  fields: [
    { name: "id", type: "string", required: true, note: "unique within the scenario" },
    { name: "time", type: "string", required: true, note: 'e.g. "9:00 AM"' },
    { name: "title", type: "string", required: true },
    { name: "narrative", type: "string", required: true },
    { name: "context", type: "string", required: true },
    { name: "options", type: "Option[]", required: true, note: "non-empty" },
  ],
};

export const OPTION_SHAPE: SchemaShape = {
  title: "Option",
  blurb: "A single decision the player can take at a step.",
  fields: [
    { name: "id", type: "string", required: true, note: "unique within the step" },
    { name: "label", type: "string", required: true },
    { name: "description", type: "string", required: true },
    {
      name: "impact",
      type: "Partial<Metrics>",
      required: true,
      note: "metric deltas applied on this choice",
    },
    {
      name: "nextStepId",
      type: "string",
      required: true,
      note: '"__end__" ends the run, else a step id',
    },
    { name: "flags", type: "string[]", required: false, note: "flags this choice sets" },
  ],
};

export const OUTCOME_SHAPE: SchemaShape = {
  title: "Outcome",
  blurb: "An end state the day can resolve to.",
  fields: [
    {
      name: "id",
      type: "OutcomeId",
      required: true,
      note: `one of: ${OUTCOME_IDS.join(", ")}`,
    },
    { name: "time", type: "string", required: true },
    { name: "title", type: "string", required: true },
    { name: "summary", type: "string", required: true },
    {
      name: "tone",
      type: "string",
      required: true,
      note: `one of: ${OUTCOME_TONES.join(", ")}`,
    },
  ],
};

export const RULE_SHAPE: SchemaShape = {
  title: "Outcome rule",
  blurb:
    "Rules are sorted ascending by priority and the first whose condition holds wins; otherwise the fallback outcome is used.",
  fields: [
    { name: "outcomeId", type: "OutcomeId", required: true },
    { name: "priority", type: "number", required: true, note: "lower runs first" },
    { name: "when", type: "Condition", required: true },
  ],
};

/**
 * The six condition kinds, one entry per validator kind. The kinds here are
 * pinned to CONDITION_KINDS by a test, so adding a kind to the validator
 * without documenting it fails the build.
 */
export const CONDITION_KIND_REFERENCE: ConditionKindReference[] = [
  {
    kind: "metricAtLeast",
    fields: "{ metric, value }",
    description: "metric is at or above value",
  },
  {
    kind: "metricAtMost",
    fields: "{ metric, value }",
    description: "metric is at or below value",
  },
  {
    kind: "hasFlag",
    fields: "{ flag }",
    description: "the run set this flag",
  },
  {
    kind: "lacksFlag",
    fields: "{ flag }",
    description: "the run did not set this flag",
  },
  {
    kind: "anyOf",
    fields: "{ conditions }",
    description: "at least one nested condition holds",
  },
  {
    kind: "allOf",
    fields: "{ conditions }",
    description: "every nested condition holds",
  },
];

export const SCHEMA_SHAPES: SchemaShape[] = [
  SCENARIO_SHAPE,
  STEP_SHAPE,
  OPTION_SHAPE,
  OUTCOME_SHAPE,
  RULE_SHAPE,
];
