"use client";

import type { MetricKey, Scenario } from "@/lib/simulator";
import { compareRuns, METRIC_LABELS, METRIC_ORDER } from "@/lib/simulator";
import type { CompletedRun } from "@/components/runs/CompletedRunsProvider";

function deltaText(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function ComparisonView({
  scenario,
  runA,
  runB,
}: {
  scenario: Scenario;
  runA: CompletedRun;
  runB: CompletedRun;
}) {
  const comparison = compareRuns(scenario, runA.decisions, runB.decisions);

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-surface-line bg-surface-raised p-4">
          <span className="text-xs uppercase tracking-wider text-ink-faint">
            Run A
          </span>
          <p className="mt-1 text-sm font-medium">Outcome: {comparison.outcomeA}</p>
        </div>
        <div className="rounded-lg border border-surface-line bg-surface-raised p-4">
          <span className="text-xs uppercase tracking-wider text-ink-faint">
            Run B
          </span>
          <p className="mt-1 text-sm font-medium">Outcome: {comparison.outcomeB}</p>
        </div>
      </div>

      <p className="text-sm text-ink-muted">
        {comparison.sameOutcome
          ? "Both runs reached the same outcome"
          : "The runs reached different outcomes"}
        , differing on {comparison.differingChoices} of{" "}
        {comparison.steps.length} decisions.
      </p>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Decisions, step by step
        </h2>
        <ol className="flex flex-col gap-2">
          {comparison.steps.map((step) => (
            <li
              key={step.index}
              className={`rounded-lg border p-3 ${
                step.sameChoice
                  ? "border-surface-line bg-surface-raised"
                  : "border-warn/40 bg-warn/5"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-ink-faint">
                  {step.time}
                </span>
                <span className="text-xs text-ink-muted">{step.title}</span>
                {!step.sameStep && (
                  <span className="font-mono text-[10px] text-warn">
                    paths diverged
                  </span>
                )}
              </div>
              <div className="mt-1 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                <span>A: {step.aLabel ?? "(ended)"}</span>
                <span
                  className={step.sameChoice ? "text-ink-muted" : "text-ink"}
                >
                  B: {step.bLabel ?? "(ended)"}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Final metrics
        </h2>
        <div className="overflow-hidden rounded-lg border border-surface-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-line bg-surface-raised text-left text-xs text-ink-faint">
                <th className="p-2 font-medium">Metric</th>
                <th className="p-2 text-right font-medium">A</th>
                <th className="p-2 text-right font-medium">B</th>
                <th className="p-2 text-right font-medium">B minus A</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_ORDER.map((key: MetricKey) => {
                const delta = comparison.metricDelta[key];
                const good = key === "risk" ? delta < 0 : delta > 0;
                return (
                  <tr key={key} className="border-b border-surface-line/50">
                    <td className="p-2 text-ink-muted">{METRIC_LABELS[key]}</td>
                    <td className="p-2 text-right font-mono">
                      {comparison.finalA[key]}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {comparison.finalB[key]}
                    </td>
                    <td
                      className={`p-2 text-right font-mono ${
                        delta === 0
                          ? "text-ink-faint"
                          : good
                            ? "text-good"
                            : "text-bad"
                      }`}
                    >
                      {delta === 0 ? "0" : deltaText(delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
