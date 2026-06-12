"use client";

import { useEffect, useRef } from "react";
import type { Scenario } from "@/lib/simulator";
import { METRIC_LABELS, METRIC_ORDER } from "@/lib/simulator";
import type { ScenarioDifficulty } from "@/data/scenarios";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  useCinematicSequence,
  type SequenceStage,
} from "@/lib/cinematic/sequence";
import {
  codenameFor,
  directiveFor,
  fileTagFor,
  threatFor,
} from "@/lib/cinematic/dossier";
import { parseClock } from "@/lib/cinematic/clock";
import { ClassifiedStamp } from "./ClassifiedStamp";
import { ThreatBadge } from "./ThreatBadge";
import { DecodeText } from "./DecodeText";
import { SkipButton } from "./SkipButton";

const STAGES: SequenceStage[] = [
  { id: "open", hold: 850 },
  { id: "directive", hold: 1050 },
  { id: "stakes", hold: 950 },
  { id: "arm", hold: 950 },
];

const ORDER: Record<string, number> = {
  open: 0,
  directive: 1,
  stakes: 2,
  arm: 3,
};

/** Format the window length between two clock labels as "H:MM:SS". */
function windowLength(start: string, end: string): string {
  const s = parseClock(start);
  const e = parseClock(end);
  if (s === null || e === null || e <= s) {
    return "8:00:00";
  }
  const mins = e - s;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, "0")}:00`;
}

/**
 * The mission briefing. Starting a scenario plays this full-screen sequence: the
 * case file opens, the directive is read into the record, the stakes and threat
 * are stated, and the mission clock is armed before handing off into the
 * workday. The most cinematic moment in the product.
 *
 * It is an overlay over the already-mounted workday, so skipping or finishing
 * just removes it and play continues with no layout shift. Skippable with one
 * focused control, capped at its authored budget, and never mounted under
 * reduced motion (the caller gates it off, showing the workday at once).
 */
export function MissionBriefing({
  scenario,
  difficulty,
  onDismiss,
}: {
  scenario: Scenario;
  difficulty?: ScenarioDifficulty;
  onDismiss: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const skipRef = useRef<HTMLButtonElement>(null);
  const { stageId, done, skip } = useCinematicSequence(STAGES, {
    reducedMotion,
    onDone: onDismiss,
  });

  useEffect(() => {
    skipRef.current?.focus();
  }, []);

  const codename = codenameFor(scenario.id);
  const threat = threatFor(difficulty);
  const directive = directiveFor(scenario.id, scenario.tagline);
  const fileTag = fileTagFor(scenario.id);
  const firstStep = scenario.steps.find((s) => s.id === scenario.initialStepId);
  const dayStart = firstStep?.time ?? "9:00 AM";
  const endOfDay = scenario.outcomes[0]?.time ?? "5:00 PM";
  const window = windowLength(dayStart, endOfDay);

  if (done) {
    return null;
  }

  const reached = (id: string) => ORDER[stageId] >= ORDER[id];

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center overflow-y-auto bg-void/96 px-4 py-10 backdrop-blur-sm"
      role="dialog"
      aria-label={`Mission briefing: ${codename}`}
    >
      <div
        aria-hidden="true"
        className="scanlines pointer-events-none absolute inset-0 opacity-50"
      />
      <div className="relative w-full max-w-xl rounded-lg border border-edge/50 bg-panel/90 p-6 shadow-panel sm:p-8">
        <div className="flex items-center justify-between">
          <ClassifiedStamp label="Mission briefing" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Case {fileTag}
          </span>
        </div>

        <div className="mt-6 boot-in">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Operation
          </p>
          <h2 className="mt-1 font-mono text-3xl font-bold uppercase tracking-[0.1em] text-ink">
            <DecodeText text={codename} active={!reducedMotion} />
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{scenario.name}</p>
        </div>

        <div
          className={`mt-6 transition-all duration-500 ${
            reached("directive")
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0"
          }`}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Directive
          </p>
          <p className="mt-2 text-base leading-relaxed text-ink">{directive}</p>
        </div>

        <div
          className={`mt-6 grid grid-cols-2 gap-4 transition-all duration-500 ${
            reached("stakes")
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0"
          }`}
        >
          <div className="rounded-md border border-edge/40 bg-void/50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              Threat
            </p>
            <div className="mt-2">
              <ThreatBadge threat={threat} />
            </div>
          </div>
          <div className="rounded-md border border-edge/40 bg-void/50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              Objective
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Ship safely by {endOfDay}, or call it off and own the call.
            </p>
          </div>
        </div>

        <div
          className={`mt-4 transition-all duration-500 ${
            reached("stakes") ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Starting readout
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {METRIC_ORDER.map((key) => (
              <div
                key={key}
                className="rounded border border-edge/30 bg-void/40 px-2 py-1.5 text-center"
              >
                <div className="font-mono text-sm font-semibold text-ink">
                  {scenario.initialMetrics[key]}
                </div>
                <div className="mt-0.5 text-[9px] uppercase tracking-wide text-ink-faint">
                  {METRIC_LABELS[key]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`mt-6 flex items-center justify-between rounded-md border border-accent/40 bg-accent/5 px-4 py-3 transition-all duration-500 ${
            reached("arm")
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0"
          }`}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
            Mission clock armed
          </span>
          <span
            className={`countdown-tracking font-mono text-xl font-bold text-accent ${
              reached("arm") && !reducedMotion ? "clock-pulse" : ""
            }`}
          >
            T-{window}
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            {reached("arm") ? "You are on the clock" : "Briefing in progress"}
          </span>
          <SkipButton ref={skipRef} onSkip={skip} label="Skip briefing" />
        </div>
      </div>
    </div>
  );
}
