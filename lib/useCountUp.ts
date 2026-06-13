"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Animates a displayed integer from its previous value up (or down) to a new
 * target whenever the target changes, so a metric visibly counts to its new
 * reading rather than snapping. Purely presentational: it is driven entirely by
 * the target prop the deterministic engine produces and never feeds back into
 * state. Under prefers-reduced-motion it returns the target immediately with no
 * animation, honouring the app's motion contract.
 *
 * The first value shown is the initial target (no count-up on mount); only
 * subsequent changes animate, easing out over the given duration.
 */
export function useCountUp(target: number, durationMs = 450): number {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(target);
  // The current on-screen value, read at the moment the target changes so an
  // animation already in flight hands off smoothly instead of jumping.
  const displayRef = useRef(target);
  displayRef.current = display;
  const rafRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(target);
      return;
    }
    const from = displayRef.current;
    if (from === target) {
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs, reducedMotion]);

  return reducedMotion ? target : display;
}
