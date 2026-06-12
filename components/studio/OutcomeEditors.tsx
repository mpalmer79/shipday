"use client";

import type {
  Condition,
  OutcomeDefinition,
  OutcomeId,
  OutcomeRule,
} from "@/lib/simulator";
import { OUTCOME_IDS } from "@/lib/simulator";
import { ConditionEditor } from "./ConditionEditor";
import {
  buttonClass,
  IssueList,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "./controls";

const TONES = ["positive", "mixed", "negative", "neutral"];

const OUTCOME_CHOICES = OUTCOME_IDS.map((id) => ({ value: id, label: id }));

export function OutcomesEditor({
  outcomes,
  onChange,
  issuesFor,
}: {
  outcomes: OutcomeDefinition[];
  onChange: (outcomes: OutcomeDefinition[]) => void;
  issuesFor: (index: number) => { errors: string[]; warnings: string[] };
}) {
  function addOutcome() {
    const used = new Set(outcomes.map((o) => o.id));
    const id = OUTCOME_IDS.find((candidate) => !used.has(candidate));
    onChange([
      ...outcomes,
      {
        id: (id ?? "safe-rollout") as OutcomeId,
        time: "",
        title: "",
        summary: "",
        tone: "mixed",
      },
    ]);
  }

  return (
    <div className="flex flex-col gap-4">
      {outcomes.map((outcome, i) => {
        const issues = issuesFor(i);
        return (
          <div
            key={i}
            className="rounded-lg border border-surface-line bg-surface-raised p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Outcome {i + 1}
                {outcome.id ? `: ${outcome.id}` : ""}
              </h3>
              <button
                type="button"
                onClick={() => onChange(outcomes.filter((_, j) => j !== i))}
                className={buttonClass}
              >
                Remove outcome
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectField
                label="Outcome id"
                value={(outcome.id as string) ?? ""}
                onChange={(id) =>
                  onChange(
                    outcomes.map((o, j) =>
                      j === i ? { ...o, id: id as OutcomeId } : o
                    )
                  )
                }
                options={OUTCOME_CHOICES}
              />
              <SelectField
                label="Tone"
                value={(outcome.tone as string) ?? ""}
                onChange={(tone) =>
                  onChange(
                    outcomes.map((o, j) =>
                      j === i
                        ? { ...o, tone: tone as OutcomeDefinition["tone"] }
                        : o
                    )
                  )
                }
                options={TONES.map((tone) => ({ value: tone, label: tone }))}
              />
              <TextField
                label="Time"
                value={outcome.time ?? ""}
                onChange={(time) =>
                  onChange(
                    outcomes.map((o, j) => (j === i ? { ...o, time } : o))
                  )
                }
                placeholder="4:30 PM"
              />
              <TextField
                label="Title"
                value={outcome.title ?? ""}
                onChange={(title) =>
                  onChange(
                    outcomes.map((o, j) => (j === i ? { ...o, title } : o))
                  )
                }
              />
            </div>
            <TextAreaField
              label="Summary"
              className="mt-3"
              value={outcome.summary ?? ""}
              onChange={(summary) =>
                onChange(
                  outcomes.map((o, j) => (j === i ? { ...o, summary } : o))
                )
              }
            />
            <IssueList errors={issues.errors} warnings={issues.warnings} />
          </div>
        );
      })}
      <div>
        <button type="button" onClick={addOutcome} className={buttonClass}>
          Add outcome
        </button>
      </div>
    </div>
  );
}

export function RulesEditor({
  rules,
  onChange,
  issuesFor,
}: {
  rules: OutcomeRule[];
  onChange: (rules: OutcomeRule[]) => void;
  issuesFor: (index: number) => { errors: string[]; warnings: string[] };
}) {
  return (
    <div className="flex flex-col gap-4">
      {rules.map((rule, i) => {
        const issues = issuesFor(i);
        return (
          <div
            key={i}
            className="rounded-lg border border-surface-line bg-surface-raised p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Rule {i + 1}
                {rule.outcomeId ? `: ${rule.outcomeId}` : ""}
              </h3>
              <button
                type="button"
                onClick={() => onChange(rules.filter((_, j) => j !== i))}
                className={buttonClass}
              >
                Remove rule
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectField
                label="Outcome"
                value={(rule.outcomeId as string) ?? ""}
                onChange={(outcomeId) =>
                  onChange(
                    rules.map((r, j) =>
                      j === i
                        ? { ...r, outcomeId: outcomeId as OutcomeId }
                        : r
                    )
                  )
                }
                options={OUTCOME_CHOICES}
              />
              <NumberField
                label="Priority (lower fires first)"
                value={typeof rule.priority === "number" ? rule.priority : ""}
                onChange={(priority) =>
                  onChange(
                    rules.map((r, j) =>
                      j === i
                        ? { ...r, priority: priority === "" ? 0 : priority }
                        : r
                    )
                  )
                }
              />
            </div>
            <div className="mt-3">
              <ConditionEditor
                condition={rule.when}
                onChange={(when) =>
                  onChange(rules.map((r, j) => (j === i ? { ...r, when } : r)))
                }
              />
            </div>
            <IssueList errors={issues.errors} warnings={issues.warnings} />
          </div>
        );
      })}
      <div>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...rules,
              {
                outcomeId: "customer-incident" as OutcomeId,
                priority:
                  rules.reduce(
                    (max, r) =>
                      typeof r.priority === "number" && r.priority > max
                        ? r.priority
                        : max,
                    0
                  ) + 1,
                when: { kind: "metricAtLeast", metric: "risk", value: 70 } as Condition,
              },
            ])
          }
          className={buttonClass}
        >
          Add rule
        </button>
      </div>
    </div>
  );
}

export function MissedSignalsEditor({
  missedSignals,
  onChange,
}: {
  missedSignals: Partial<Record<string, string>> | undefined;
  onChange: (missedSignals: Record<string, string> | undefined) => void;
}) {
  const entries = Object.entries(missedSignals ?? {}) as [string, string][];

  function rebuild(next: [string, string][]) {
    if (next.length === 0) {
      onChange(undefined);
      return;
    }
    onChange(Object.fromEntries(next));
  }

  return (
    <div className="rounded-lg border border-surface-line bg-surface-raised p-5">
      <p className="text-xs leading-relaxed text-ink-muted">
        Missed-signal copy, keyed by flag. When the run ends carrying one of
        these flags, the report shows the text as a missed signal.
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {entries.map(([flag, text], i) => (
          <div
            key={i}
            className="rounded-lg border border-surface-line bg-surface p-3"
          >
            <div className="flex items-end gap-2">
              <TextField
                label="Flag"
                mono
                className="flex-1"
                value={flag}
                onChange={(value) =>
                  rebuild(
                    entries.map((entry, j) =>
                      j === i ? [value, entry[1]] : entry
                    )
                  )
                }
              />
              <button
                type="button"
                onClick={() => rebuild(entries.filter((_, j) => j !== i))}
                className={buttonClass}
              >
                Remove
              </button>
            </div>
            <TextAreaField
              label="Missed-signal text"
              className="mt-2"
              rows={2}
              value={text ?? ""}
              onChange={(value) =>
                rebuild(
                  entries.map((entry, j) =>
                    j === i ? [entry[0], value] : entry
                  )
                )
              }
            />
          </div>
        ))}
        <div>
          <button
            type="button"
            onClick={() => rebuild([...entries, ["", ""]])}
            className={buttonClass}
          >
            Add missed signal
          </button>
        </div>
      </div>
    </div>
  );
}
