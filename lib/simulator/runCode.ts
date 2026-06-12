import type { Scenario, SimulatorState } from "./types";
import { applyDecision, createInitialState, getCurrentStep } from "./engine";

/**
 * Shareable run codes. A completed run is encoded as
 *
 *   v1.<scenarioId>.<optionId>.<optionId>...
 *
 * a version token, the scenario id, then the option ids in decision order,
 * dot-joined. Option indices would be shorter, but a scenario edit would
 * silently remap every decision in an old link; option ids fail loudly
 * through the same engine validation every run goes through. Everything
 * here treats the code as untrusted input and returns readable errors
 * instead of throwing.
 */

export const RUN_CODE_VERSION = "v1";

export function encodeRun(
  scenarioId: string,
  optionIds: readonly string[]
): string {
  return [RUN_CODE_VERSION, scenarioId, ...optionIds].join(".");
}

export type DecodedRunCode =
  | { ok: true; scenarioId: string; optionIds: string[] }
  | { ok: false; error: string };

export function decodeRunCode(code: string): DecodedRunCode {
  const trimmed = code.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "The run code is empty." };
  }
  const [version, scenarioId, ...optionIds] = trimmed.split(".");
  if (version !== RUN_CODE_VERSION) {
    return {
      ok: false,
      error: `Unrecognized run code version "${version}". This page understands "${RUN_CODE_VERSION}" codes.`,
    };
  }
  if (!scenarioId) {
    return { ok: false, error: "The run code is missing its scenario id." };
  }
  if (optionIds.length === 0) {
    return {
      ok: false,
      error:
        "The run code carries no decisions. It may have been cut short while copying.",
    };
  }
  if (optionIds.some((id) => id.length === 0)) {
    return {
      ok: false,
      error:
        "The run code contains an empty decision entry. It may have been corrupted while copying.",
    };
  }
  return { ok: true, scenarioId, optionIds };
}

export type PlayedRunCode =
  | { ok: true; state: SimulatorState }
  | { ok: false; error: string };

/**
 * Plays a decoded decision trail through the engine. The trail must walk
 * the scenario exactly to the end of the day: every option must exist at
 * the step the run has reached, and the run must finish with no decisions
 * left over.
 */
export function playRunCode(
  scenario: Scenario,
  optionIds: readonly string[]
): PlayedRunCode {
  let state = createInitialState(scenario);
  for (let i = 0; i < optionIds.length; i += 1) {
    if (state.completed) {
      return {
        ok: false,
        error: `The decision trail continues past the end of the day: ${scenario.name} ends after ${i} decisions, but the code carries ${optionIds.length}.`,
      };
    }
    const step = getCurrentStep(scenario, state);
    const option = step.options.find((o) => o.id === optionIds[i]);
    if (!option) {
      return {
        ok: false,
        error: `Decision ${i + 1} ("${optionIds[i]}") is not an option at the ${step.time} step "${step.title}". The code may come from a different version of the scenario.`,
      };
    }
    state = applyDecision(scenario, state, option.id);
  }
  if (!state.completed) {
    const step = getCurrentStep(scenario, state);
    return {
      ok: false,
      error: `The decision trail ends before the day does: the run is still at the ${step.time} step "${step.title}" after ${optionIds.length} decisions. The code may have been truncated.`,
    };
  }
  return { ok: true, state };
}
