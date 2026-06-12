export type StageStatus = "done" | "running" | "pending" | "failed";

const STATUS: Record<
  StageStatus,
  { dot: string; label: string; text: string }
> = {
  done: { dot: "bg-good", label: "passed", text: "text-good" },
  running: { dot: "bg-accent", label: "running", text: "text-accent" },
  pending: { dot: "bg-ink-faint", label: "queued", text: "text-ink-faint" },
  failed: { dot: "bg-bad", label: "failed", text: "text-bad" },
};

/**
 * One stage in a deploy pipeline. The running state shows an indeterminate
 * sweep; the caller decides which stage is running and gates the sweep under
 * reduced motion through the global contract. Pure presentation.
 */
export function PipelineStage({
  name,
  status,
  duration,
}: {
  name: string;
  status: StageStatus;
  duration?: string;
}) {
  const s = STATUS[status];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-edge/30 bg-void/40 px-3 py-2.5">
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${s.dot} ${
          status === "running" ? "animate-cursor-blink" : ""
        }`}
      />
      <span className="flex-1 truncate text-sm font-medium text-ink">{name}</span>
      {duration && (
        <span className="font-mono text-[11px] text-ink-faint">{duration}</span>
      )}
      <span className={`font-mono text-[11px] uppercase tracking-wide ${s.text}`}>
        {s.label}
      </span>
    </div>
  );
}
