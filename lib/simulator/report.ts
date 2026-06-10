import type {
  DecisionRecord,
  EndOfDayReport,
  FlagId,
  OutcomeId,
  Scenario,
  SimulatorState,
} from "./types";
import { getOutcome } from "./outcomes";

/**
 * A decision reads as "strong" when its net effect protected the system:
 * it reduced risk or invested in quality / test confidence without
 * gambling. Heuristic by design, tuned alongside scenario copy.
 */
function isStrongDecision(decision: DecisionRecord): boolean {
  const risk = decision.impact.risk ?? 0;
  const quality = decision.impact.quality ?? 0;
  const testConfidence = decision.impact.testConfidence ?? 0;
  return risk < 0 && quality + testConfidence >= 0;
}

/** Flags that indicate a warning sign was visible and ignored. */
const MISSED_SIGNAL_COPY: Record<FlagId, string> = {
  "skipped-validation":
    "Ambiguity in the requirements was visible early and got papered over with assumptions instead of answers.",
  "accepted-ai-unreviewed":
    "Generated code went into the payment path without anyone being able to explain its edge cases.",
  "deleted-failing-test":
    "A failing test was a warning left by a past engineer. Deleting it silenced the warning, not the problem.",
  "shipped-direct":
    "The release went out with no kill switch, so every unverified assumption shipped to every customer at once.",
  "blocked-release":
    "Holding the release was defensible, but nobody who depended on it was told, so caution read as unreliability.",
};

function deriveMissedSignals(state: SimulatorState): string[] {
  return state.flags
    .map((flag) => MISSED_SIGNAL_COPY[flag])
    .filter((copy): copy is string => Boolean(copy));
}

const STAFF_LEVEL_LESSONS: Record<OutcomeId, string> = {
  "safe-rollout":
    "Senior engineers don't ship slower. They ship with options. Every choice today that bought reversibility (a question in writing, a reviewed diff, a feature flag) is why tonight is quiet.",
  "minor-issue":
    "Nothing today was negligent, but small unverified assumptions compound. The difference between a quiet night and a morning patch is usually two or three cheap verification steps taken at the right moments.",
  "customer-incident":
    "No single decision caused this incident. The shortcuts did, together. Risk that is never surfaced doesn't disappear; it accumulates silently until production surfaces it for you, at the worst possible price.",
  "responsible-delay":
    "Shipping late with a clear reason beats shipping wrong on time. The skill on display today wasn't caution. It was making the tradeoff visible so the people who own the deadline could own the decision too.",
  "overcontrolled":
    "Caution without communication is indistinguishable from unreliability. The hold may have been right; the silence made it wrong. Engineering judgment only counts when the people affected by it can see it.",
};

export function generateReport(
  scenario: Scenario,
  state: SimulatorState
): EndOfDayReport {
  if (!state.completed || !state.outcomeId) {
    throw new Error("Cannot generate a report before the day is over.");
  }

  return {
    outcome: getOutcome(scenario, state.outcomeId),
    finalMetrics: state.metrics,
    timeline: state.decisions,
    strongDecisions: state.decisions.filter(isStrongDecision),
    missedSignals: deriveMissedSignals(state),
    staffLevelLesson: STAFF_LEVEL_LESSONS[state.outcomeId],
  };
}
