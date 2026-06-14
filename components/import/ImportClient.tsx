"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SchemaReference } from "@/components/authoring/SchemaReference";
import { SimulatorClient } from "@/components/simulator/SimulatorClient";
import { MediaPanel, DataFlowStream } from "@/components/media";
import { importMedia } from "@/lib/shipdayMedia";
import {
  lintScenario,
  parseScenarioJson,
  type Scenario,
} from "@/lib/simulator";
import { SAMPLE_SCENARIO } from "@/lib/sampleScenario";

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
    <AppShell footer>
      <div className="mx-auto max-w-3xl py-10">
        <h1 className="text-3xl font-bold tracking-tight text-center md:text-left">Import a scenario</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted text-center md:text-left">
          Paste a scenario as JSON. It is validated against the simulator
          format, then played in the simulator. Imported scenarios live in
          memory for this session only. Nothing is uploaded or stored.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-center md:justify-start md:text-left">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 text-accent"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8h.01M11 12h1v4h1" />
          </svg>
          <span className="text-xs leading-relaxed text-ink-muted">
            Imported scenarios live only in this browser session. Nothing is
            uploaded, stored, or sent anywhere.
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MediaPanel
            src={importMedia.dataIngestion}
            alt="Scenario data being ingested into the simulator's import panel."
            aspect="3/2"
            badge="Ingestion"
          />
          <MediaPanel
            src={importMedia.jsonStructure}
            alt="A diagram of the scenario JSON structure: steps, options, outcomes, and rules."
            aspect="3/2"
            badge="JSON structure"
          />
        </div>

        <SchemaReference className="mt-6" />

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
        {/* A faint ingestion motif: data drifts down into the import panel. */}
        <div className="relative mt-4 h-10 overflow-hidden">
          <DataFlowStream direction="down" />
        </div>
        <textarea
          id="scenario-json"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          rows={18}
          placeholder="Paste scenario JSON here"
          className="-mt-2 w-full rounded-lg border border-surface-line bg-surface-raised p-4 font-mono text-xs leading-relaxed text-ink placeholder:text-ink-faint"
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
