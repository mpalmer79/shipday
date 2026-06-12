"use client";

import { useEffect, useRef } from "react";
import type { OutcomeDefinition, OutcomeId } from "@/lib/simulator";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  useCinematicSequence,
  type SequenceStage,
} from "@/lib/cinematic/sequence";
import { ClassifiedStamp } from "@/components/cinematic";

type Level = "info" | "ok" | "warn" | "error";
type Line = { text: string; level: Level };

/**
 * System output for each outcome. The script matches what actually happened:
 * a clean ship, a ship with a small problem, a ship that broke and rolled
 * back, a deliberate hold with a plan, and a change strangled by its own
 * gates. Presentation only; the outcome is already decided by the engine
 * before this ever renders.
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

/**
 * The mission verdict for each outcome: the thriller climax line, matched to the
 * real result. Original genre language. The tone drives the colour.
 */
const VERDICTS: Record<OutcomeId, { verdict: string; sub: string }> = {
  "safe-rollout": {
    verdict: "Mission accomplished",
    sub: "Objective secured. No exposure. Exfil clean.",
  },
  "minor-issue": {
    verdict: "Objective met, fallout contained",
    sub: "The package shipped. A small fire, caught and held.",
  },
  "customer-incident": {
    verdict: "Mission compromised",
    sub: "The operation broke in the field. Falling back under fire.",
  },
  "responsible-delay": {
    verdict: "Mission held, by the book",
    sub: "Called off on purpose, with the reasons on the record.",
  },
  overcontrolled: {
    verdict: "Mission stalled out",
    sub: "The gates held the package and never let it move.",
  },
};

const LEVEL_CLASS: Record<Level, string> = {
  info: "text-ink-muted",
  ok: "text-good",
  warn: "text-warn",
  error: "text-bad",
};

const TONE_STAMP: Record<
  OutcomeDefinition["tone"],
  { stamp: "signal" | "classified" | "alert" | "accent"; text: string; ring: string }
> = {
  positive: { stamp: "signal", text: "text-good", ring: "border-good/50" },
  mixed: { stamp: "classified", text: "text-warn", ring: "border-warn/50" },
  negative: { stamp: "alert", text: "text-alert", ring: "border-alert/60" },
  neutral: { stamp: "accent", text: "text-accent", ring: "border-accent/50" },
};

const STAGES: SequenceStage[] = [
  { id: "stream", hold: 1700 },
  { id: "verdict", hold: 900 },
];

/**
 * The full-screen resolution climax. The mission's system output streams in
 * matching the actual outcome, then the verdict lands as a thriller climax
 * matched to the result, then the moment dismisses to reveal the after-action
 * debrief. Skippable with the focused control, capped at its authored budget,
 * and never mounted under reduced motion (the caller gates it off, showing the
 * verdict and report immediately instead).
 */
export function ResolutionSequence({
  outcome,
  onDone,
}: {
  outcome: OutcomeDefinition;
  onDone: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const lines = SCRIPTS[outcome.id];
  const verdict = VERDICTS[outcome.id];
  const tone = TONE_STAMP[outcome.tone];
  const skipRef = useRef<HTMLButtonElement>(null);
  const { stageId, skip } = useCinematicSequence(STAGES, {
    reducedMotion,
    onDone,
  });

  useEffect(() => {
    skipRef.current?.focus();
  }, []);

  const showVerdict = stageId === "verdict";
  const lineDelay = (i: number) =>
    Math.round((i / Math.max(lines.length, 1)) * 1500);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-void/96 px-4 py-10 backdrop-blur-sm"
      role="dialog"
      aria-label="The mission is resolving"
    >
      <div
        aria-hidden="true"
        className="scanlines pointer-events-none absolute inset-0 opacity-50"
      />
      <div className="relative w-full max-w-lg">
        <div className="rounded-lg border border-edge/50 bg-panel/90 p-6 font-mono text-sm shadow-panel">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            <span>Live feed</span>
            <span>End of day {outcome.time}</span>
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
        </div>

        <div
          className={`mt-4 rounded-lg border bg-panel/90 p-6 text-center shadow-panel transition-all duration-500 ${
            tone.ring
          } ${showVerdict ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
        >
          <ClassifiedStamp
            label="Verdict"
            tone={tone.stamp}
            className="mx-auto"
          />
          <div className={`mt-4 text-2xl font-bold tracking-tight ${tone.text}`}>
            {verdict.verdict}
          </div>
          <p className="mt-2 text-sm text-ink-muted">{verdict.sub}</p>
          <div className="mt-4 border-t border-edge/30 pt-3 text-xs uppercase tracking-[0.18em] text-ink-faint">
            {outcome.title}
          </div>
        </div>
      </div>

      <button
        ref={skipRef}
        type="button"
        onClick={skip}
        className="mt-5 rounded-md border border-edge/60 bg-void/70 px-5 py-2 font-mono text-xs font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors hover:border-accent hover:text-ink"
      >
        Skip to debrief
      </button>
    </div>
  );
}
