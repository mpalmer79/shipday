type MetricTone = "accent" | "good" | "warn" | "bad";

const FILL: Record<MetricTone, string> = {
  accent: "bg-accent",
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
};

/**
 * A labelled metric with a horizontal bar, echoing the simulator's metrics. The
 * fill animates in with the bar-grow keyframe (transform only) and is gated
 * under reduced motion by the global contract. Pure presentation; `value` is a
 * 0 to 100 figure supplied by the caller, not read from the engine.
 */
export function MetricBar({
  label,
  value,
  tone = "accent",
  animate = false,
  delayMs = 0,
}: {
  label: string;
  value: number;
  tone?: MetricTone;
  animate?: boolean;
  delayMs?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        <span className="font-mono text-xs tabular-nums text-ink">{clamped}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-void">
        <div
          className={`h-full origin-left rounded-full ${FILL[tone]} ${
            animate ? "animate-bar-grow" : ""
          }`}
          style={{
            width: `${clamped}%`,
            animationDelay: animate ? `${delayMs}ms` : undefined,
          }}
        />
      </div>
    </div>
  );
}
