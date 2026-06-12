export type WorkdayBeat = {
  time: string;
  label: string;
};

type WorkdayStatusProps = {
  beats: WorkdayBeat[];
  /** Index of the current beat; beats before it render as done. */
  currentIndex: number;
};

/**
 * The persistent workday clock. The current time is the prominent figure and
 * end of day is always visible, so time pressure stays ambient. The clock
 * tightens (the --clock-tracking token) as risk rises. Below the clock, the
 * day's beats keep their shape: done, current, and still to come.
 */
export function WorkdayStatus({ beats, currentIndex }: WorkdayStatusProps) {
  const safeIndex = Math.min(Math.max(currentIndex, 0), beats.length - 1);
  const now = beats[safeIndex]?.time ?? beats[0]?.time ?? "9:00 AM";
  const endOfDay = beats[beats.length - 1]?.time ?? "5:00 PM";

  return (
    <div className="rounded-lg border border-surface-line bg-surface-raised p-4">
      <div className="border-b border-surface-line pb-3">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
          <h2>Workday clock</h2>
          <span>End of day {endOfDay}</span>
        </div>
        <div className="clock-tracking mt-2 font-mono text-3xl font-bold tabular-nums text-accent">
          {now}
        </div>
      </div>
      <ol className="mt-3 space-y-2">
        {beats.map((beat, i) => {
          const isCurrent = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <li key={`${beat.time}-${i}`} className="flex items-center gap-3">
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
