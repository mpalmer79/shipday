"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SimulatorClient } from "@/components/simulator/SimulatorClient";
import { scenarios } from "@/data/scenarios";
import {
  emptyDraft,
  exportDraft,
  loadDraft,
  lintTarget,
  validationTarget,
  type IssueTarget,
  type ScenarioDraft,
} from "@/lib/studio";
import {
  lintScenario,
  validateScenario,
  END_STEP_ID,
  OUTCOME_IDS,
  METRIC_KEYS,
  METRIC_LABELS,
  type Scenario,
} from "@/lib/simulator";
import {
  buttonClass,
  inputClass,
  IssueList,
  NumberField,
  SectionHeading,
  SelectField,
  TextField,
} from "./controls";
import { newStep, StepEditor } from "./StepEditor";
import { DistributionPanel } from "./DistributionPanel";
import {
  MissedSignalsEditor,
  OutcomesEditor,
  RulesEditor,
} from "./OutcomeEditors";

function targetKey(target: IssueTarget): string {
  switch (target.section) {
    case "scenario":
      return "scenario";
    case "step":
      return `step-${target.step}`;
    case "option":
      return `option-${target.step}-${target.option}`;
    case "outcome":
      return `outcome-${target.outcome}`;
    case "rule":
      return `rule-${target.rule}`;
  }
}

function groupByKey(
  messages: string[],
  toTarget: (message: string) => IssueTarget
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const message of messages) {
    const key = targetKey(toTarget(message));
    map.set(key, [...(map.get(key) ?? []), message]);
  }
  return map;
}

