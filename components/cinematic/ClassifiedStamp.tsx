/**
 * A stamped classification marker. Pure presentation: a bordered, tracked,
 * uppercase tag in the classified-file aesthetic. The tone selects the colour,
 * defaulting to the classified amber. Decorative framing, but the label is real
 * text so it reads to assistive tech.
 */
const TONE_CLASS: Record<string, string> = {
  classified: "border-classified/60 text-classified",
  alert: "border-alert/70 text-alert",
  signal: "border-signal/60 text-signal",
  accent: "border-accent/60 text-accent",
};

export function ClassifiedStamp({
  label,
  tone = "classified",
  className = "",
}: {
  label: string;
  tone?: "classified" | "alert" | "signal" | "accent";
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] ${TONE_CLASS[tone]} ${className}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
