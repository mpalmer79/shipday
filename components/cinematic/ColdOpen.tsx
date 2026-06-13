"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  useCinematicSequence,
  type SequenceStage,
} from "@/lib/cinematic/sequence";
import { SkipButton } from "./SkipButton";
import { ClassifiedStamp } from "./ClassifiedStamp";

/**
 * The cold open. On the first visit of a session the landing boots like the
 * opening of a thriller: an agency system coming online, a secure channel
 * opening, a classified briefing assembling, then the product revealed as the
 * assignment. It is an overlay over the already-rendered landing, so it never
 * blocks first paint, the no-JavaScript view, or the page underneath.
 *
 * Skippable with one obvious control, capped at its authored budget, and
 * reduced-motion safe: under the preference (or on a return visit in the same
 * session) it dismisses immediately and the landing is there at once. Decorative
 * throughout and aria-hidden where it is purely visual.
 */
const STAGES: SequenceStage[] = [
  { id: "boot", hold: 950 },
  { id: "channel", hold: 850 },
  { id: "assemble", hold: 1050 },
  { id: "reveal", hold: 750 },
];

const BOOT_LINES = [
  "agency control: cold boot",
  "loading tactical surfaces",
  "mounting case archive",
  "operative clearance: verified",
];

const SESSION_KEY = "shipday.coldopen.seen";

export function ColdOpen() {
  const reducedMotion = useReducedMotion();
  // "pending" until we decide on mount whether to play; this avoids reading
  // sessionStorage or the motion preference during render. The sequence itself
  // is only mounted once the decision is "play", so it always starts with motion
  // allowed and runs its stages; gating it here instead of inside the sequence
  // keeps the run-once-per-session and reduced-motion rules in one place.
  const [decision, setDecision] = useState<"pending" | "play" | "off">(
    "pending"
  );

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen || reducedMotion) {
      setDecision("off");
      return;
    }
    setDecision("play");
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // A blocked storage is not a reason to trap the sequence; it just means
      // the cold open may replay next visit.
    }
  }, [reducedMotion]);

  if (decision !== "play") {
    return null;
  }

  return <ColdOpenSequence onDone={() => setDecision("off")} />;
}

/**
 * The cold-open sequence itself. Mounted only when the cold open is cleared to
 * play, so it always runs with motion allowed and lands on its resting state.
 * Skippable with one focused control; when it finishes or is skipped it reports
 * done so the parent can unmount it and the landing stands alone.
 */
function ColdOpenSequence({ onDone }: { onDone: () => void }) {
  const skipRef = useRef<HTMLButtonElement>(null);
  const { stageId, done, skip } = useCinematicSequence(STAGES, {
    reducedMotion: false,
    onDone,
  });

  useEffect(() => {
    if (!done) {
      skipRef.current?.focus();
    }
  }, [done]);

  if (done) {
    return null;
  }

  const past = (id: string) => STAGE_ORDER[stageId] >= STAGE_ORDER[id];

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-void px-6"
      role="dialog"
      aria-label="ShipDay is starting"
    >
      <div
        aria-hidden="true"
        className="scanlines pointer-events-none absolute inset-0 opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,rgb(var(--accent)/0.12),transparent_60%)]"
      />

      <div className="relative w-full max-w-md">
        <div className="boot-in font-mono text-[11px] leading-relaxed text-signal">
          {BOOT_LINES.map((line, i) => (
            <div
              key={line}
              className="boot-in flex items-center gap-2"
              style={{ animationDelay: `${i * 160}ms` }}
            >
              <span className="text-ink-faint">{">"}</span>
              <span>{line}</span>
              <span className="text-ink-faint">ok</span>
            </div>
          ))}
        </div>

        <div
          className={`mt-8 transition-opacity duration-500 ${
            past("channel") ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            <span>Secure channel</span>
            <span className="text-signal">open</span>
          </div>
          <div className="mt-2 h-px w-full bg-edge/50">
            <div
              className="h-px bg-accent transition-[width] duration-700"
              style={{ width: past("channel") ? "100%" : "0%" }}
            />
          </div>
        </div>

        <div
          className={`mt-8 text-center transition-all duration-500 ${
            past("assemble")
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0"
          }`}
        >
          <ClassifiedStamp label="Classified briefing" />
          <h2 className="mt-4 text-display-sm font-bold tracking-tight text-ink">
            ShipDay
          </h2>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-accent">
            engineering agency operations
          </p>
        </div>

        <div
          className={`mt-6 text-center transition-opacity duration-500 ${
            past("reveal") ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-mono text-[11px] text-ink-muted">
            assignment incoming
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 right-8">
        <SkipButton ref={skipRef} onSkip={skip} label="Skip intro" />
      </div>
    </div>
  );
}

// Stable ordering so a stage comparison reads "have we reached or passed this".
const STAGE_ORDER: Record<string, number> = {
  boot: 0,
  channel: 1,
  assemble: 2,
  reveal: 3,
};
