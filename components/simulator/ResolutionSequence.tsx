"use client";

import { useEffect, useRef } from "react";
import type { OutcomeDefinition, OutcomeId } from "@/lib/simulator";

type Level = "info" | "ok" | "warn" | "error";
type Line = { text: string; level: Level };

/**
 * System output for each outcome. The script matches what actually happened:
 * a clean ship, a ship with a small problem, a ship that broke and rolled
 * back, a deliberate hold with a plan, and a change strangled by its own
 * gates. A flagged rollout, a direct ship, and a hold all resolve differently
 * here because they resolve to different outcomes upstream. Presentation only;
 * the outcome is already decided by the engine before this ever renders.
 */
const SCRIPTS: Record<OutcomeId, Line[]> = {
  "safe-rollout": [
    { text: "ci: running test suite", level: "info" },
    { text: "ci: 214 passed, 0 failed", level: "ok" },
    { text: "deploy: rolling out to production", level: "info" },
    { text: "deploy: health checks green", level: "ok" },
    { text: "deploy: rollout complete", level: "ok" },
  ],
  "minor-issue": [
    { text: "ci: running test suite", level: "info" },
    { text: "ci: 213 passed, 1 skipped", level: "warn" },
    { text: "deploy: rolling out to production", level: "info" },
    { text: "deploy: error rate up 0.4 percent", level: "warn" },
    { text: "deploy: within tolerance, left running", level: "warn" },
  ],
  "customer-incident": [
    { text: "ci: running test suite", level: "info" },
    { text: "ci: 214 passed, 0 failed", level: "ok" },
    { text: "deploy: rolling out to production", level: "info" },
    { text: "alert: error rate 11 percent and climbing", level: "error" },
    { text: "deploy: rolling back", level: "error" },
  ],
  "responsible-delay": [
    { text: "release: change held for review", level: "info" },
    { text: "release: rollback plan attached", level: "ok" },
    { text: "release: deploy deferred to next window", level: "info" },
    { text: "release: nothing shipped today", level: "info" },
  ],
  overcontrolled: [
    { text: "ci: running test suite", level: "info" },
    { text: "ci: 214 passed, 0 failed", level: "ok" },
    { text: "review: another approval still pending", level: "warn" },
    { text: "release: window closed, deploy blocked", level: "error" },
    { text: "release: nothing shipped today", level: "warn" },
  ],
};

const LEVEL_CLASS: Record<Level, string> = {
  info: "text-ink-muted",
  ok: "text-good",
  warn: "text-warn",
  error: "text-bad",
};

/** The whole moment, capped here and matched to the token in globals.css. */
const RESOLUTION_MS = 2500;
const VERDICT_DELAY_MS = 1900;
const LINES_WINDOW_MS = 1700;

/**
 * The full-screen resolution moment. System output streams in matching the
 * actual outcome, then the verdict lands, then the moment dismisses to reveal
 * the debrief. Skippable with the focused button, capped at 2.5 seconds, and
 * never mounted under reduced motion (the caller gates it off there, showing
 * the verdict and report immediately instead).
 */
export function ResolutionSequence({
  outcome,
  onDone,
}: {
  outcome: OutcomeDefinition;
  onDone: () => void;
}) {
  const lines = SCRIPTS[outcome.id];
  const skipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    skipRef.current?.focus();
    const timer = setTimeout(onDone, RESOLUTION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  const lineDelay = (i: number) =>
    Math.round((i / Math.max(lines.length, 1)) * LINES_WINDOW_MS);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface/95 px-4 backdrop-blur-sm"
      role="dialog"
      aria-label="The day is resolving"
    >
      <div className="w-full max-w-lg rounded-lg border border-surface-line bg-surface-raised p-6 font-mono text-sm">
        <div className="mb-3 text-[10px] uppercase tracking-wider text-ink-faint">
          End of day {outcome.time}
        </div>
        <ul className="space-y-1.5">
          {lines.map((line, i) => (
            <li
              key={i}
              className={`animate-stage-in ${LEVEL_CLASS[line.level]}`}
              style={{ animationDelay: `${lineDelay(i)}ms` }}
            >
              <span className="text-ink-faint">$ </span>
              {line.text}
            </li>
          ))}
        </ul>
        <div
          className="mt-4 animate-stage-in border-t border-surface-line pt-4"
          style={{ animationDelay: `${VERDICT_DELAY_MS}ms` }}
        >
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">
            Verdict
          </span>
          <div className="mt-1 text-base font-bold text-ink">
            {outcome.title}
          </div>
        </div>
      </div>
      <button
        ref={skipRef}
        type="button"
        onClick={onDone}
        className="mt-5 rounded-lg border border-surface-line px-5 py-2 text-xs font-medium text-ink-muted transition-colors hover:border-accent hover:text-ink"
      >
        Skip
      </button>
    </div>
  );
}
