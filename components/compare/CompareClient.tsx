"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ComparisonView } from "@/components/compare/ComparisonView";
import {
  useCompletedRuns,
  type CompletedRun,
} from "@/components/runs/CompletedRunsProvider";

function runLabel(run: CompletedRun, index: number): string {
  return `Run ${index + 1}: ${run.outcomeId}`;
}

export function CompareClient() {
  const { runs, clear } = useCompletedRuns();
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");

  // Runs are comparable only within the same scenario. Group by scenario id.
  const byScenario = new Map<string, CompletedRun[]>();
  for (const run of runs) {
    const list = byScenario.get(run.scenario.id) ?? [];
    list.push(run);
    byScenario.set(run.scenario.id, list);
  }
  const comparableScenarios = [...byScenario.values()].filter(
    (list) => list.length >= 2
  );

  const runA = runs.find((r) => r.id === aId);
  const runB = runs.find((r) => r.id === bId);
  const bothChosen = runA && runB;
  const sameScenario =
    bothChosen && runA.scenario.id === runB.scenario.id;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="text-3xl font-bold tracking-tight">Compare runs</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Save two completed runs of the same scenario, then compare the
          decisions and where the metrics ended up. Saved runs live in this
          browser session only.
        </p>

        {runs.length < 2 || comparableScenarios.length === 0 ? (
          <div className="mt-8 rounded-lg border border-surface-line bg-surface-raised p-6 text-sm text-ink-muted">
            <p>
              You have {runs.length} saved run{runs.length === 1 ? "" : "s"}.
              Finish at least two runs of the same scenario and use Save for
              comparison on each report.
            </p>
            <Link
              href="/scenarios"
              className="mt-3 inline-block font-medium text-accent hover:underline"
            >
              Go to scenarios
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs uppercase tracking-wider text-ink-faint">
                  Run A
                </span>
                <select
                  value={aId}
                  onChange={(e) => setAId(e.target.value)}
                  className="rounded-lg border border-surface-line bg-surface-raised p-2 text-sm outline-none focus:border-accent"
                >
                  <option value="">Choose a run</option>
                  {runs.map((run, i) => (
                    <option key={run.id} value={run.id}>
                      {run.scenario.name} . {runLabel(run, i)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs uppercase tracking-wider text-ink-faint">
                  Run B
                </span>
                <select
                  value={bId}
                  onChange={(e) => setBId(e.target.value)}
                  className="rounded-lg border border-surface-line bg-surface-raised p-2 text-sm outline-none focus:border-accent"
                >
                  <option value="">Choose a run</option>
                  {runs.map((run, i) => (
                    <option key={run.id} value={run.id}>
                      {run.scenario.name} . {runLabel(run, i)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {bothChosen && !sameScenario && (
              <p className="mt-4 text-sm text-warn">
                Pick two runs of the same scenario to compare them.
              </p>
            )}

            {bothChosen && sameScenario && (
              <ComparisonView
                scenario={runA.scenario}
                runA={runA}
                runB={runB}
              />
            )}

            <button
              type="button"
              onClick={() => {
                clear();
                setAId("");
                setBId("");
              }}
              className="mt-8 rounded-lg border border-surface-line px-4 py-2 text-xs font-medium text-ink-muted transition-colors hover:border-accent"
            >
              Clear saved runs
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
