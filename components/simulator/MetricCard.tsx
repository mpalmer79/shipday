type MetricCardProps = {
  label: string;
  value: number;
  delta?: number;
  /** Changes on every decision so the delta animation retriggers. */
  deltaKey: number;
  /** When true, an increase is shown as bad (used for risk-like metrics). */
  invert?: boolean;
};

export function MetricCard({
  label,
  value,
  delta,
  deltaKey,
  invert = false,
}: MetricCardProps) {
  const showDelta = delta !== undefined && delta !== 0;
  const deltaIsGood = invert ? delta! < 0 : delta! > 0;

  return (
    <div className="relative rounded-lg border border-surface-line bg-surface-raised p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-ink-muted">{label}</span>
        {showDelta && (
          <span
            key={deltaKey}
            className={`animate-delta-fade font-mono text-xs font-semibold ${
              deltaIsGood ? "text-good" : "text-bad"
            }`}
          >
            {delta! > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
      <div className="mt-1 font-mono text-2xl font-semibold">{value}</div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-overlay">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
