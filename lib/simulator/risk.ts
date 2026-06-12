/**
 * Risk state classification. The simulator already resolves outcomes at the
 * 40 and 65 risk thresholds; the cinematic layer reads the same two numbers
 * so the global treatment can never disagree with the simulation. This is the
 * single source of truth for both the meter tone and the app-shell treatment.
 */

/** Crossing this, the day stops being calm. */
export const RISK_THRESHOLD_RAISED = 40;
/** Crossing this, the room reads as wrong. */
export const RISK_THRESHOLD_HIGH = 65;

export type RiskState = "calm" | "raised" | "high";

export function riskState(value: number): RiskState {
  if (value >= RISK_THRESHOLD_HIGH) {
    return "high";
  }
  if (value >= RISK_THRESHOLD_RAISED) {
    return "raised";
  }
  return "calm";
}
