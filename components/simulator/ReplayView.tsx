"use client";

import { useState } from "react";
import type { ReplayFrame } from "@/lib/simulator";
import { METRIC_LABELS, METRIC_ORDER } from "@/lib/simulator";

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

type ReplayViewProps = {
  frames: ReplayFrame[];
  onBack: () => void;
};

export function ReplayView({ frames, onBack }: ReplayViewProps) {
  const [index, setIndex] = useState(0);
  const frame = frames[index];
  const changedMetrics = METRIC_ORDER.filter(
    (key) => frame.metricsBefore[key] !== frame.metricsAfter[key]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Replay: decision {index + 1} of {frames.length}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="rounded-lg border border-surface-line px-3 py-1.5 text-xs font-medium transition-colors enabled:hover:border-accent disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(frames.length - 1, i + 1))}
            disabled={index === frames.length - 1}
            className="rounded-lg border border-surface-line px-3 py-1.5 text-xs font-medium transition-colors enabled:hover:border-accent disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-surface-line bg-surface-raised p-5">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm text-accent">
            {frame.step.time}
          </span>
          <h3 className="text-lg font-semibold">{frame.step.title}</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {frame.step.narrative}
        </p>
      </div>

      <div className="rounded-lg border border-accent/40 bg-accent/5 p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          You chose
        </span>
        <div className="mt-2 text-sm font-medium">{frame.chosen.label}</div>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          {frame.chosen.description}
        </p>
        {changedMetrics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {changedMetrics.map((key) => {
              const before = frame.metricsBefore[key];
              const after = frame.metricsAfter[key];
              const delta = after - before;
              const isGood = key === "risk" ? delta < 0 : delta > 0;
              return (
                <span
                  key={key}
                  className={`rounded-full border border-surface-line bg-surface-raised px-2.5 py-1 font-mono text-[11px] ${
                    isGood ? "text-good" : "text-bad"
                  }`}
                >
                  {METRIC_LABELS[key]} {before} → {after} (
                  {formatDelta(delta)})
                </span>
              );
            })}
          </div>
        )}
        {frame.consequence && (
          <p className="mt-3 border-t border-surface-line pt-3 text-xs italic leading-relaxed text-ink-muted">
            {frame.consequence}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-surface-line bg-surface-raised p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Paths not taken
        </span>
        <ul className="mt-3 space-y-3">
          {frame.notChosen.map((option) => (
            <li key={option.id} className="text-xs">
              <span className="font-medium text-ink-muted">
                {option.label}
              </span>
              <p className="mt-0.5 leading-relaxed text-ink-faint">
                {option.description}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="self-start rounded-lg border border-surface-line px-5 py-2 text-sm font-medium transition-colors hover:border-accent"
      >
        Back to report
      </button>
    </div>
  );
}
