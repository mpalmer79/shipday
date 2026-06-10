import type { DecisionOption } from "@/lib/simulator";

type DecisionPanelProps = {
  options: DecisionOption[];
  onDecide: (optionId: string) => void;
};

export function DecisionPanel({ options, onDecide }: DecisionPanelProps) {
  return (
    <section aria-labelledby="decision-heading">
      <h3
        id="decision-heading"
        className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint"
      >
        What do you do?
      </h3>
      <ul className="flex flex-col gap-2">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => onDecide(option.id)}
              className="group w-full rounded-lg border border-surface-line bg-surface-raised p-4 text-left transition-colors hover:border-accent hover:bg-surface-overlay"
            >
              <span className="block text-sm font-medium group-hover:text-accent">
                {option.label}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
                {option.description}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
