import type { CSSProperties } from "react";

/**
 * Staged-entrance helper. When active, returns the stage-in animation class
 * and a per-element delay so a group of elements can rise into place in
 * sequence. When inactive (or under reduced motion, which the caller gates on)
 * it returns nothing, so the element renders at rest immediately.
 *
 * Each individual animation stays at the staged-entrance duration (480ms),
 * inside the motion budget; the delays create the pacing, not long durations.
 */
export function stageProps(
  active: boolean,
  delayMs: number
): { className: string; style?: CSSProperties } {
  if (!active) {
    return { className: "" };
  }
  return {
    className: "animate-stage-in",
    style: { animationDelay: `${delayMs}ms` },
  };
}
