type DataRowTone = "default" | "good" | "warn" | "bad" | "accent";

const TONE_CLASS: Record<DataRowTone, string> = {
  default: "text-ink",
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
  accent: "text-accent",
};

// Static so Tailwind's scanner sees every class literal.
const DOT_CLASS: Record<DataRowTone, string> = {
  default: "bg-ink-faint",
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
  accent: "bg-accent",
};

/**
 * A single monospace label/value line, the unit of the data surfaces. Pure
 * presentation; the optional status dot and tone only colour the value.
 */
export function DataRow({
  label,
  value,
  tone = "default",
  dot = false,
}: {
  label: string;
  value: string;
  tone?: DataRowTone;
  dot?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-edge/20 py-2 font-mono text-xs last:border-0">
      <span className="flex items-center gap-2 text-ink-faint">
        {dot && (
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASS[tone]}`}
          />
        )}
        {label}
      </span>
      <span className={`tabular-nums ${TONE_CLASS[tone]}`}>{value}</span>
    </div>
  );
}
