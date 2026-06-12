"use client";

import type { Condition } from "@/lib/simulator";
import { METRIC_KEYS, METRIC_LABELS } from "@/lib/simulator";
import {
  buttonClass,
  inputClass,
  NumberField,
  SelectField,
  TextField,
} from "./controls";

const KIND_LABELS: Record<string, string> = {
  metricAtLeast: "metric is at least",
  metricAtMost: "metric is at most",
  hasFlag: "run has flag",
  lacksFlag: "run lacks flag",
  anyOf: "any of",
  allOf: "all of",
};

/** Loose view of a condition while it is being edited. */
type DraftCondition = {
  kind?: unknown;
  metric?: unknown;
  value?: unknown;
  flag?: unknown;
  conditions?: unknown;
};

function defaultCondition(kind: string): Condition {
  switch (kind) {
    case "metricAtLeast":
    case "metricAtMost":
      return { kind, metric: "risk", value: 50 } as Condition;
    case "anyOf":
    case "allOf":
      return { kind, conditions: [] } as unknown as Condition;
    default:
      return { kind: kind || "hasFlag", flag: "" } as Condition;
  }
}

export function ConditionEditor({
  condition,
  onChange,
}: {
  condition: Condition;
  onChange: (condition: Condition) => void;
}) {
  const draft = condition as DraftCondition;
  const kind =
    typeof draft.kind === "string" && draft.kind in KIND_LABELS
      ? draft.kind
      : "";
  const children: Condition[] = Array.isArray(draft.conditions)
    ? (draft.conditions as Condition[])
    : [];

  return (
    <div className="rounded-lg border border-surface-line bg-surface-overlay p-3">
      <label className="flex items-center gap-2 text-xs text-ink-muted">
        Kind
        <select
          value={kind}
          onChange={(e) => onChange(defaultCondition(e.target.value))}
          className={inputClass}
        >
          {kind === "" && <option value="">(choose a kind)</option>}
          {Object.entries(KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {(kind === "metricAtLeast" || kind === "metricAtMost") && (
        <div className="mt-2 flex flex-wrap gap-3">
          <SelectField
            label="Metric"
            value={typeof draft.metric === "string" ? draft.metric : ""}
            onChange={(metric) =>
              onChange({ ...(condition as object), metric } as Condition)
            }
            options={METRIC_KEYS.map((key) => ({
              value: key,
              label: METRIC_LABELS[key],
            }))}
          />
          <NumberField
            label="Value"
            value={typeof draft.value === "number" ? draft.value : ""}
            onChange={(value) =>
              onChange({
                ...(condition as object),
                value: value === "" ? 0 : value,
              } as Condition)
            }
          />
        </div>
      )}

      {(kind === "hasFlag" || kind === "lacksFlag") && (
        <TextField
          label="Flag"
          mono
          className="mt-2"
          value={typeof draft.flag === "string" ? draft.flag : ""}
          onChange={(flag) =>
            onChange({ ...(condition as object), flag } as Condition)
          }
          placeholder="a flag some option sets"
        />
      )}

      {(kind === "anyOf" || kind === "allOf") && (
        <div className="mt-2 flex flex-col gap-2">
          {children.map((child, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <ConditionEditor
                  condition={child}
                  onChange={(next) =>
                    onChange({
                      ...(condition as object),
                      conditions: children.map((c, j) => (j === i ? next : c)),
                    } as Condition)
                  }
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...(condition as object),
                    conditions: children.filter((_, j) => j !== i),
                  } as Condition)
                }
                className={buttonClass}
              >
                Remove
              </button>
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...(condition as object),
                  conditions: [...children, defaultCondition("hasFlag")],
                } as Condition)
              }
              className={buttonClass}
            >
              Add nested condition
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
