import type { RiskState } from "@/lib/simulator";
import { missionClock } from "@/lib/cinematic/clock";

export type WorkdayBeat = {
  time: string;
  label: string;
};

type WorkdayStatusProps = {
  beats: WorkdayBeat[];
  /** Index of the current beat; beats before it render as done. */
  currentIndex: number;
  /** Live risk state, so the clock escalates with the room. */
  riskState?: RiskState;
  /** True under reduced motion, so the clock holds its pulse static. */
  reducedMotion?: boolean;
};

const RISK_LABEL: Record<RiskState, { tag: string; tone: string }> = {
  calm: { tag: "Condition green", tone: "text-signal" },
  raised: { tag: "Condition amber", tone: "text-warn" },
  high: { tag: "Condition red", tone: "text-alert" },
};

/**
 * The mission clock: the central dramatic device of the simulator. The workday
 * is time burning down, so the prominent figure is the countdown to end of day,
 * with the current time and the day's beats underneath. The presentation
 * escalates as the day advances and as risk rises: the accent and tracking
 * shift through the global risk tokens, and in the final hour or under red alert
 * the countdown breathes (a subtle sub-1Hz pulse, neutralized under reduced
 * motion). The clock is wired to the real step progression through `beats` and
 * `currentIndex`, so it can never disagree with the day.
 */
export function WorkdayStatus({
  beats,
  currentIndex,
  riskState = "calm",
  reducedMotion = false,
}: WorkdayStatusProps) {
  const safeIndex = Math.min(Math.max(currentIndex, 0), beats.length - 1);
  const now = beats[safeIndex]?.time ?? beats[0]?.time ?? "9:00 AM";
  const endOfDay = beats[beats.length - 1]?.time ?? "5:00 PM";
  const dayStart = beats[0]?.time ?? "9:00 AM";

  const clock = missionClock(now, endOfDay, dayStart);
  const risk = RISK_LABEL[riskState];
  const escalated = riskState === "high" || clock.finalStretch;
  const pulse = escalated && !reducedMotion ? "clock-pulse" : "";

  return (
    <div className="rounded-lg border border-surface-line bg-surface-raised p-4">
      <div className="border-b border-surface-line pb-3">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
          <h2>Mission clock</h2>
          <span className={risk.tone}>{risk.tag}</span>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Time to end of day
          </span>
          {clock.finalStretch && (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-alert">
              Final hour
            </span>
          )}
        </div>
        <div
          className={`countdown-tracking mt-1 font-mono text-3xl font-bold tabular-nums text-accent ${pulse}`}
        >
          {clock.remaining ? `T-${clock.remaining}` : now}
        </div>

        {/* The day's burn-down bar. Fraction elapsed, no animation of its own. */}
        <div
          aria-hidden="true"
          className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-overlay"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${Math.round(clock.elapsed * 100)}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-ink-faint">
          <span>{dayStart}</span>
          <span className="text-accent">{now}</span>
          <span>{endOfDay}</span>
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
