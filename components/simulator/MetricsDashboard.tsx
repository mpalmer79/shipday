import type { DecisionImpact, MetricKey, Metrics } from "@/lib/simulator";
import { MetricCard } from "./MetricCard";
import { RiskMeter } from "./RiskMeter";

export const METRIC_LABELS: Record<MetricKey, string> = {
  quality: "Code Quality",
  speed: "Delivery Speed",
  risk: "Risk",
  trust: "Stakeholder Trust",
  focus: "Focus",
  testConfidence: "Test Confidence",
};

const SMALL_METRICS: MetricKey[] = [
  "quality",
  "speed",
  "trust",
  "focus",
  "testConfidence",
];

type MetricsDashboardProps = {
  metrics: Metrics;
  lastImpact?: DecisionImpact;
  decisionCount: number;
};

export function MetricsDashboard({
  metrics,
  lastImpact,
  decisionCount,
}: MetricsDashboardProps) {
  return (
    <div className="flex flex-col gap-3">
      <RiskMeter
        value={metrics.risk}
        delta={lastImpact?.risk}
        pulseKey={decisionCount}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
        {SMALL_METRICS.map((key) => (
          <MetricCard
            key={key}
            label={METRIC_LABELS[key]}
            value={metrics[key]}
            delta={lastImpact?.[key]}
            deltaKey={decisionCount}
          />
        ))}
      </div>
    </div>
  );
}
