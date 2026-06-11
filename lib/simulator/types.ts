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

export type DecisionOption = {
  id: string;
  label: string;
  description: string;
  impact: DecisionImpact;
  nextStepId: string;
  flags?: FlagId[];
  consequence?: string;
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
