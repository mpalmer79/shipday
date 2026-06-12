"use client";

import type {
  Condition,
  ConsequenceOverride,
  DecisionOption,
  MetricKey,
  ScenarioStep,
} from "@/lib/simulator";
import { END_STEP_ID, METRIC_KEYS, METRIC_LABELS } from "@/lib/simulator";
import { ConditionEditor } from "./ConditionEditor";
import {
  buttonClass,
  IssueList,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "./controls";

export function newOption(): DecisionOption {
  return {
    id: "",
    label: "",
    description: "",
    impact: {},
    nextStepId: END_STEP_ID,
  };
}

export function newStep(): ScenarioStep {
  return {
    id: "",
    time: "",
    title: "",
    narrative: "",
    context: "",
    options: [newOption()],
  };
}

/** Sets, replaces, or (on empty) removes an optional string field. */
function optionalText<T extends object, K extends keyof T>(
  owner: T,
  key: K,
  value: string
): T {
  const next = { ...owner };
  if (value.length === 0) {
    delete next[key];
  } else {
    (next as Record<K, unknown>)[key] = value;
  }
  return next;
}

function ImpactEditor({
  impact,
  onChange,
}: {
  impact: Partial<Record<MetricKey, number>>;
  onChange: (impact: Partial<Record<MetricKey, number>>) => void;
}) {
  return (
    <fieldset className="rounded-lg border border-surface-line p-3">
      <legend className="px-1 text-xs text-ink-muted">
        Impact (leave blank for no effect)
      </legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {METRIC_KEYS.map((key) => (
          <NumberField
            key={key}
            label={METRIC_LABELS[key]}
            value={impact[key] ?? ""}
            onChange={(value) => {
              const next = { ...impact };
              if (value === "") {
                delete next[key];
              } else {
                next[key] = value;
              }
              onChange(next);
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}

function FlagsEditor({
  flags,
  onChange,
}: {
  flags: string[] | undefined;
  onChange: (flags: string[] | undefined) => void;
}) {
  const list = flags ?? [];
  return (
    <fieldset className="rounded-lg border border-surface-line p-3">
      <legend className="px-1 text-xs text-ink-muted">
        Flags this option sets
      </legend>
      <div className="flex flex-col gap-2">
        {list.map((flag, i) => (
          <div key={i} className="flex items-end gap-2">
            <TextField
              label={`Flag ${i + 1}`}
              mono
              className="flex-1"
              value={flag}
              onChange={(value) =>
                onChange(list.map((f, j) => (j === i ? value : f)))
              }
            />
            <button
              type="button"
              onClick={() => {
                const next = list.filter((_, j) => j !== i);
                onChange(next.length === 0 ? undefined : next);
              }}
              className={buttonClass}
            >
              Remove
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            onClick={() => onChange([...list, ""])}
            className={buttonClass}
          >
            Add flag
          </button>
        </div>
      </div>
    </fieldset>
  );
}

function OverridesEditor({
  overrides,
  onChange,
}: {
  overrides: ConsequenceOverride[] | undefined;
  onChange: (overrides: ConsequenceOverride[] | undefined) => void;
}) {
  const list = overrides ?? [];
  return (
    <fieldset className="rounded-lg border border-surface-line p-3">
      <legend className="px-1 text-xs text-ink-muted">
        Conditional consequences (first match wins; the consequence above is
        the fallback)
      </legend>
      <div className="flex flex-col gap-3">
        {list.map((override, i) => (
          <div
            key={i}
            className="rounded-lg border border-surface-line bg-surface p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">Override {i + 1}</span>
              <button
                type="button"
                onClick={() => {
                  const next = list.filter((_, j) => j !== i);
                  onChange(next.length === 0 ? undefined : next);
                }}
                className={buttonClass}
              >
                Remove
              </button>
            </div>
            <div className="mt-2">
              <ConditionEditor
                condition={override.when}
                onChange={(when) =>
                  onChange(
                    list.map((o, j) => (j === i ? { ...o, when } : o))
                  )
                }
              />
            </div>
            <TextAreaField
              label="Text shown when the condition holds"
              className="mt-2"
              rows={2}
              value={typeof override.text === "string" ? override.text : ""}
              onChange={(text) =>
                onChange(list.map((o, j) => (j === i ? { ...o, text } : o)))
              }
            />
          </div>
        ))}
        <div>
          <button
            type="button"
            onClick={() =>
              onChange([
                ...list,
                {
                  when: { kind: "hasFlag", flag: "" } as Condition,
                  text: "",
                },
              ])
            }
            className={buttonClass}
          >
            Add conditional consequence
          </button>
        </div>
      </div>
    </fieldset>
  );
}

function OptionEditor({
  option,
  index,
  nextStepChoices,
  onChange,
  onRemove,
  errors,
  warnings,
}: {
  option: DecisionOption;
  index: number;
  nextStepChoices: { value: string; label: string }[];
  onChange: (option: DecisionOption) => void;
  onRemove: () => void;
  errors: string[];
  warnings: string[];
}) {
  return (
    <div className="rounded-lg border border-surface-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Option {index + 1}
        </h4>
        <button type="button" onClick={onRemove} className={buttonClass}>
          Remove option
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label="Option id"
          mono
          value={option.id ?? ""}
          onChange={(id) => onChange({ ...option, id })}
          placeholder="kebab-case-id"
        />
        <SelectField
          label="Leads to"
          value={option.nextStepId ?? ""}
          onChange={(nextStepId) => onChange({ ...option, nextStepId })}
          options={nextStepChoices}
        />
      </div>
      <TextField
        label="Label"
        className="mt-3"
        value={option.label ?? ""}
        onChange={(label) => onChange({ ...option, label })}
      />
      <TextAreaField
        label="Description"
        className="mt-3"
        rows={2}
        value={option.description ?? ""}
        onChange={(description) => onChange({ ...option, description })}
      />
      <label className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
        <input
          type="checkbox"
          checked={option.strong === true}
          onChange={(e) => {
            const next = { ...option };
            if (e.target.checked) {
              next.strong = true;
            } else {
              delete next.strong;
            }
            onChange(next);
          }}
        />
        Strong decision (surfaced in the report)
      </label>

      <div className="mt-3">
        <ImpactEditor
          impact={option.impact ?? {}}
          onChange={(impact) => onChange({ ...option, impact })}
        />
      </div>
      <div className="mt-3">
        <FlagsEditor
          flags={option.flags}
          onChange={(flags) => {
            const next = { ...option };
            if (flags === undefined) {
              delete next.flags;
            } else {
              next.flags = flags;
            }
            onChange(next);
          }}
        />
      </div>
      <TextAreaField
        label="Consequence (shown after choosing)"
        className="mt-3"
        rows={2}
        value={option.consequence ?? ""}
        onChange={(value) => onChange(optionalText(option, "consequence", value))}
      />
      <div className="mt-3">
        <OverridesEditor
          overrides={option.consequenceOverrides}
          onChange={(overrides) => {
            const next = { ...option };
            if (overrides === undefined) {
              delete next.consequenceOverrides;
            } else {
              next.consequenceOverrides = overrides;
            }
            onChange(next);
          }}
        />
      </div>
      <TextAreaField
        label="Lesson (shown in the report)"
        className="mt-3"
        rows={2}
        value={option.lesson ?? ""}
        onChange={(value) => onChange(optionalText(option, "lesson", value))}
      />

      <IssueList errors={errors} warnings={warnings} />
    </div>
  );
}

export function StepEditor({
  step,
  index,
  nextStepChoices,
  onChange,
  onRemove,
  errors,
  warnings,
  issuesFor,
}: {
  step: ScenarioStep;
  index: number;
  nextStepChoices: { value: string; label: string }[];
  onChange: (step: ScenarioStep) => void;
  onRemove: () => void;
  errors: string[];
  warnings: string[];
  issuesFor: (optionIndex: number) => { errors: string[]; warnings: string[] };
}) {
  const options = Array.isArray(step.options) ? step.options : [];
  return (
    <div className="rounded-lg border border-surface-line bg-surface-raised p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Step {index + 1}
          {step.id ? `: ${step.id}` : ""}
        </h3>
        <button type="button" onClick={onRemove} className={buttonClass}>
          Remove step
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField
          label="Step id"
          mono
          value={step.id ?? ""}
          onChange={(id) => onChange({ ...step, id })}
          placeholder="kebab-case-id"
        />
        <TextField
          label="Time"
          value={step.time ?? ""}
          onChange={(time) => onChange({ ...step, time })}
          placeholder="9:00 AM"
        />
        <TextField
          label="Title"
          value={step.title ?? ""}
          onChange={(title) => onChange({ ...step, title })}
        />
      </div>
      <TextAreaField
        label="Narrative"
        className="mt-3"
        value={step.narrative ?? ""}
        onChange={(narrative) => onChange({ ...step, narrative })}
      />
      <TextAreaField
        label="Context"
        className="mt-3"
        rows={2}
        value={step.context ?? ""}
        onChange={(context) => onChange({ ...step, context })}
      />
      <TextAreaField
        label="Code snippet (optional)"
        className="mt-3"
        mono
        value={step.codeSnippet ?? ""}
        onChange={(value) => onChange(optionalText(step, "codeSnippet", value))}
      />
      <TextAreaField
        label="System signals (optional, one per line)"
        className="mt-3"
        mono
        value={(step.systemSignals ?? []).join("\n")}
        onChange={(value) => {
          const next = { ...step };
          if (value.length === 0) {
            delete next.systemSignals;
          } else {
            next.systemSignals = value.split("\n");
          }
          onChange(next);
        }}
      />

      <div className="mt-4 flex flex-col gap-4">
        {options.map((option, i) => {
          const issues = issuesFor(i);
          return (
            <OptionEditor
              key={i}
              option={option}
              index={i}
              nextStepChoices={nextStepChoices}
              onChange={(next) =>
                onChange({
                  ...step,
                  options: options.map((o, j) => (j === i ? next : o)),
                })
              }
              onRemove={() =>
                onChange({
                  ...step,
                  options: options.filter((_, j) => j !== i),
                })
              }
              errors={issues.errors}
              warnings={issues.warnings}
            />
          );
        })}
        <div>
          <button
            type="button"
            onClick={() =>
              onChange({ ...step, options: [...options, newOption()] })
            }
            className={buttonClass}
          >
            Add option
          </button>
        </div>
      </div>

      <IssueList errors={errors} warnings={warnings} />
    </div>
  );
}
