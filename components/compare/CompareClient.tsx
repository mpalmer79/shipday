"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { addRun, useCompletedRuns, type SavedRun } from "@/lib/runStore";
import { compareRuns, METRIC_LABELS, METRIC_ORDER } from "@/lib/simulator";
import { extractRunCode, loadRunFromCode } from "@/lib/runLink";
import { EmptyStateGraphic, MediaPanel } from "@/components/media";
import { compareMedia } from "@/lib/shipdayMedia";

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

/**
 * Loads a run shared by link into the session's run list, so a pasted run
 * can stand in as run A or run B against a locally played one.
 */
function RunLinkLoader() {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<
    { kind: "error" | "loaded"; message: string } | null
  >(null);

  function handleLoad() {
    const result = loadRunFromCode(extractRunCode(text));
    if (!result.ok) {
      setFeedback({ kind: "error", message: result.error });
      return;
    }
    const { scenario, state, outcome } = result.run;
    addRun({
      scenario,
      decisions: state.decisions,
      outcomeId: state.outcomeId!,
      outcomeTitle: outcome.title,
    });
    setFeedback({
      kind: "loaded",
      message: `Loaded a run of ${scenario.name} (${outcome.title}). It is now available in the run pickers.`,
    });
    setText("");
  }

  return (
    <div className="mt-6 rounded-lg border border-surface-line bg-surface-raised p-4">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-accent"
        >
          <path d="M9 12h6" />
          <path d="M10 8H8a4 4 0 0 0 0 8h2" />
          <path d="M14 8h2a4 4 0 0 1 0 8h-2" />
        </svg>
        Load a run from a link
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
        Paste a shared run link to compare someone else's day against one of
        yours. Loaded runs live in this session only.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLoad();
        }}
        className="mt-3 flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="compare-run-link" className="sr-only">
          Run link or code
        </label>
        <input
          id="compare-run-link"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a run link or code"
          spellCheck={false}
          className="flex-1 rounded-lg border border-surface-line bg-surface px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-faint"
        />
        <button
          type="submit"
          disabled={text.trim().length === 0}
          className="rounded-lg border border-surface-line px-4 py-2 text-sm font-medium transition-colors enabled:hover:border-accent disabled:opacity-40"
        >
          Load run
        </button>
      </form>
      {feedback && (
        <p
          className={`mt-3 font-mono text-xs leading-relaxed ${
            feedback.kind === "error" ? "text-bad" : "text-ink-muted"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}

function RunPicker({
  label,
  runs,
  selectedId,
  onSelect,
}: {
  label: string;
  runs: SavedRun[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-xs text-ink-muted">
      {label}
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="rounded-lg border border-surface-line bg-surface-raised px-3 py-2 text-sm text-ink"
      >
        {runs.map((run, i) => (
          <option key={run.runId} value={run.runId}>
            Run {i + 1}: {run.outcomeTitle}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CompareClient() {
  const runs = useCompletedRuns();

  const byScenario = useMemo(() => {
    const map = new Map<string, SavedRun[]>();
    for (const run of runs) {
      const list = map.get(run.scenario.id) ?? [];
      list.push(run);
      map.set(run.scenario.id, list);
    }
    return map;
  }, [runs]);

  const comparable = useMemo(
    () => [...byScenario.entries()].filter(([, list]) => list.length >= 2),
    [byScenario]
  );

  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [runAId, setRunAId] = useState<string | null>(null);
  const [runBId, setRunBId] = useState<string | null>(null);

  if (comparable.length === 0) {
    return (
      <AppShell footer>
        <div className="mx-auto max-w-2xl py-16">
          <EmptyStateGraphic
            src={compareMedia.emptyState}
            alt="A quiet comparison console standing by for two completed runs."
            title="Compare runs"
            description={
              <>
                Complete a scenario, choose &quot;Add to comparison&quot; on the
                report, and do it again. Once you have two finished runs of the
                same scenario, they show up here side by side. Shared run links
                count too: load one below and compare it against your own day.
              </>
            }
          >
            <Link
              href="/scenarios"
              className="mt-8 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-accent/90"
            >
              Pick a scenario
            </Link>
          </EmptyStateGraphic>
          <RunLinkLoader />
        </div>
      </AppShell>
    );
  }

  const activeScenarioId =
    scenarioId && (byScenario.get(scenarioId)?.length ?? 0) >= 2
      ? scenarioId
      : comparable[0][0];
  const scenarioRuns = byScenario.get(activeScenarioId) ?? [];
  const scenario = scenarioRuns[0].scenario;

  const runA =
    scenarioRuns.find((r) => r.runId === runAId) ?? scenarioRuns[0];
  const runB =
    scenarioRuns.find((r) => r.runId === runBId && r.runId !== runA.runId) ??
    scenarioRuns.find((r) => r.runId !== runA.runId) ??
    scenarioRuns[1];

  const comparison = compareRuns(scenario, runA.decisions, runB.decisions);

  return (
    <AppShell footer>
      <div className="mx-auto max-w-4xl py-10">
        <h1 className="text-3xl font-bold tracking-tight text-center md:text-left">Compare runs</h1>
        <p className="mt-2 text-sm text-ink-muted text-center md:text-left">
          Two runs of the same scenario, side by side: the decisions, the
          metric trajectories, and where the day landed.
        </p>

        <MediaPanel
          src={compareMedia.splitScreen}
          alt="Two runs of the same mission shown on a split screen, decision by decision."
          aspect="21/9"
          badge="Side by side"
          className="mt-6"
        />

        <RunLinkLoader />

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          {comparable.length > 1 && (
            <label className="flex flex-col gap-1 text-xs text-ink-muted">
              Scenario
              <select
                value={activeScenarioId}
                onChange={(e) => {
                  setScenarioId(e.target.value);
                  setRunAId(null);
                  setRunBId(null);
                }}
                className="rounded-lg border border-surface-line bg-surface-raised px-3 py-2 text-sm text-ink"
              >
                {comparable.map(([id, list]) => (
                  <option key={id} value={id}>
                    {list[0].scenario.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <RunPicker
            label="Run A"
            runs={scenarioRuns}
            selectedId={runA.runId}
            onSelect={setRunAId}
          />
          <RunPicker
            label="Run B"
            runs={scenarioRuns}
            selectedId={runB.runId}
            onSelect={setRunBId}
          />
        </div>

        <p className="mt-4 text-sm text-ink-muted">
          {comparison.decisionDifferences === 0
            ? "These two runs made identical decisions."
            : `${comparison.decisionDifferences} of ${comparison.steps.length} decisions differ.`}
        </p>

        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Decisions
          </h2>
          <ol className="mt-3 space-y-2">
            {comparison.steps.map((step) => (
              <li
                key={step.index}
                className={`rounded-lg border p-4 ${
                  step.sameChoice
                    ? "border-surface-line bg-surface-raised"
                    : "border-accent/40 bg-accent/5"
                }`}
              >
                <div className="font-mono text-xs text-ink-faint">
                  {step.a?.stepTime ?? step.b?.stepTime} ·{" "}
                  {step.a?.stepTitle ?? step.b?.stepTitle}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="text-sm">
                    <span className="text-[10px] uppercase tracking-wide text-ink-faint">
                      A
                    </span>
                    <div>{step.a ? step.a.optionLabel : "(no step)"}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-[10px] uppercase tracking-wide text-ink-faint">
                      B
                    </span>
                    <div>{step.b ? step.b.optionLabel : "(no step)"}</div>
                  </div>
                </div>
                {!step.sameChoice && (
                  <div className="mt-2 text-[10px] uppercase tracking-wide text-accent">
                    Different choice
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Metric trajectories
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="text-ink-faint">
                  <th className="px-2 py-1 text-left font-medium">Metric</th>
                  {comparison.trajectory.map((point) => (
                    <th
                      key={point.index}
                      className="px-2 py-1 text-center font-mono font-normal"
                    >
                      {point.label}
                    </th>
                  ))}
                  <th className="px-2 py-1 text-center font-medium">A − B</th>
                </tr>
              </thead>
              <tbody>
                {METRIC_ORDER.map((metric) => (
                  <tr key={metric} className="border-t border-surface-line">
                    <td className="px-2 py-1 text-ink-muted">
                      {METRIC_LABELS[metric]}
                    </td>
                    {comparison.trajectory.map((point) => {
                      const a = point.a?.[metric];
                      const b = point.b?.[metric];
                      const differ = a !== undefined && b !== undefined && a !== b;
                      return (
                        <td
                          key={point.index}
                          className="px-2 py-1 text-center font-mono"
                        >
                          <span className={differ ? "text-ink" : "text-ink-muted"}>
                            {a ?? "-"}
                          </span>
                          <span className="text-ink-faint"> / </span>
                          <span className={differ ? "text-ink" : "text-ink-muted"}>
                            {b ?? "-"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 text-center font-mono font-semibold">
                      {formatDelta(comparison.metricDifferences[metric])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">
            Each cell shows run A over run B. The last column is A minus B at the
            end of the day.
          </p>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-surface-line bg-surface-raised p-4">
            <div className="text-[10px] uppercase tracking-wide text-ink-faint">
              Run A outcome
            </div>
            <div className="mt-1 text-lg font-semibold">{runA.outcomeTitle}</div>
          </div>
          <div className="rounded-lg border border-surface-line bg-surface-raised p-4">
            <div className="text-[10px] uppercase tracking-wide text-ink-faint">
              Run B outcome
            </div>
            <div className="mt-1 text-lg font-semibold">{runB.outcomeTitle}</div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
