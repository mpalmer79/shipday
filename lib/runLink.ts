import { findScenario } from "@/data/scenarios";
import {
  decodeRunCode,
  getOutcome,
  playRunCode,
  type OutcomeDefinition,
  type Scenario,
  type SimulatorState,
} from "@/lib/simulator";

/**
 * Resolves a shared run link or bare run code against the built-in
 * registry. The code format itself lives in lib/simulator/runCode.ts; this
 * layer adds the registry lookup, which is why only built-in scenarios can
 * travel by link: the code carries the scenario id, not the scenario.
 */

/** Accepts a full link or a bare code; pulls the code parameter if present. */
export function extractRunCode(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/[?&]code=([^&#]+)/);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return trimmed;
}

export type LoadedRun = {
  scenario: Scenario;
  /** A completed state replayed from the code. */
  state: SimulatorState;
  outcome: OutcomeDefinition;
};

export type LoadRunResult =
  | { ok: true; run: LoadedRun }
  | { ok: false; error: string };

export function loadRunFromCode(code: string): LoadRunResult {
  const decoded = decodeRunCode(code);
  if (!decoded.ok) {
    return decoded;
  }
  const scenario = findScenario(decoded.scenarioId);
  if (!scenario) {
    return {
      ok: false,
      error: `No built-in scenario is named "${decoded.scenarioId}". Run links can only carry built-in scenarios.`,
    };
  }
  const played = playRunCode(scenario, decoded.optionIds);
  if (!played.ok) {
    return played;
  }
  return {
    ok: true,
    run: {
      scenario,
      state: played.state,
      outcome: getOutcome(scenario, played.state.outcomeId!),
    },
  };
}