export function StudioClient() {
  const [draft, setDraft] = useState<ScenarioDraft>(emptyDraft);
  // Remounts the editor tree when a different draft is loaded wholesale.
  const [draftEpoch, setDraftEpoch] = useState(0);
  const [jsonText, setJsonText] = useState("");
  const [jsonNotice, setJsonNotice] = useState<
    { kind: "error" | "info"; message: string } | null
  >(null);
  const [playing, setPlaying] = useState<Scenario | null>(null);
  const [builtInId, setBuiltInId] = useState(scenarios[0].id);

  const validation = useMemo(() => validateScenario(draft), [draft]);
  const errors = validation.ok ? [] : validation.errors;
  const warnings = useMemo(
    () => (validation.ok ? lintScenario(validation.scenario) : []),
    [validation]
  );

  const errorsByKey = useMemo(
    () => groupByKey(errors, validationTarget),
    [errors]
  );
  const warningsByKey = useMemo(
    () => groupByKey(warnings, (message) => lintTarget(message, draft)),
    [warnings, draft]
  );

  function issuesFor(key: string): { errors: string[]; warnings: string[] } {
    return {
      errors: errorsByKey.get(key) ?? [],
      warnings: warningsByKey.get(key) ?? [],
    };
  }

  const steps = Array.isArray(draft.steps) ? draft.steps : [];
  const outcomes = Array.isArray(draft.outcomes) ? draft.outcomes : [];
  const rules = Array.isArray(draft.outcomeRules) ? draft.outcomeRules : [];

  const nextStepChoices = [
    ...steps
      .filter((step) => typeof step.id === "string" && step.id.length > 0)
      .map((step) => ({ value: step.id, label: step.id })),
    { value: END_STEP_ID, label: "End of day" },
  ];

  function replaceDraft(next: ScenarioDraft) {
    setDraft(next);
    setDraftEpoch((epoch) => epoch + 1);
  }

  function handleLoadJson() {
    const result = loadDraft(jsonText);
    if (!result.ok) {
      setJsonNotice({ kind: "error", message: result.error });
      return;
    }
    replaceDraft(result.draft);
    setJsonNotice({
      kind: "info",
      message: "Loaded into the editor. Problems, if any, are shown next to the structures they belong to.",
    });
  }

  function handleExportJson() {
    setJsonText(exportDraft(draft));
    setJsonNotice({
      kind: "info",
      message:
        "Draft exported below. Copy it, or download it as a file; the import page accepts it as-is.",
    });
  }

  function handleDownload() {
    const text = exportDraft(draft);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${draft.id || "scenario"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleLoadBuiltIn() {
    const scenario = scenarios.find((s) => s.id === builtInId);
    if (!scenario) {
      return;
    }
    const result = loadDraft(JSON.stringify(scenario));
    if (result.ok) {
      replaceDraft(result.draft);
      setJsonNotice({
        kind: "info",
        message: `Loaded ${scenario.name} into the editor.`,
      });
    }
  }

  if (playing) {
    return (
      <div>
        <div className="border-b border-surface-line bg-surface-raised">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
            <span className="text-xs text-ink-muted">
              Playing draft:{" "}
              <span className="font-medium text-ink">{playing.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setPlaying(null)}
              className={buttonClass}
            >
              Back to the studio
            </button>
          </div>
        </div>
        <SimulatorClient scenario={playing} />
      </div>
    );
  }

  const scenarioIssues = issuesFor("scenario");

  return (
    <AppShell footer>
      <div className="mx-auto max-w-4xl py-10">
        <h1 className="text-3xl font-bold tracking-tight text-center md:text-left">Authoring studio</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted text-center md:text-left">
          Build a scenario with forms instead of JSON. The draft is validated
          as you type, played in the simulator on demand, and exported in the
          same format the import page accepts.
        </p>
        <p className="mt-1 text-xs text-ink-faint text-center md:text-left">
          The draft lives on this page only; leaving or reloading discards it.
          Export the JSON to keep your work.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-surface-line bg-surface-raised p-4">
          <span
            className={`text-sm font-medium ${
              errors.length > 0
                ? "text-bad"
                : warnings.length > 0
                  ? "text-warn"
                  : "text-good"
            }`}
          >
            {errors.length > 0
              ? `${errors.length} validation ${errors.length === 1 ? "error" : "errors"}`
              : warnings.length > 0
                ? `Valid, ${warnings.length} lint ${warnings.length === 1 ? "warning" : "warnings"}`
                : "Valid scenario"}
          </span>
          <button
            type="button"
            disabled={!validation.ok}
            onClick={() => validation.ok && setPlaying(validation.scenario)}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-surface transition-colors enabled:hover:bg-accent/90 disabled:opacity-40"
          >
            Play this draft
          </button>
        </div>

        <section className="mt-8">
          <SectionHeading>Outcome distribution</SectionHeading>
          <div className="mt-3">
            <DistributionPanel draft={draft} valid={validation.ok} />
          </div>
        </section>

        <section className="mt-8">
          <SectionHeading>JSON in and out</SectionHeading>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className={buttonClass}
            >
              Export draft to JSON
            </button>
            <button
              type="button"
              onClick={handleLoadJson}
              disabled={jsonText.trim().length === 0}
              className={`${buttonClass} disabled:opacity-40`}
            >
              Load JSON into the editor
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className={buttonClass}
            >
              Download draft as a file
            </button>
            <span className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                Built-in
                <select
                  value={builtInId}
                  onChange={(e) => setBuiltInId(e.target.value)}
                  className={inputClass}
                >
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleLoadBuiltIn}
                className={buttonClass}
              >
                Load it
              </button>
            </span>
          </div>
          {jsonNotice && (
            <p
              className={`mt-3 font-mono text-xs leading-relaxed ${
                jsonNotice.kind === "error" ? "text-bad" : "text-ink-muted"
              }`}
            >
              {jsonNotice.message}
            </p>
          )}
          <label className="mt-3 flex flex-col gap-1 text-xs text-ink-muted">
            Scenario JSON
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={8}
              spellCheck={false}
              placeholder="Paste scenario JSON here, or export the draft into this box"
              className={`${inputClass} font-mono text-xs leading-relaxed`}
            />
          </label>
        </section>

        <div key={draftEpoch}>
          <section className="mt-8">
            <SectionHeading>Scenario</SectionHeading>
            <div className="mt-3 rounded-lg border border-surface-line bg-surface-raised p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TextField
                  label="Scenario id"
                  mono
                  value={draft.id ?? ""}
                  onChange={(id) => setDraft({ ...draft, id })}
                  placeholder="kebab-case-id"
                />
                <TextField
                  label="Name"
                  value={draft.name ?? ""}
                  onChange={(name) => setDraft({ ...draft, name })}
                />
                <TextField
                  label="Tagline"
                  value={draft.tagline ?? ""}
                  onChange={(tagline) => setDraft({ ...draft, tagline })}
                />
                <SelectField
                  label="First step"
                  value={draft.initialStepId ?? ""}
                  onChange={(initialStepId) =>
                    setDraft({ ...draft, initialStepId })
                  }
                  options={nextStepChoices.filter(
                    (choice) => choice.value !== END_STEP_ID
                  )}
                />
                <SelectField
                  label="Fallback outcome"
                  value={(draft.fallbackOutcomeId as string) ?? ""}
                  onChange={(fallbackOutcomeId) =>
                    setDraft({
                      ...draft,
                      fallbackOutcomeId:
                        fallbackOutcomeId as Scenario["fallbackOutcomeId"],
                    })
                  }
                  options={OUTCOME_IDS.map((id) => ({ value: id, label: id }))}
                />
              </div>
              <fieldset className="mt-4 rounded-lg border border-surface-line p-3">
                <legend className="px-1 text-xs text-ink-muted">
                  Initial metrics
                </legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {METRIC_KEYS.map((key) => (
                    <NumberField
                      key={key}
                      label={METRIC_LABELS[key]}
                      value={
                        typeof draft.initialMetrics?.[key] === "number"
                          ? draft.initialMetrics[key]
                          : ""
                      }
                      onChange={(value) =>
                        setDraft({
                          ...draft,
                          initialMetrics: {
                            ...draft.initialMetrics,
                            [key]: value === "" ? 0 : value,
                          },
                        })
                      }
                    />
                  ))}
                </div>
              </fieldset>
              <IssueList
                errors={scenarioIssues.errors}
                warnings={scenarioIssues.warnings}
              />
            </div>
          </section>

          <section className="mt-8">
            <SectionHeading>Steps</SectionHeading>
            <div className="mt-3 flex flex-col gap-4">
              {steps.map((step, i) => {
                const stepIssues = issuesFor(`step-${i}`);
                return (
                  <StepEditor
                    key={i}
                    step={step}
                    index={i}
                    nextStepChoices={nextStepChoices}
                    onChange={(next) =>
                      setDraft({
                        ...draft,
                        steps: steps.map((s, j) => (j === i ? next : s)),
                      })
                    }
                    onRemove={() =>
                      setDraft({
                        ...draft,
                        steps: steps.filter((_, j) => j !== i),
                      })
                    }
                    errors={stepIssues.errors}
                    warnings={stepIssues.warnings}
                    issuesFor={(optionIndex) =>
                      issuesFor(`option-${i}-${optionIndex}`)
                    }
                  />
                );
              })}
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, steps: [...steps, newStep()] })
                  }
                  className={buttonClass}
                >
                  Add step
                </button>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <SectionHeading>Outcomes</SectionHeading>
            <div className="mt-3">
              <OutcomesEditor
                outcomes={outcomes}
                onChange={(next) => setDraft({ ...draft, outcomes: next })}
                issuesFor={(index) => issuesFor(`outcome-${index}`)}
              />
            </div>
          </section>

          <section className="mt-8">
            <SectionHeading>Outcome rules</SectionHeading>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Rules are checked in priority order against the finished run;
              the first one whose condition holds decides the outcome, and the
              fallback outcome covers runs no rule matches.
            </p>
            <div className="mt-3">
              <RulesEditor
                rules={rules}
                onChange={(next) => setDraft({ ...draft, outcomeRules: next })}
                issuesFor={(index) => issuesFor(`rule-${index}`)}
              />
            </div>
          </section>

          <section className="mt-8">
            <SectionHeading>Missed signals</SectionHeading>
            <div className="mt-3">
              <MissedSignalsEditor
                missedSignals={draft.missedSignals}
                onChange={(missedSignals) => {
                  const next = { ...draft };
                  if (missedSignals === undefined) {
                    delete next.missedSignals;
                  } else {
                    next.missedSignals = missedSignals;
                  }
                  setDraft(next);
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
