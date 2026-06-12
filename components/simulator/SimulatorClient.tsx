"use client";

import { useMemo, useReducer, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { stageProps } from "@/components/simulator/stage";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { DecisionPanel } from "@/components/simulator/DecisionPanel";
import { CodeReviewCard } from "@/components/simulator/CodeReviewCard";
import { EndOfDayReport } from "@/components/simulator/EndOfDayReport";
import { MetricsDashboard } from "@/components/simulator/MetricsDashboard";
import { OutcomeBadge } from "@/components/simulator/OutcomeBadge";
import { ScenarioCard } from "@/components/simulator/ScenarioCard";
import { SystemSignals } from "@/components/simulator/SystemSignals";
import { ReplayView } from "@/components/simulator/ReplayView";
import { ResolutionSequence } from "@/components/simulator/ResolutionSequence";
import { MissionBriefing } from "@/components/cinematic/MissionBriefing";
import { Timeline } from "@/components/simulator/Timeline";
import {
  WorkdayStatus,
  type WorkdayBeat,
} from "@/components/simulator/WorkdayStatus";
import {
  applyDecision,
  createInitialState,
  encodeRun,
  generateReport,
  getCurrentStep,
  reconstructRun,
  reportFilename,
  reportToMarkdown,
  riskState,
  type Scenario,
  type SimulatorState,
} from "@/lib/simulator";
import { addRun } from "@/lib/runStore";
import type { ScenarioDifficulty } from "@/data/scenarios";

type Action = { type: "decide"; optionId: string } | { type: "restart" };

/**
 * Reducer factory bound to a scenario. Keeping it a pure factory lets the
 * simulator run any scenario, including one imported at runtime that is not
 * in the registry, without the reducer reaching for global lookup.
 */
function makeReducer(scenario: Scenario) {
  return function reducer(
    state: SimulatorState,
    action: Action
  ): SimulatorState {
    switch (action.type) {
      case "decide":
        return applyDecision(scenario, state, action.optionId);
      case "restart":
        return createInitialState(scenario);
    }
  };
}

export function SimulatorClient({
  scenario,
  shareable = false,
  difficulty,
}: {
  scenario: Scenario;
  /**
   * True only for registry scenarios. A run link carries the scenario id,
   * so a run of a scenario that is not in the registry cannot travel.
   */
  shareable?: boolean;
  /**
   * The registry difficulty, used only to pick the briefing's threat level.
   * Absent for imported and studio scenarios, which default to guarded.
   */
  difficulty?: ScenarioDifficulty;
}) {
  const reducer = useMemo(() => makeReducer(scenario), [scenario]);
  const [state, dispatch] = useReducer(reducer, scenario, createInitialState);
  const [view, setView] = useState<"report" | "replay">("report");
  const [savedToComparison, setSavedToComparison] = useState(false);
  const reducedMotion = useReducedMotion();
  const [briefingSkipped, setBriefingSkipped] = useState(false);
  const [resolutionDismissed, setResolutionDismissed] = useState(false);

  // The mission briefing plays as a full-screen overlay at the very start of the
  // day, only when motion is allowed, and is skippable. The workday is mounted
  // underneath the whole time, so dismissing it just continues play with no
  // layout shift. Once a decision is made it never returns.
  const showBriefing =
    !reducedMotion &&
    !briefingSkipped &&
    !state.completed &&
    state.decisions.length === 0;

  const currentStep = state.completed
    ? null
    : getCurrentStep(scenario, state);

  // A branching scenario has no single upcoming spine to preview, so its
  // workday is shown as the path taken plus the current step. A linear
  // scenario keeps the full preview of every upcoming step.
  const isBranching = useMemo(
    () =>
      scenario.steps.some(
        (step) => new Set(step.options.map((o) => o.nextStepId)).size > 1
      ),
    [scenario]
  );

  const endBeats: WorkdayBeat[] = [
    { time: scenario.outcomes[0].time, label: "How it lands" },
    { time: "5:00 PM", label: "End-of-day report" },
  ];

  const workdayBeats: WorkdayBeat[] = isBranching
    ? [
        ...state.decisions.map((d) => ({
          time: d.stepTime,
          label: d.stepTitle,
        })),
        ...(currentStep
          ? [{ time: currentStep.time, label: currentStep.title }]
          : []),
        ...endBeats,
      ]
    : [
        ...scenario.steps.map((step) => ({
          time: step.time,
          label: step.title,
        })),
        ...endBeats,
      ];

  const report = useMemo(
    () => (state.completed ? generateReport(scenario, state) : null),
    [scenario, state]
  );

  const replayFrames = useMemo(
    () =>
      state.completed
        ? reconstructRun(scenario, state.decisions).frames
        : null,
    [scenario, state]
  );

  function addToComparison() {
    if (!report || !state.outcomeId) {
      return;
    }
    addRun({
      scenario,
      decisions: state.decisions,
      outcomeId: state.outcomeId,
      outcomeTitle: report.outcome.title,
    });
    setSavedToComparison(true);
  }

  function downloadReport() {
    if (!report) {
      return;
    }
    const runDate = new Date();
    const markdown = reportToMarkdown(scenario, report, runDate);
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = reportFilename(scenario, runDate);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const currentBeatIndex = state.completed
    ? workdayBeats.length - 1
    : state.decisions.length;
  const lastDecision = state.decisions[state.decisions.length - 1];

  // The global treatment reads live risk: it tracks every decision and eases
  // back down when a later choice lowers risk below a threshold.
  const shellRiskState = riskState(state.metrics.risk);

  // The resolution moment plays once when the day ends, unless motion is off
  // or it has been skipped. Under reduced motion the verdict and report show
  // immediately. It resets on restart so a new day resolves again.
  const showResolution =
    state.completed && !reducedMotion && !resolutionDismissed;

  return (
    <AppShell riskState={shellRiskState}>
      <h1 className="sr-only">{scenario.name}</h1>
      {showBriefing && (
        <MissionBriefing
          scenario={scenario}
          difficulty={difficulty}
          onDismiss={() => setBriefingSkipped(true)}
        />
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <div className="order-3 flex flex-col gap-4 lg:order-1">
          <WorkdayStatus
            beats={workdayBeats}
            currentIndex={currentBeatIndex}
            riskState={shellRiskState}
            reducedMotion={reducedMotion}
          />
          {!state.completed && <Timeline decisions={state.decisions} />}
        </div>

        <div className="order-2 flex flex-col gap-4 lg:order-2">
          {currentStep && (
            <>
              <ScenarioCard step={currentStep} staged={false} />
              {currentStep.codeSnippet && (
                <CodeReviewCard code={currentStep.codeSnippet} />
              )}
              {currentStep.systemSignals && (
                <SystemSignals signals={currentStep.systemSignals} />
              )}
              {lastDecision?.consequence && (
                <p className="rounded-lg border border-surface-line bg-surface-overlay px-4 py-3 text-xs italic leading-relaxed text-ink-muted">
                  {lastDecision.consequence}
                </p>
              )}
              <DecisionPanel
                options={currentStep.options}
                onDecide={(optionId) => dispatch({ type: "decide", optionId })}
              />
            </>
          )}
          {showResolution && report && (
            <ResolutionSequence
              outcome={report.outcome}
              onDone={() => setResolutionDismissed(true)}
            />
          )}
          {report && view === "report" && !showResolution && (
            <>
              <div
                className={stageProps(!reducedMotion, 0).className}
                style={stageProps(!reducedMotion, 0).style}
              >
                <OutcomeBadge outcome={report.outcome} />
              </div>
              <div
                className={stageProps(!reducedMotion, 250).className}
                style={stageProps(!reducedMotion, 250).style}
              >
                <EndOfDayReport
                  report={report}
                  shareCode={
                    shareable
                      ? encodeRun(
                          scenario.id,
                          state.decisions.map((d) => d.optionId)
                        )
                      : undefined
                  }
                  shareNote={
                    shareable
                      ? undefined
                      : "This scenario is not in the built-in registry, so the run cannot be shared by link; a link carries only the scenario id."
                  }
                  onRestart={() => {
                    setView("report");
                    setSavedToComparison(false);
                    setResolutionDismissed(false);
                    dispatch({ type: "restart" });
                  }}
                  onReplay={
                    replayFrames && replayFrames.length > 0
                      ? () => setView("replay")
                      : undefined
                  }
                  onDownload={downloadReport}
                  onAddToComparison={addToComparison}
                  savedToComparison={savedToComparison}
                />
              </div>
            </>
          )}
          {report && view === "replay" && replayFrames && (
            <ReplayView
              frames={replayFrames}
              onBack={() => setView("report")}
            />
          )}
        </div>

        <div className="order-1 lg:order-3">
          <MetricsDashboard
            metrics={state.metrics}
            lastImpact={lastDecision?.impact}
            decisionCount={state.decisions.length}
          />
        </div>
      </div>
    </AppShell>
  );
}
