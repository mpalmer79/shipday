import type { ScenarioStep } from "@/lib/simulator";
import { stageProps } from "./stage";

/**
 * The step rendered as a work ticket document: a header strip with the
 * timestamp, the request as a document body, and the context as a note.
 * When `staged` (the opening briefing), the timestamp lands first, then the
 * request appears, then the context, with deliberate pacing. The caller gates
 * `staged` off under reduced motion, and the CSS contract neutralizes the
 * delays regardless, so the document presents immediately and legibly.
 */
export function ScenarioCard({
  step,
  staged = false,
}: {
  step: ScenarioStep;
  staged?: boolean;
}) {
  const s = (delay: number) => stageProps(staged, delay);
  return (
    <article className="overflow-hidden rounded-lg border border-surface-line bg-surface-raised">
      <header className="flex items-baseline justify-between border-b border-surface-line bg-surface-overlay px-5 py-3">
        <span
          className={`font-mono text-xs uppercase tracking-wider text-ink-faint ${s(0).className}`}
          style={s(0).style}
        >
          Incoming ticket
        </span>
        <span
          className={`clock-tracking font-mono text-sm text-accent ${s(0).className}`}
          style={s(0).style}
        >
          {step.time}
        </span>
      </header>
      <div className="p-5">
        <h2
          className={`text-lg font-semibold ${s(150).className}`}
          style={s(150).style}
        >
          {step.title}
        </h2>
        <div
          className={`mt-4 rounded-lg border border-surface-line bg-surface-overlay p-4 text-sm leading-relaxed ${s(500).className}`}
          style={s(500).style}
        >
          {step.narrative}
        </div>
        <p
          className={`mt-4 text-sm leading-relaxed text-ink-muted ${s(850).className}`}
          style={s(850).style}
        >
          {step.context}
        </p>
      </div>
    </article>
  );
}
