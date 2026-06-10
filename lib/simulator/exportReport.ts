import type { EndOfDayReport, Scenario } from "./types";
import { METRIC_LABELS, METRIC_ORDER } from "./metrics";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function reportFilename(scenario: Scenario, runDate: Date): string {
  return `shipday-${scenario.id}-${formatDate(runDate)}.md`;
}

/**
 * Renders a completed run's report as a self-contained markdown document.
 * Pure string building from in-memory state; no browser or server APIs.
 */
export function reportToMarkdown(
  scenario: Scenario,
  report: EndOfDayReport,
  runDate: Date
): string {
  const lines: string[] = [];

  lines.push(`# ShipDay report: ${scenario.name}`);
  lines.push("");
  lines.push(`- Date of run: ${formatDate(runDate)}`);
  lines.push(`- Outcome: ${report.outcome.title} (${report.outcome.time})`);
  lines.push("");
  lines.push(report.outcome.summary);
  lines.push("");

  lines.push("## Final metrics");
  lines.push("");
  for (const key of METRIC_ORDER) {
    lines.push(`- ${METRIC_LABELS[key]}: ${report.finalMetrics[key]}`);
  }
  lines.push("");

  lines.push("## How the day unfolded");
  lines.push("");
  for (const decision of report.timeline) {
    lines.push(`### ${decision.stepTime}: ${decision.stepTitle}`);
    lines.push("");
    lines.push(`Decision: ${decision.optionLabel}`);
    if (decision.consequence) {
      lines.push("");
      lines.push(decision.consequence);
    }
    lines.push("");
  }

  if (report.strongDecisions.length > 0) {
    lines.push("## Strong decisions");
    lines.push("");
    for (const decision of report.strongDecisions) {
      lines.push(`- ${decision.optionLabel}`);
      if (decision.lesson) {
        lines.push(`  ${decision.lesson}`);
      }
    }
    lines.push("");
  }

  if (report.missedSignals.length > 0) {
    lines.push("## Missed signals");
    lines.push("");
    for (const signal of report.missedSignals) {
      lines.push(`- ${signal}`);
    }
    lines.push("");
  }

  lines.push("## The staff-level lesson");
  lines.push("");
  lines.push(report.staffLevelLesson);
  lines.push("");

  return lines.join("\n");
}
