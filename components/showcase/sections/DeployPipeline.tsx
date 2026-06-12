"use client";

import { useEffect, useRef, useState } from "react";
import { GlowPanel } from "../GlowPanel";
import { PipelineStage, type StageStatus } from "../PipelineStage";
import { useInView } from "@/lib/useInView";
import { useReducedMotion } from "@/lib/useReducedMotion";

const STAGES: { name: string; duration: string }[] = [
  { name: "Lint", duration: "2s" },
  { name: "Type check", duration: "6s" },
  { name: "Unit tests", duration: "31s" },
  { name: "Build", duration: "48s" },
  { name: "Deploy to staging", duration: "22s" },
  { name: "Smoke test", duration: "9s" },
];

const STEP_MS = 850;

/**
 * A deploy pipeline that runs its stages once when it scrolls into view, then
 * rests at all-passed. It defaults to the finished state, so without JavaScript
 * and under reduced motion it shows a coherent, fully passed pipeline; the live
 * run is an enhancement that replays only when the panel is seen with motion
 * allowed. The progression is a finite sequence of short state changes, not a
 * loop. Set dressing: no real build runs here.
 */
export function DeployPipeline() {
  const reducedMotion = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [active, setActive] = useState(STAGES.length); // default: finished
  const started = useRef(false);

  // Start the run once, when seen with motion allowed.
  useEffect(() => {
    if (reducedMotion || !inView || started.current) {
      return;
    }
    started.current = true;
    setActive(0);
  }, [reducedMotion, inView]);

  // Advance through the stages.
  useEffect(() => {
    if (reducedMotion || active >= STAGES.length) {
      return;
    }
    const timer = setTimeout(() => setActive((a) => a + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion, active]);

  const finished = active >= STAGES.length;

  function statusFor(index: number): StageStatus {
    if (index < active) {
      return "done";
    }
    if (index === active) {
      return "running";
    }
    return "pending";
  }

  return (
    <GlowPanel className="p-4">
      <div ref={ref} className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Deploy pipeline
        </h3>
        <span
          className={`font-mono text-[11px] uppercase tracking-wide ${
            finished ? "text-good" : "text-accent"
          }`}
        >
          {finished ? "all checks passed" : "running"}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {STAGES.map((stage, i) => (
          <PipelineStage
            key={stage.name}
            name={stage.name}
            status={statusFor(i)}
            duration={stage.duration}
          />
        ))}
      </div>
    </GlowPanel>
  );
}
