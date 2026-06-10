export type WorkdayBeat = {
  time: string;
  label: string;
};

type WorkdayStatusProps = {
  beats: WorkdayBeat[];
  /** Index of the current beat; beats before it render as done. */
  currentIndex: number;
};

export function WorkdayStatus({ beats, currentIndex }: WorkdayStatusProps) {
  return (
    <div className="rounded-lg border border-surface-line bg-surface-raised p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        Your workday
      </h2>
      <ol className="space-y-2">
        {beats.map((beat, i) => {
          const isCurrent = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <li key={beat.time} className="flex items-center gap-3">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isCurrent
                    ? "bg-accent"
                    : isDone
                      ? "bg-ink-faint"
                      : "bg-surface-overlay"
                }`}
              />
              <span
                className={`font-mono text-xs ${
                  isCurrent ? "text-accent" : "text-ink-faint"
                }`}
              >
                {beat.time}
              </span>
              <span
                className={`truncate text-xs ${
                  isCurrent
                    ? "font-medium text-ink"
                    : isDone
                      ? "text-ink-muted line-through decoration-surface-line"
                      : "text-ink-faint"
                }`}
              >
                {beat.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
