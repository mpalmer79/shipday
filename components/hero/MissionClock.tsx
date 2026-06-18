"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * The hero mission clock: a live T-minus to end of day that makes the hero feel
 * like it is already running, matching the copy ("the clock is already
 * running"). It is decorative atmosphere — aria-hidden — so the heading still
 * carries all the meaning for assistive tech.
 *
 * It inherits the app's escalation language for free: it lives inside the
 * hero's `data-risk` section, so the `countdown-tracking` utility widens its
 * letter-spacing as risk rises (calm 0.04em -> raised 0.1em -> high 0.16em) and
 * the accent colour warms with the same tokens. Under reduced motion it renders
 * a fixed, non-ticking time and drops the pulse, so it never animates.
 *
 * The countdown is cosmetic: it counts a workday down from 08:00:00, loops, and
 * carries no real state. It is intentionally not tied to the simulator clock.
 */

const START_SECONDS = 8 * 3600; // an 8-hour shift, T-08:00:00 at the top

function format(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `T-${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function MissionClock({ className = "" }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  const [remaining, setRemaining] = useState(START_SECONDS);

  useEffect(() => {
    if (reducedMotion) {
      return; // hold a static face; no ticking under the preference
    }
    const id = window.setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : START_SECONDS));
    }, 1000);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
        mission clock
      </span>
      <span
        className={`countdown-tracking font-mono text-sm font-semibold text-accent ${
          reducedMotion ? "" : "clock-pulse"
        }`}
      >
        {format(remaining)}
      </span>
    </span>
  );
}

export default MissionClock;
