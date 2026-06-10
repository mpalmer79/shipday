import type { OutcomeDefinition } from "@/lib/simulator";

const TONE_STYLES: Record<OutcomeDefinition["tone"], string> = {
  positive: "border-good/40 bg-good/10 text-good",
  mixed: "border-warn/40 bg-warn/10 text-warn",
  negative: "border-bad/40 bg-bad/10 text-bad",
  neutral: "border-accent/40 bg-accent/10 text-accent",
};

export function OutcomeBadge({ outcome }: { outcome: OutcomeDefinition }) {
  return (
    <div
      className={`rounded-lg border p-5 ${TONE_STYLES[outcome.tone]}`}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm opacity-80">{outcome.time}</span>
        <h2 className="text-xl font-bold">{outcome.title}</h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink">
        {outcome.summary}
      </p>
    </div>
  );
}
