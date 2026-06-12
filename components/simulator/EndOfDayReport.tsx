import { useState } from "react";
import Link from "next/link";
import type { EndOfDayReport as Report } from "@/lib/simulator";
import { METRIC_LABELS, METRIC_ORDER } from "@/lib/simulator";

type ShareState =
  | { status: "idle" }
  | { status: "copied" }
  | { status: "manual"; url: string };

type EndOfDayReportProps = {
  report: Report;
  onRestart?: () => void;
  onReplay?: () => void;
  onDownload?: () => void;
  onAddToComparison?: () => void;
  savedToComparison?: boolean;
  /** Run code for "Copy link to this run". Absent when not shareable. */
  shareCode?: string;
  /** One-line explanation shown when sharing is unavailable. */
  shareNote?: string;
};

export function EndOfDayReport({
  report,
  onRestart,
  onReplay,
  onDownload,
  onAddToComparison,
  savedToComparison = false,
  shareCode,
  shareNote,
}: EndOfDayReportProps) {
  const [share, setShare] = useState<ShareState>({ status: "idle" });

  async function handleCopyLink() {
    if (!shareCode) {
      return;
    }
    const url = `${window.location.origin}/run?code=${encodeURIComponent(shareCode)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShare({ status: "copied" });
    } catch {
      setShare({ status: "manual", url });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-surface-line bg-surface-raised p-5">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm text-accent">5:00 PM</span>
          <h2 className="text-lg font-semibold">End-of-day report</h2>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {METRIC_ORDER.map((key) => (
            <div key={key} className="text-center">
              <div className="font-mono text-xl font-semibold">
                {report.finalMetrics[key]}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-ink-faint">
                {METRIC_LABELS[key]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-surface-line bg-surface-raised p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          How the day unfolded
        </h3>
        <ol className="mt-4 space-y-4">
          {report.timeline.map((decision, i) => (
            <li
              key={`${decision.stepId}-${i}`}
              className="border-l-2 border-surface-line pl-4 text-sm"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-ink-faint">
                  {decision.stepTime}
                </span>
                <span className="text-xs text-ink-muted">
                  {decision.stepTitle}
                </span>
              </div>
              <div className="mt-1 font-medium">{decision.optionLabel}</div>
              {decision.consequence && (
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {decision.consequence}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>

      {report.strongDecisions.length > 0 && (
        <div className="rounded-lg border border-good/30 bg-surface-raised p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-good">
            Strong decisions
          </h3>
          <ul className="mt-3 space-y-3">
            {report.strongDecisions.map((decision, i) => (
              <li key={`${decision.stepId}-${i}`} className="text-sm">
                <span className="font-medium">{decision.optionLabel}</span>
                {decision.lesson && (
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    {decision.lesson}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.missedSignals.length > 0 && (
        <div className="rounded-lg border border-warn/30 bg-surface-raised p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-warn">
            Missed signals
          </h3>
          <ul className="mt-3 space-y-2">
            {report.missedSignals.map((signal) => (
              <li
                key={signal}
                className="text-xs leading-relaxed text-ink-muted"
              >
                {signal}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-accent/30 bg-accent/5 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
          The staff-level lesson
        </h3>
        <p className="mt-3 text-sm leading-relaxed">
          {report.staffLevelLesson}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-accent/90"
          >
            Run the day again
          </button>
        )}
        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="rounded-lg border border-surface-line px-6 py-2.5 text-sm font-medium transition-colors hover:border-accent"
          >
            Replay the day
          </button>
        )}
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="rounded-lg border border-surface-line px-6 py-2.5 text-sm font-medium transition-colors hover:border-accent"
          >
            Download report
          </button>
        )}
        {onAddToComparison && (
          <button
            type="button"
            onClick={onAddToComparison}
            disabled={savedToComparison}
            className="rounded-lg border border-surface-line px-6 py-2.5 text-sm font-medium transition-colors enabled:hover:border-accent disabled:opacity-50"
          >
            {savedToComparison ? "Added to comparison" : "Add to comparison"}
          </button>
        )}
        {shareCode && (
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-lg border border-surface-line px-6 py-2.5 text-sm font-medium transition-colors hover:border-accent"
          >
            {share.status === "copied" ? "Link copied" : "Copy link to this run"}
          </button>
        )}
      </div>

      {share.status === "manual" && (
        <div>
          <p className="text-xs text-ink-muted">
            The browser blocked the clipboard. Copy the link from here:
          </p>
          <label htmlFor="run-share-url" className="sr-only">
            Run link
          </label>
          <input
            id="run-share-url"
            readOnly
            value={share.url}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-2 w-full rounded-lg border border-surface-line bg-surface-raised px-3 py-2 font-mono text-xs text-ink"
          />
        </div>
      )}

      {shareNote && <p className="text-xs text-ink-faint">{shareNote}</p>}

      {savedToComparison && (
        <p className="text-xs text-ink-muted">
          Run saved for this session.{" "}
          <Link href="/compare" className="text-accent hover:underline">
            Compare runs
          </Link>
          .
        </p>
      )}
    </div>
  );
}
