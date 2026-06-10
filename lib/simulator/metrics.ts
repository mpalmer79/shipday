import type { MetricKey } from "./types";

export const METRIC_LABELS: Record<MetricKey, string> = {
  quality: "Code Quality",
  speed: "Delivery Speed",
  risk: "Risk",
  trust: "Stakeholder Trust",
  focus: "Focus",
  testConfidence: "Test Confidence",
};

export const METRIC_ORDER: MetricKey[] = [
  "quality",
  "speed",
  "risk",
  "trust",
  "focus",
  "testConfidence",
];
