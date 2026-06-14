/**
 * A lightweight, CSS-only data-ingestion motif: a few faint glyph-dots that
 * drift upward toward the import panel, suggesting data flowing in. Purely
 * decorative and aria-hidden. Transform/opacity only, and the global
 * reduced-motion contract neutralizes the drift (the dots simply hold still),
 * so it never costs anything for motion-sensitive users. No JS, no deps.
 */

const DOTS = [
  { left: "8%", delay: "0s", dur: "5.5s", size: 4 },
  { left: "24%", delay: "1.4s", dur: "6.5s", size: 3 },
  { left: "42%", delay: "0.6s", dur: "5s", size: 5 },
  { left: "58%", delay: "2.1s", dur: "7s", size: 3 },
  { left: "74%", delay: "1s", dur: "6s", size: 4 },
  { left: "90%", delay: "2.6s", dur: "5.8s", size: 3 },
];

export function DataFlowStream({
  className = "",
  direction = "down",
}: {
  className?: string;
  /** "down" reads as data falling into a panel below; "up" as rising into one above. */
  direction?: "up" | "down";
}) {
  const anchor = direction === "down" ? "top-0" : "bottom-0";
  const dotClass =
    direction === "down" ? "data-flow-dot-down" : "data-flow-dot-up";
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {DOTS.map((dot, i) => (
        <span
          key={i}
          className={`${dotClass} absolute ${anchor} rounded-full bg-accent/70`}
          style={{
            left: dot.left,
            width: dot.size,
            height: dot.size,
            animationDelay: dot.delay,
            animationDuration: dot.dur,
          }}
        />
      ))}
    </div>
  );
}
