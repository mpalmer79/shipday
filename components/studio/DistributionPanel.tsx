"use client";

import { useEffect, useRef, useState } from "react";
import type { Distribution } from "@/lib/simulator";
import {
  PREVIEW_PATH_CEILING,
  PREVIEW_SAMPLE_SIZE,
} from "@/lib/simulator";
import type { ScenarioDraft } from "@/lib/studio";
import type { WorkerResult } from "./distribution.worker";

const MIN_SHARE = 0.02;
const MAX_SHARE = 0.45;

type PanelState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "error"; error: string }
  | { status: "done"; distribution: Distribution };

export function DistributionPanel({
  draft,
  valid,
}: {
  draft: ScenarioDraft;
  valid: boolean;
}) {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<PanelState>({ status: "idle" });

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  function runPreview() {
    if (!valid) {
      return;
    }
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("./distribution.worker.ts", import.meta.url)
      );
      workerRef.current.onmessage = (event: MessageEvent<WorkerResult>) => {
        const result = event.data;
        if (result.ok) {
          setState({ status: "done", distribution: result.distribution });
        } else {
          setState({ status: "error", error: result.error });
        }
      };
    }
    setState({ status: "running" });
    workerRef.current.postMessage(JSON.parse(JSON.stringify(draft)));
  }

  const outcomes = Array.isArray(draft.outcomes) ? draft.outcomes : [];

  return (
    <div className="rounded-lg border border-surface-line bg-surface-raised p-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runPreview}
          disabled={!valid || state.status === "running"}
          className="rounded-lg border border-surface-line px-4 py-2 text-sm font-medium transition-colors enabled:hover:border-accent disabled:opacity-40"
        >
          {state.status === "running" ? "Walking the draft" : "Run preview"}
        </button>
        <span className="text-xs text-ink-muted">
          Counts every run of the current draft in a background worker.
          Re-run it after edits; it does not run on every keystroke.
        </span>
      </div>

      {!valid && (
        <p className="mt-3 text-xs text-ink-faint">
          The preview needs a valid draft; fix the validation errors first.
        </p>
      )}

      {state.status === "error" && (
        <p className="mt-3 font-mono text-xs leading-relaxed text-bad">
          {state.error}
        </p>
      )}

      {state.status === "done" && (
        <div className="mt-4">
          <p className="text-xs text-ink-muted">
            {state.distribution.sampled
              ? `Sampled: ${state.distribution.totalRuns.toLocaleString()} seeded random runs out of ${state.distribution.pathCount.toLocaleString()} paths (the exhaustive walk caps at ${PREVIEW_PATH_CEILING.toLocaleString()} paths; samples are ${PREVIEW_SAMPLE_SIZE.toLocaleString()} runs).`
              : `Exhaustive: all ${state.distribution.totalRuns.toLocaleString()} runs walked.`}
          </p>
          <table className="mt-3 w-full border-collapse text-xs">
            <thead>
              <tr className="text-ink-faint">
                <th className="px-2 py-1 text-left font-medium">Outcome</th>
                <th className="px-2 py-1 text-right font-medium">Runs</th>
                <th className="px-2 py-1 text-right font-medium">Share</th>
                <th className="px-2 py-1 text-left font-medium">Guidance</th>
              </tr>
            </thead>
            <tbody>
              {outcomes.map((outcome, i) => {
                const n = state.distribution.counts[outcome.id] ?? 0;
                const share = n / state.distribution.totalRuns;
                const low = share < MIN_SHARE;
                const high = share > MAX_SHARE;
                return (
                  <tr key={i} className="border-t border-surface-line">
                    <td className="px-2 py-1 text-ink-muted">
                      {outcome.title || outcome.id}
                    </td>
                    <td className="px-2 py-1 text-right font-mono">
                      {n.toLocaleString()}
                    </td>
                    <td className="px-2 py-1 text-right font-mono">
                      {(share * 100).toFixed(1)}%
                    </td>
                    <td className="px-2 py-1">
                      {low && (
                        <span className="text-warn">
                          below the 2% guidance{n === 0 ? " (unreached)" : ""}
                        </span>
                      )}
                      {high && (
                        <span className="text-warn">above the 45% guidance</span>
                      )}
                      {!low && !high && (
                        <span className="text-ink-faint">within 2 to 45%</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
            The 2 to 45 percent band is tuning guidance for the built-in
            scenarios, not a validation rule; a draft outside it still plays
            and exports.
          </p>
        </div>
      )}
    </div>
  );
}
