/**
 * Shared flag vocabulary across scenarios. Outcome rules and report
 * heuristics reference these constants; nothing else should use raw
 * strings. Scenarios may use any subset.
 */
export const FLAGS = {
  askedClarifyingQuestions: "asked-clarifying-questions",
  inspectedExistingCode: "inspected-existing-code",
  acceptedAiUnreviewed: "accepted-ai-unreviewed",
  reviewedAiCode: "reviewed-ai-code",
  deletedFailingTest: "deleted-failing-test",
  investigatedTest: "investigated-test",
  usedFeatureFlag: "used-feature-flag",
  stagedRelease: "staged-release",
  shippedDirect: "shipped-direct",
  delayedRelease: "delayed-release",
  blockedRelease: "blocked-release",
  communicatedTradeoffs: "communicated-tradeoffs",
  skippedValidation: "skipped-validation",
  // Added for The Broken Build: diagnosis discipline.
  reproducedFailure: "reproduced-failure",
  bisectedHistory: "bisected-history",
  // Added for Friday Deploy: rollback readiness.
  preparedRollback: "prepared-rollback",
} as const;
