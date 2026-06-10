import type { ScenarioStep } from "@/lib/simulator";

export function ScenarioCard({ step }: { step: ScenarioStep }) {
  return (
    <div className="rounded-lg border border-surface-line bg-surface-raised p-5">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-accent">{step.time}</span>
        <h2 className="text-lg font-semibold">{step.title}</h2>
      </div>
      <div className="mt-4 rounded-lg rounded-tl-none border border-surface-line bg-surface-overlay p-4 text-sm leading-relaxed">
        {step.narrative}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        {step.context}
      </p>
    </div>
  );
}
