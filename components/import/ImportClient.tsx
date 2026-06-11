"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SimulatorClient } from "@/components/simulator/SimulatorClient";
import {
  lintScenario,
  parseScenarioJson,
  type Scenario,
} from "@/lib/simulator";

const SAMPLE_SCENARIO = {
  id: "sample-config-toggle",
  name: "Sample: A Config Toggle",
  tagline: "A tiny two-step scenario you can edit and replay.",
  initialStepId: "config-toggle",
  initialMetrics: {
    quality: 50,
    speed: 50,
    risk: 30,
    trust: 55,
    focus: 60,
    testConfidence: 50,
  },
  steps: [
    {
      id: "config-toggle",
      time: "10:00 AM",
      title: "A config toggle",
      narrative:
        "A small config flag controls a new code path. Someone asks you to turn it on for everyone today.",
      context:
        "The flag has not been exercised under real traffic. Turning it on is one line and three unknowns.",
      options: [
        {
          id: "read-consumers",
          label: "Read what the flag actually controls first",
          description: "Find every code path the flag gates before flipping it.",
          impact: { risk: -10, quality: 5 },
          nextStepId: "the-call",
        },
        {
          id: "flip-now",
          label: "Flip it on for everyone now",
          description: "It is one flag. Turn it on and move to the next ticket.",
          impact: { risk: 15, speed: 10 },
          nextStepId: "the-call",
        },
      ],
    },
    {
      id: "the-call",
      time: "11:00 AM",
      title: "The rollout call",
      narrative: "Time to decide how the change reaches production.",
      context: "The same change can ship safely or all at once. Your call.",
      options: [
        {
          id: "stage-it",
          label: "Roll out behind the flag in stages",
          description: "Ramp slowly and watch the error rate.",
          impact: { risk: -5, trust: 5 },
          nextStepId: "__end__",
          flags: ["used-feature-flag"],
        },
        {
          id: "ship-everywhere",
          label: "Turn it on everywhere at once",
          description: "Full rollout, right now.",
          impact: { risk: 15 },
          nextStepId: "__end__",
        },
      ],
    },
  ],
  outcomes: [
    {
      id: "safe-rollout",
      time: "11:30 AM",
      title: "Safe Rollout",
      summary: "The change reached users behind a flag and the graphs stayed flat.",
      tone: "positive",
    },
    {
      id: "minor-issue",
      time: "11:30 AM",
      title: "Minor Production Issue",
      summary: "A small problem surfaced and was cleaned up quickly.",
      tone: "mixed",
    },
    {
      id: "customer-incident",
      time: "11:30 AM",
      title: "Customer Impact Incident",
      summary: "The untested path broke for users and had to be rolled back.",
      tone: "negative",
    },
    {
      id: "responsible-delay",
      time: "11:30 AM",
      title: "Responsible Delay",
      summary: "The change waited for verification, with the reason written down.",
      tone: "neutral",
    },
    {
      id: "overcontrolled",
      time: "11:30 AM",
      title: "Overcontrolled Delivery",
      summary: "The change was held with no explanation to anyone waiting on it.",
      tone: "negative",
    },
  ],
  outcomeRules: [
    {
      outcomeId: "customer-incident",
      priority: 1,
      when: { kind: "metricAtLeast", metric: "risk", value: 60 },
    },
    {
      outcomeId: "safe-rollout",
      priority: 2,
      when: {
        kind: "allOf",
        conditions: [
          { kind: "metricAtMost", metric: "risk", value: 40 },
          { kind: "hasFlag", flag: "used-feature-flag" },
        ],
      },
    },
  ],
  fallbackOutcomeId: "minor-issue",
};

export function ImportClient() {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [scenario, setScenario] = useState<Scenario | null>(null);

  function handleValidate() {
    const result = parseScenarioJson(text);
    if (!result.ok) {
      setErrors(result.errors);
      setWarnings([]);
      setScenario(null);
      return;
    }
    setErrors([]);
    setWarnings(lintScenario(result.scenario));
    setScenario(result.scenario);
  }

  function handleReset() {
    setScenario(null);
    setErrors(null);
    setWarnings([]);
  }

  if (scenario) {
    return (
      <div>
        <div className="border-b border-surface-line bg-surface-raised">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
            <span className="text-xs text-ink-muted">
              Playing imported scenario:{" "}
              <span className="font-medium text-ink">{scenario.name}</span>
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-surface-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent"
            >
              Back to importer
            </button>
          </div>
        </div>
        <SimulatorClient scenario={scenario} />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-10">
        <h1 className="text-3xl font-bold tracking-tight">Import a scenario</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Paste a scenario as JSON. It is validated against the simulator
          format, then played in the simulator. Imported scenarios live in
          memory for this session only. Nothing is uploaded or stored.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setText(JSON.stringify(SAMPLE_SCENARIO, null, 2))}
            className="rounded-lg border border-surface-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
          >
            Load a sample
          </button>
          <button
            type="button"
            onClick={handleValidate}
            disabled={text.trim().length === 0}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-surface transition-colors enabled:hover:bg-accent/90 disabled:opacity-40"
          >
            Validate and play
          </button>
        </div>

        <label htmlFor="scenario-json" className="sr-only">
          Scenario JSON
        </label>
        <textarea
          id="scenario-json"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          rows={18}
          placeholder="Paste scenario JSON here"
          className="mt-4 w-full rounded-lg border border-surface-line bg-surface-raised p-4 font-mono text-xs leading-relaxed text-ink placeholder:text-ink-faint"
        />

        {errors && errors.length > 0 && (
          <div className="mt-6 rounded-lg border border-bad/40 bg-bad/5 p-5">
            <h2 className="text-sm font-semibold text-bad">
              {errors.length} validation{" "}
              {errors.length === 1 ? "error" : "errors"}
            </h2>
            <ul className="mt-3 space-y-1.5">
              {errors.map((error, i) => (
                <li
                  key={`${error}-${i}`}
                  className="font-mono text-xs leading-relaxed text-ink-muted"
                >
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {errors !== null && errors.length === 0 && warnings.length > 0 && (
          <div className="mt-6 rounded-lg border border-warn/40 bg-warn/5 p-5">
            <h2 className="text-sm font-semibold text-warn">
              Valid, with {warnings.length} lint{" "}
              {warnings.length === 1 ? "warning" : "warnings"}
            </h2>
            <ul className="mt-3 space-y-1.5">
              {warnings.map((warning, i) => (
                <li
                  key={`${warning}-${i}`}
                  className="font-mono text-xs leading-relaxed text-ink-muted"
                >
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}
