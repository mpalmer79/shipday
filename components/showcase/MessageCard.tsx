/**
 * A stakeholder message, the unit of the message feed. Pure presentation. The
 * accent rail and monospace meta echo a chat surface without copying a brand.
 */
export function MessageCard({
  author,
  role,
  text,
  time,
  tone = "cool",
}: {
  author: string;
  role: string;
  text: string;
  time: string;
  tone?: "cool" | "hot";
}) {
  const rail = tone === "hot" ? "border-l-hot/60" : "border-l-accent/60";
  return (
    <div className={`rounded-lg border border-edge/30 border-l-2 ${rail} bg-void/40 p-3`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{author}</span>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
          {time}
        </span>
      </div>
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
        {role}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
    </div>
  );
}
