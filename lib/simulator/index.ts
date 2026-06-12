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
export { generateReport } from "./report";
export { reconstructRun } from "./replay";
export type { ReplayFrame, ReconstructedRun } from "./replay";
export { METRIC_LABELS, METRIC_ORDER } from "./metrics";
export { reportFilename, reportToMarkdown } from "./exportReport";
export {
  METRIC_KEYS,
  OUTCOME_IDS,
  parseScenarioJson,
  validateScenario,
} from "./validate";
export type { ValidationResult } from "./validate";
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
