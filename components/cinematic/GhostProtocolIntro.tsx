"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { createFuseEngine } from "@/lib/cinematic/fuseEngine";
import { SkipButton } from "./SkipButton";

/**
 * The Ghost Protocol cold open. On the first visit of a session the landing
 * boots like the opening of the film: out of a dark screen a white-hot spark
 * ignites and races a bending path across the frame, throwing orange-and-white
 * sparks and dragging a traveling pool of warm light with it. As it travels,
 * rapid "memory flashes" stutter on screen with motion blur and chromatic
 * aberration, the title and credits burn in as the spark sweeps past them, and
 * the run ends on a detonation that whites out and fades to reveal the page.
 *
 * It is an overlay over the already-rendered landing, so it never blocks first
 * paint or the no-JavaScript view. Skippable with one obvious control, capped
 * at a fixed 4.5s budget, and reduced-motion safe: under the preference (or on a
 * return visit in the same session) it never mounts and the landing stands
 * alone. Decorative throughout and aria-hidden where purely visual.
 */

// The authored timeline, in milliseconds. Every phase is derived from these so
// the canvas engine and the DOM stages stay locked to one budget. After the
// fuse travels and the charge detonates, a slow 4s reveal fades the whole
// overlay out so the homepage underneath fades into view.
const TRAVEL_MS = 3000;
const DETONATE_MS = 1300; // bloom -> whiteout -> settle to void
const REVEAL_MS = 4000; // the 4s fade-in of the homepage after the animation
const TOTAL_MS = TRAVEL_MS + DETONATE_MS + REVEAL_MS;

const SESSION_KEY = "shipday.ghostintro.seen";

// Memory flashes: 4-5 placeholder frames, each on screen for 150-300ms, fired
// in a rhythmic stutter across the travel window. Positions and tints are
// authored so the burst feels composed rather than random.
type Flash = {
  id: number;
  at: number;
  dur: number;
  className: string;
  style: React.CSSProperties;
  label: string;
};

const FLASHES: Flash[] = [
  {
    id: 1,
    at: 520,
    dur: 220,
    label: "MEM // 0x1A",
    className: "left-[12%] top-[22%] h-40 w-64 -rotate-3",
    style: { background: "linear-gradient(135deg,#3a1d0a,#f59e42,#1a0c04)" },
  },
  {
    id: 2,
    at: 980,
    dur: 170,
    label: "REC // 0x2F",
    className: "right-[10%] top-[16%] h-48 w-72 rotate-2",
    style: { background: "linear-gradient(120deg,#0c1320,#5ba8f5,#06080d)" },
  },
  {
    id: 3,
    at: 1480,
    dur: 270,
    label: "FRAME // 0x3C",
    className: "left-[18%] bottom-[18%] h-44 w-80 rotate-1",
    style: { background: "linear-gradient(150deg,#1a0c04,#ff7a1a,#3a1d0a)" },
  },
  {
    id: 4,
    at: 2020,
    dur: 160,
    label: "TRACE // 0x4D",
    className: "right-[16%] bottom-[20%] h-40 w-64 -rotate-2",
    style: { background: "linear-gradient(135deg,#06080d,#9aa6b8,#0c1320)" },
  },
  {
    id: 5,
    at: 2520,
    dur: 200,
    label: "BURST // 0x5E",
    className: "left-1/2 top-1/3 h-52 w-80 -translate-x-1/2 rotate-1",
    style: { background: "linear-gradient(120deg,#3a1d0a,#ffd08a,#ff5a14)" },
  },
];

// Title and credits burn in in sequence as the spark sweeps past them. Each is
// rendered only once its cue fires, so the burn-in animation plays on mount.
type BurnLine = {
  id: number;
  at: number;
  className: string;
  text: string;
};

const BURN_LINES: BurnLine[] = [
  {
    id: 1,
    at: 760,
    className: "font-mono text-xs uppercase tracking-[0.5em] text-classified",
    text: "Mission file",
  },
  {
    id: 2,
    at: 1280,
    className: "text-display font-bold tracking-tight text-ink",
    text: "ShipDay",
  },
  {
    id: 3,
    at: 1980,
    className: "font-mono text-[11px] uppercase tracking-[0.34em] text-ink-muted",
    text: "an engineering agency operation",
  },
  {
    id: 4,
    at: 2560,
    className: "font-mono text-[11px] uppercase tracking-[0.3em] text-accent",
    text: "your assignment is incoming",
  },
];

