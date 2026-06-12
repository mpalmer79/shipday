export type MetricKey =
  | "quality"
  | "speed"
  | "risk"
  | "trust"
  | "focus"
  | "testConfidence";

export type Metrics = Record<MetricKey, number>;

export type DecisionImpact = Partial<Record<MetricKey, number>>;

/** Documented flag vocabulary lives in scenario data (see data/scenarios). */
export type FlagId = string;

/**
 * A conditional variant of an option's consequence text. The condition is
 * evaluated against the state before the decision's own impacts and flags
 * apply, so it reads the day as the player saw it when choosing. Display
 * only: overrides never touch metrics, flags, or outcome resolution.
 */
export type ConsequenceOverride = {
  when: Condition;
  text: string;
};

export type DecisionOption = {
  id: string;
  label: string;
  description: string;
  impact: DecisionImpact;
  nextStepId: string;
  flags?: FlagId[];
  consequence?: string;
  /**
   * Ordered list of conditional consequences. The first override whose
   * condition holds wins; `consequence` is the fallback when none match.
   */
  consequenceOverrides?: ConsequenceOverride[];
  lesson?: string;
  /**
   * Curated marker: true means this option is a deliberate strong decision
   * worth surfacing in the report. A scenario that marks any option is
   * treated as curated; scenarios with no markers fall back to a heuristic.
   */
  strong?: boolean;
};

export type ScenarioStep = {
  id: string;
  time: string;
  title: string;
  narrative: string;
  context: string;
  options: DecisionOption[];
  codeSnippet?: string;
  systemSignals?: string[];
};

export type OutcomeId =
  | "safe-rollout"
  | "minor-issue"
  | "customer-incident"
  | "responsible-delay"
  | "overcontrolled";

export type OutcomeDefinition = {
  id: OutcomeId;
  time: string;
  title: string;
  summary: string;
  tone: "positive" | "mixed" | "negative" | "neutral";
};

/**
 * Declarative, serializable predicates so outcome rules live in data,
 * not code. This directly enables scenario JSON import later.
 */
export type Condition =
  | { kind: "metricAtLeast"; metric: MetricKey; value: number }
  | { kind: "metricAtMost"; metric: MetricKey; value: number }
  | { kind: "hasFlag"; flag: FlagId }
  | { kind: "lacksFlag"; flag: FlagId }
  | { kind: "anyOf"; conditions: Condition[] }
  | { kind: "allOf"; conditions: Condition[] };

export type OutcomeRule = {
  outcomeId: OutcomeId;
  /** Lower number evaluated first. */
  priority: number;
  when: Condition;
};

export type Scenario = {
  id: string;
  name: string;
  tagline: string;
  initialStepId: string;
  initialMetrics: Metrics;
  steps: ScenarioStep[];
  outcomes: OutcomeDefinition[];
  outcomeRules: OutcomeRule[];
  /** Guarantees outcome resolution always terminates. */
  fallbackOutcomeId: OutcomeId;
  /**
   * Scenario-specific missed-signal copy keyed by flag. Used in preference
   * to the shared fallback copy in the report. A scenario authors text for
   * the warning-sign flags it can set.
   */
  missedSignals?: Partial<Record<FlagId, string>>;
};

export type DecisionRecord = {
  stepId: string;
  optionId: string;
  stepTitle: string;
  stepTime: string;
  optionLabel: string;
  impact: DecisionImpact;
  /**
   * The consequence text resolved at decision time (overrides applied
   * against the pre-decision state). Replay, the report, and comparison
   * read this record; nothing re-resolves it later.
   */
  consequence?: string;
  lesson?: string;
  /** Carried from the chosen option's curated strong marker. */
  strong?: boolean;
};

export type SimulatorState = {
  scenarioId: string;
  currentStepId: string;
  metrics: Metrics;
  flags: FlagId[];
  decisions: DecisionRecord[];
  completed: boolean;
  outcomeId?: OutcomeId;
};

export type EndOfDayReport = {
  outcome: OutcomeDefinition;
  finalMetrics: Metrics;
  timeline: DecisionRecord[];
  strongDecisions: DecisionRecord[];
  missedSignals: string[];
  staffLevelLesson: string;
};

/** Sentinel `nextStepId` marking the end of the workday. */
export const END_STEP_ID = "__end__";
