"use client";

import type { ReactNode } from "react";

/**
 * Plain labeled controls for the studio. Inputs sit inside their labels so
 * every control has an accessible name without id plumbing across the
 * dynamic step and option lists.
 */

export const inputClass =
  "rounded-lg border border-surface-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint";

export const buttonClass =
  "rounded-lg border border-surface-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-ink-muted ${className}`}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className={`${inputClass} ${mono ? "font-mono text-xs" : ""}`}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  mono = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-ink-muted ${className}`}>
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        className={`${inputClass} leading-relaxed ${mono ? "font-mono text-xs" : ""}`}
      />
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  /** Empty string renders an unset value. */
  value: number | "";
  onChange: (value: number | "") => void;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-ink-muted ${className}`}>
      {label}
      <input
        type="number"
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        className={`${inputClass} font-mono text-xs`}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const known = options.some((o) => o.value === value);
  return (
    <label className={`flex flex-col gap-1 text-xs text-ink-muted ${className}`}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        {!known && <option value={value}>{value || "(choose)"}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Errors in red, lint warnings in amber, rendered next to their structure. */
export function IssueList({
  errors,
  warnings = [],
}: {
  errors: string[];
  warnings?: string[];
}) {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }
  return (
    <ul className="mt-3 space-y-1">
      {errors.map((error, i) => (
        <li
          key={`error-${i}`}
          className="font-mono text-xs leading-relaxed text-bad"
        >
          {error}
        </li>
      ))}
      {warnings.map((warning, i) => (
        <li
          key={`warning-${i}`}
          className="font-mono text-xs leading-relaxed text-warn"
        >
          {warning}
        </li>
      ))}
    </ul>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
      {children}
    </h2>
  );
}
