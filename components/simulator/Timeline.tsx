"use client";

import { useState } from "react";
import type { DecisionRecord } from "@/lib/simulator";

type TimelineProps = {
  decisions: DecisionRecord[];
  /** Expanded timelines (the report) always show consequences. */
  defaultOpen?: boolean;
  showConsequences?: boolean;
};

export function Timeline({
  decisions,
  defaultOpen = false,
  showConsequences = false,
}: TimelineProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (decisions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-surface-line bg-surface-raised">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Decisions so far ({decisions.length})
        </span>
        <span className="text-xs text-ink-faint">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <ol className="space-y-4 border-t border-surface-line p-4">
          {decisions.map((decision) => (
            <li key={decision.stepId} className="text-xs">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-ink-faint">
                  {decision.stepTime}
                </span>
                <span className="text-ink-muted">{decision.stepTitle}</span>
              </div>
              <div className="mt-1 font-medium text-ink">
                → {decision.optionLabel}
              </div>
              {showConsequences && decision.consequence && (
                <p className="mt-1 leading-relaxed text-ink-muted">
                  {decision.consequence}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
