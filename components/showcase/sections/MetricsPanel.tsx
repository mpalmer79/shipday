"use client";

import { GlowPanel } from "../GlowPanel";
import { MetricBar } from "../MetricBar";
import { useInView } from "@/lib/useInView";
import { useReducedMotion } from "@/lib/useReducedMotion";
// Narrow imports: the label constants and the type only, so the engine never
// enters the landing's client bundle.
import { METRIC_LABELS, METRIC_ORDER } from "@/lib/simulator/metrics";
import type { MetricKey } from "@/lib/simulator/types";

// Deterministic sample values that echo the simulator's six metrics. Not read
// from the engine; this is the trailer, not a live run.
const SAMPLE: Record<MetricKey, number> = {
  quality: 82,
  speed: 64,
  risk: 38,
  trust: 76,
  focus: 70,
  testConfidence: 71,
};

const TONE: Record<MetricKey, "accent" | "good" | "warn"> = {
  quality: "good",
  speed: "accent",
  risk: "warn",
  trust: "good",
  focus: "accent",
  testConfidence: "accent",
};

/**
 * A metrics panel echoing the simulator's six metrics. The bars grow in when
 * the panel scrolls into view (transform only) and present full immediately
 * under reduced motion. Sample values only.
 */
export function MetricsPanel() {
  const reducedMotion = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const animate = reducedMotion || inView;

  return (
    <GlowPanel className="p-5">
      <div ref={ref} className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          End-of-day metrics
        </h3>
        <span className="font-mono text-[11px] text-ink-faint">sample run</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {METRIC_ORDER.map((key, i) => (
          <MetricBar
            key={key}
            label={METRIC_LABELS[key]}
            value={SAMPLE[key]}
            tone={TONE[key]}
            animate={animate}
            delayMs={i * 80}
          />
        ))}
      </div>
    </GlowPanel>
  );
}