export function GhostProtocolIntro() {
  const reducedMotion = useReducedMotion();
  // "pending" until we decide on mount whether to play, mirroring the cold-open
  // pattern: never read sessionStorage or the motion preference during render.
  const [decision, setDecision] = useState<"pending" | "play" | "off">("pending");

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
      // Blocked storage just means the intro may replay next visit.
    }
  }, [reducedMotion]);

  if (decision !== "play") {
    return null;
  }

  return <GhostProtocolSequence onDone={() => setDecision("off")} />;
}

/**
 * The sequence itself, mounted only when cleared to play, so it always runs
 * with motion allowed and lands on its resting state (unmounted, page revealed).
 */
function GhostProtocolSequence({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [visibleFlashes, setVisibleFlashes] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [detonating, setDetonating] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [finished, setFinished] = useState(false);

  // One scheduler drives the whole run off real timers; the canvas engine runs
  // its own rAF loop against the same budget. finish() tears everything down.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    skipRef.current?.focus();

    const engine = createFuseEngine(canvas, {
      durationMs: TRAVEL_MS,
      onComplete: () => setDetonating(true),
    });
    engine.start();

    const add = (set: React.Dispatch<React.SetStateAction<Set<number>>>, id: number) =>
      set((prev) => new Set(prev).add(id));
    const remove = (set: React.Dispatch<React.SetStateAction<Set<number>>>, id: number) =>
      set((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

    for (const flash of FLASHES) {
      timers.current.push(setTimeout(() => add(setVisibleFlashes, flash.id), flash.at));
      timers.current.push(
        setTimeout(() => remove(setVisibleFlashes, flash.id), flash.at + flash.dur)
      );
    }
    for (const line of BURN_LINES) {
      timers.current.push(setTimeout(() => add(setRevealed, line.id), line.at));
    }
    // Detonation is armed on a timer as a backstop to the engine callback. When
    // it settles, the 4s reveal fades the overlay out so the homepage fades into
    // view, then the whole overlay reports done at the end of the budget.
    timers.current.push(setTimeout(() => setDetonating(true), TRAVEL_MS));
    timers.current.push(
      setTimeout(() => setRevealing(true), TRAVEL_MS + DETONATE_MS)
    );
    timers.current.push(
      setTimeout(() => {
        setFinished(true);
        onDone();
      }, TOTAL_MS)
    );

    const captured = timers.current;
    return () => {
      engine.dispose();
      captured.forEach(clearTimeout);
      timers.current = [];
    };
    // Authored once per mount; the gates are intentionally the only deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setFinished(true);
    onDone();
  };

  // Allow Escape and Enter/Space (button) to dismiss; one obvious control plus
  // the keyboard escape hatch every overlay in this app offers.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (finished) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[70] overflow-hidden bg-void ${
        revealing ? "gp-reveal pointer-events-none" : ""
      }`}
      style={revealing ? { animationDuration: `${REVEAL_MS}ms` } : undefined}
      role="dialog"
      aria-label="ShipDay is starting"
    >
      {/* The bending spark, its sparks, and the traveling light all render here. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      />

      {/* The sweeping-camera layer: title, credits, and the stutter of memory
          flashes drift slowly as one group while the spark travels. */}
      <div className="gp-camera pointer-events-none absolute inset-0">
        {FLASHES.map((flash) =>
          visibleFlashes.has(flash.id) ? (
            <div
              key={flash.id}
              aria-hidden="true"
              className={`gp-flash absolute overflow-hidden rounded-md ring-1 ring-ink/20 ${flash.className}`}
              style={{ ...flash.style, ["--gp-flash-dur" as string]: `${flash.dur}ms` }}
            >
              <span className="absolute bottom-1 left-2 font-mono text-[9px] uppercase tracking-[0.3em] text-ink/70">
                {flash.label}
              </span>
              <span className="gp-flash-scan absolute inset-0" />
            </div>
          ) : null
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          {BURN_LINES.map((line) =>
            revealed.has(line.id) ? (
              <div key={line.id} className={`gp-burn ${line.className}`}>
                {line.text}
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* The detonation: a white-hot core blooms from the centre, whites the
          screen out, then settles to void so the overlay can fade away. */}
      {detonating ? (
        <div
          aria-hidden="true"
          className="gp-detonate pointer-events-none absolute left-1/2 top-[47%] z-10 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        />
      ) : null}

      {/* The skip control retires once the charge detonates; Escape still ends
          the run during the detonation and reveal. */}
      {!detonating ? (
        <div className="absolute bottom-8 right-8 z-20">
          <SkipButton ref={skipRef} onSkip={skip} label="Skip intro" />
        </div>
      ) : null}
    </div>
  );
}
