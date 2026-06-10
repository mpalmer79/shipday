"use client";

import { useMemo, useReducer } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DecisionPanel } from "@/components/simulator/DecisionPanel";
import { CodeReviewCard } from "@/components/simulator/CodeReviewCard";
import { EndOfDayReport } from "@/components/simulator/EndOfDayReport";
import { MetricsDashboard } from "@/components/simulator/MetricsDashboard";
import { OutcomeBadge } from "@/components/simulator/OutcomeBadge";
import { ScenarioCard } from "@/components/simulator/ScenarioCard";
import { SystemSignals } from "@/components/simulator/SystemSignals";
import { Timeline } from "@/components/simulator/Timeline";
import {
  WorkdayStatus,
  type WorkdayBeat,
} from "@/components/simulator/WorkdayStatus";
import { getScenario } from "@/data/scenarios";
import {
  applyDecision,
  createInitialState,
  generateReport,
  getCurrentStep,
  type SimulatorState,
} from "@/lib/simulator";

type Action = { type: "decide"; optionId: string } | { type: "restart" };

function reducer(state: SimulatorState, action: Action): SimulatorState {
  const scenario = getScenario(state.scenarioId);
  switch (action.type) {
    case "decide":
      return applyDecision(scenario, state, action.optionId);
    case "restart":
      return createInitialState(scenario);
  }
}

export function SimulatorClient({ scenarioId }: { scenarioId: string }) {
  const scenario = getScenario(scenarioId);
  const [state, dispatch] = useReducer(
    reducer,
    scenario,
    createInitialState
  );

  const workdayBeats: WorkdayBeat[] = useMemo(
    () => [
      ...scenario.steps.map((step) => ({ time: step.time, label: step.title })),
      { time: scenario.outcomes[0].time, label: "How it lands" },
      { time: "5:00 PM", label: "End-of-day report" },
    ],
    [scenario]
  );

  const report = useMemo(
    () => (state.completed ? generateReport(scenario, state) : null),
    [scenario, state]
  );

  const currentStep = state.completed
    ? null
    : getCurrentStep(scenario, state);
  const currentBeatIndex = state.completed
    ? workdayBeats.length - 1
    : state.decisions.length;
  const lastDecision = state.decisions[state.decisions.length - 1];

  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          <WorkdayStatus beats={workdayBeats} currentIndex={currentBeatIndex} />
          {!state.completed && <Timeline decisions={state.decisions} />}
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2">
          {currentStep && (
            <>
              <ScenarioCard step={currentStep} />
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
                onDecide={(optionId) =>
                  dispatch({ type: "decide", optionId })
                }
              />
            </>
          )}
          {report && (
            <>
              <OutcomeBadge outcome={report.outcome} />
              <EndOfDayReport
                report={report}
                onRestart={() => dispatch({ type: "restart" })}
              />
            </>
          )}
        </div>

        <div className="order-3">
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
