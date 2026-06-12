"use client";

import { useEffect, useState } from "react";
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
 * rests at all-passed. The progression is a sequence of short state changes,
 * not a perpetual loop. Under reduced motion it renders the finished pipeline
 * immediately. Set dressing: no real build runs here.
 */
export function DeployPipeline() {
  const reducedMotion = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reducedMotion || !inView) {
      return;
    }
    if (active >= STAGES.length) {
      return;
    }
    const timer = setTimeout(() => setActive((a) => a + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion, inView, active]);

  const finished = reducedMotion || !inView ? true : active >= STAGES.length;

  function statusFor(index: number): StageStatus {
    if (reducedMotion) {
      return "done";
    }
    if (!inView) {
      return "pending";
    }
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
