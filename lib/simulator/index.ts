export * from "./types";
export {
  applyDecision,
  clampMetrics,
  createInitialState,
  getCurrentStep,
  getStep,
  isComplete,
  SimulatorError,
} from "./engine";
export { evaluateCondition, getOutcome, resolveOutcome } from "./outcomes";
export {
  riskState,
  RISK_THRESHOLD_RAISED,
  RISK_THRESHOLD_HIGH,
} from "./risk";
export type { RiskState } from "./risk";
export { generateReport } from "./report";
export { reconstructRun } from "./replay";
export type { ReplayFrame, ReconstructedRun } from "./replay";
export { METRIC_LABELS, METRIC_ORDER } from "./metrics";
export { reportFilename, reportToMarkdown } from "./exportReport";
export {
  CONDITION_KINDS,
  METRIC_KEYS,
  OUTCOME_IDS,
  OUTCOME_TONES,
  parseScenarioJson,
  validateScenario,
} from "./validate";
export type { ValidationResult } from "./validate";
export {
  CONDITION_KIND_REFERENCE,
  OPTION_SHAPE,
  OUTCOME_SHAPE,
  RULE_SHAPE,
  SCENARIO_SHAPE,
  SCHEMA_SHAPES,
  STEP_SHAPE,
} from "./schemaReference";
export type {
  ConditionKindReference,
  SchemaField,
  SchemaShape,
} from "./schemaReference";
export { lintScenario } from "./lint";
export {
  countPaths,
  enumerateDistribution,
  previewDistribution,
  sampleDistribution,
  PREVIEW_PATH_CEILING,
  PREVIEW_SAMPLE_SIZE,
  PREVIEW_SEED,
} from "./distribution";
export type { Distribution, OutcomeCounts } from "./distribution";
export {
  decodeRunCode,
  encodeRun,
  playRunCode,
  RUN_CODE_VERSION,
} from "./runCode";
export type { DecodedRunCode, PlayedRunCode } from "./runCode";
export { compareRuns } from "./comparison";
export type {
  ChoiceSummary,
  RunComparison,
  StepDiff,
  TrajectoryPoint,
} from "./comparison";
