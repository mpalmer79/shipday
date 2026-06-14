/**
 * A compact radial gauge for a single 0-100 metric. Used in the studio to give
 * the initial-metrics block a glanceable, instrument-panel read alongside the
 * numeric fields. Pure SVG, no state, no motion (the dial is static so it stays
 * calm under any motion preference). The numeric value is rendered as text, so
 * the gauge is reinforcement, not the only signal.
 */

type GaugeTone = "accent" | "good" | "warn" | "bad";

const STROKE: Record<GaugeTone, string> = {
  accent: "text-accent",
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
};

// A 270-degree dial: a three-quarter arc with a gap at the bottom.
const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_FRACTION = 0.75;
const ARC_LENGTH = CIRCUMFERENCE * ARC_FRACTION;

export function MetricGauge({
  label,
  value,
  tone = "accent",
}: {
  label: string;
  value: number;
  tone?: GaugeTone;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const filled = (clamped / 100) * ARC_LENGTH;

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-surface-line bg-surface-raised p-3">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-[135deg]">
          {/* Track */}
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-void"
            stroke="currentColor"
            strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
          />
          {/* Fill */}
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={STROKE[tone]}
            stroke="currentColor"
            strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold tabular-nums text-ink">
          {clamped}
        </span>
      </div>
      <span className="text-center text-[10px] font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </span>
    </div>
  );
}
