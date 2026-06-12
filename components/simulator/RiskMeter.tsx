import { riskState } from "@/lib/simulator";

type RiskMeterProps = {
  value: number;
  delta?: number;
  /** Changes on every decision so the pulse retriggers. */
  pulseKey: number;
};

function riskTone(value: number) {
  switch (riskState(value)) {
    case "high":
      return { bar: "bg-bad", text: "text-bad", label: "High" };
    case "raised":
      return { bar: "bg-warn", text: "text-warn", label: "Raised" };
    case "calm":
      return { bar: "bg-good", text: "text-good", label: "Controlled" };
  }
}

export function RiskMeter({ value, delta, pulseKey }: RiskMeterProps) {
  const tone = riskTone(value);
  const changed = delta !== undefined && delta !== 0;

  return (
    <div
      key={changed ? pulseKey : "static"}
      className={`rounded-lg border border-surface-line bg-surface-raised p-4 ${
        changed ? "animate-risk-pulse" : ""
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-muted">Risk</span>
        <span className={`text-xs font-semibold ${tone.text}`}>
          {tone.label}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`font-mono text-4xl font-bold ${tone.text}`}>
          {value}
        </span>
        {changed && (
          <span
            className={`animate-delta-fade font-mono text-sm font-semibold ${
              delta! < 0 ? "text-good" : "text-bad"
            }`}
          >
            {delta! > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-overlay">
        <div
          className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
