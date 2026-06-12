/**
 * Mission-clock math. The workday runs from the first step's time to the end of
 * day, and the cinematic clock reads that window as a countdown. All pure: it
 * turns the scenario's existing time strings ("9:00 AM", "5:00 PM") into the
 * numbers the clock face and the escalation logic need. Nothing here touches
 * gameplay; it only presents the times the scenario already carries.
 */

/** Parse a "9:00 AM" / "12:30 PM" label into minutes since midnight. */
export function parseClock(label: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim());
  if (!match) {
    return null;
  }
  let hour = Number(match[1]) % 12;
  const minute = Number(match[2]);
  if (/pm/i.test(match[3])) {
    hour += 12;
  }
  return hour * 60 + minute;
}

/** Format a count of minutes as "H:MM" with no leading zero on the hour. */
function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export type MissionClock = {
  /** The current in-fiction time label, passed straight through. */
  now: string;
  /** The end-of-day label. */
  end: string;
  /** Countdown to end of day, formatted "H:MM". */
  remaining: string;
  /** Fraction of the day elapsed, 0 at the open and 1 at end of day. */
  elapsed: number;
  /** True once the countdown has reached the final hour of the window. */
  finalStretch: boolean;
};

/**
 * Build the clock face for a given current and end time, against the day's
 * opening time. Falls back gracefully if a label cannot be parsed, so an
 * imported scenario with unusual time strings never breaks the clock; it simply
 * shows the labels without a usable countdown.
 */
export function missionClock(
  now: string,
  end: string,
  dayStart: string
): MissionClock {
  const nowMin = parseClock(now);
  const endMin = parseClock(end);
  const startMin = parseClock(dayStart);

  if (nowMin === null || endMin === null || startMin === null || endMin <= startMin) {
    return { now, end, remaining: "", elapsed: 0, finalStretch: false };
  }

  const span = endMin - startMin;
  const into = Math.min(Math.max(nowMin - startMin, 0), span);
  const remainingMin = Math.max(endMin - nowMin, 0);

  return {
    now,
    end,
    remaining: formatDuration(remainingMin),
    elapsed: span === 0 ? 1 : into / span,
    finalStretch: remainingMin <= 60,
  };
}
