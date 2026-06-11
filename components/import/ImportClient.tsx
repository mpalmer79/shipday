"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SimulatorClient } from "@/components/simulator/SimulatorClient";
import {
  parseScenarioJson,
  lintScenario,
  type Scenario,
} from "@/lib/simulator";

const EXAMPLE = `{
  "id": "example-day",
  "name": "Example Day",
  "tagline": "A tiny two-step scenario to show the shape.",
  "initialStepId": "start",
  "initialMetrics": {
    "quality": 50, "speed": 50, "risk": 30,
    "trust": 55, "focus": 60, "testConfidence": 45
  },
  "steps": [
    {
      "id": "start",
      "time": "9:00 AM",
      "title": "The request",
      "narrative": "A small change lands on your desk.",
      "context": "It looks simple. It usually is not.",
      "options": [
        {
          "id": "rush",
          "label": "Ship it without checking",
          "description": "Move fast and hope.",
          "impact": { "speed": 10, "risk": 15 },
          "nextStepId": "ship",
          "flags": ["skipped-validation"]
        },
        {
          "id": "verify",
          "label": "Check it first",
          "description": "Confirm the behavior before shipping.",
          "impact": { "risk": -10, "testConfidence": 15 },
          "nextStepId": "ship",
          "strong": true
        }
      ]
    },
    {
      "id": "ship",
      "time": "11:00 AM",
      "title": "The release",
      "narrative": "Time to decide how it goes out.",
      "context": "Full release or a careful one.",
      "options": [
        {
          "id": "full",
          "label": "Full release",
          "description": "Everyone, now.",
          "impact": { "risk": 15 },
          "nextStepId": "__end__",
          "flags": ["shipped-direct"]
        },
        {
          "id": "staged",
          "label": "Staged rollout",
          "description": "A few users first.",
          "impact": { "risk": -10 },
          "nextStepId": "__end__",
          "flags": ["staged-release"],
          "strong": true
        }
      ]
    }
  ],
  "outcomes": [
    { "id": "safe-rollout", "time": "4:30 PM", "title": "Safe Rollout", "summary": "It went out cleanly.", "tone": "positive" },
    { "id": "minor-issue", "time": "4:30 PM", "title": "Minor Issue", "summary": "A small bump, handled.", "tone": "mixed" },
    { "id": "customer-incident", "time": "4:30 PM", "title": "Incident", "summary": "It broke for customers.", "tone": "negative" },
    { "id": "responsible-delay", "time": "4:30 PM", "title": "Responsible Delay", "summary": "Held with a reason.", "tone": "neutral" },
    { "id": "overcontrolled", "time": "4:30 PM", "title": "Overcontrolled", "summary": "Held with no word.", "tone": "negative" }
  ],
  "outcomeRules": [
    { "outcomeId": "customer-incident", "priority": 1, "when": { "kind": "metricAtLeast", "metric": "risk", "value": 55 } },
    { "outcomeId": "safe-rollout", "priority": 2, "when": { "kind": "allOf", "conditions": [
      { "kind": "metricAtMost", "metric": "risk", "value": 35 },
      { "kind": "hasFlag", "flag": "staged-release" }
    ] } }
  ],
  "fallbackOutcomeId": "minor-issue"
}`;

type Status =
  | { kind: "idle" }
  | { kind: "errors"; errors: string[] }
  | { kind: "valid"; scenario: Scenario; warnings: string[] };

export function ImportClient() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [playing, setPlaying] = useState<Scenario | null>(null);

  function validate() {
    const result = parseScenarioJson(text);
    if (!result.ok) {
      setStatus({ kind: "errors", errors: result.errors });
      return;
    }
    setStatus({
      kind: "valid",
      scenario: result.scenario,
      warnings: lintScenario(result.scenario),
    });
  }

  if (playing) {
    return <SimulatorClient scenario={playing} />;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="text-3xl font-bold tracking-tight">Import a scenario</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Paste scenario JSON below. It is validated in your browser and
          played from memory. Nothing is uploaded or saved.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setText(EXAMPLE)}
            className="rounded-lg border border-surface-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
          >
            Load example
          </button>
          <button
            type="button"
            onClick={validate}
            disabled={text.trim().length === 0}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            Validate
          </button>
        </div>

        <label htmlFor="scenario-json" className="sr-only">
          Scenario JSON
        </label>
        <textarea
          id="scenario-json"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setStatus({ kind: "idle" });
          }}
          spellCheck={false}
          placeholder="Paste scenario JSON here"
          className="mt-4 h-80 w-full rounded-lg border border-surface-line bg-surface-raised p-4 font-mono text-xs leading-relaxed text-ink outline-none focus:border-accent"
        />

        {status.kind === "errors" && (
          <div className="mt-4 rounded-lg border border-bad/40 bg-bad/10 p-4">
            <h2 className="text-sm font-semibold text-bad">
              {status.errors.length} problem
              {status.errors.length === 1 ? "" : "s"} found
            </h2>
            <ul className="mt-2 space-y-1">
              {status.errors.map((error, i) => (
                <li key={i} className="font-mono text-xs text-ink-muted">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {status.kind === "valid" && (
          <div className="mt-4 rounded-lg border border-good/40 bg-good/10 p-4">
            <h2 className="text-sm font-semibold text-good">
              Valid scenario: {status.scenario.name}
            </h2>
            {status.warnings.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-warn">
                  Lint warnings (the scenario still plays):
                </p>
                <ul className="mt-1 space-y-1">
                  {status.warnings.map((warning, i) => (
                    <li key={i} className="font-mono text-xs text-ink-muted">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={() => setPlaying(status.scenario)}
              className="mt-3 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-surface transition-colors hover:bg-accent/90"
            >
              Play this scenario
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
