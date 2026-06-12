import type { ReactNode } from "react";

/**
 * A tactical HUD frame: a panel with corner brackets and a faint engineering
 * grid, the core surface of the mission interface. Pure presentation. The tone
 * shifts the bracket and edge colour so the same frame reads calm, tactical, or
 * in alarm without changing structure. Corners are decorative and aria-hidden.
 */
const TONE: Record<string, { edge: string; bracket: string }> = {
  calm: { edge: "border-edge/40", bracket: "text-accent/60" },
  tactical: { edge: "border-classified/35", bracket: "text-classified/70" },
  alert: { edge: "border-alert/50", bracket: "text-alert/80" },
};

export function HudFrame({
  children,
  tone = "calm",
  grid = true,
  className = "",
}: {
  children: ReactNode;
  tone?: "calm" | "tactical" | "alert";
  grid?: boolean;
  className?: string;
}) {
  const t = TONE[tone] ?? TONE.calm;
  return (
    <div
      className={`relative rounded-md border ${t.edge} bg-panel/80 ${className}`}
    >
      {grid && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-md bg-grid-faint bg-[size:22px_22px] opacity-40"
        />
      )}
      <Corner className={`left-0 top-0 ${t.bracket}`} d="M0 14 V0 H14" />
      <Corner className={`right-0 top-0 ${t.bracket}`} d="M0 0 H14 V14" />
      <Corner className={`bottom-0 left-0 ${t.bracket}`} d="M0 0 V14 H14" />
      <Corner className={`bottom-0 right-0 ${t.bracket}`} d="M14 0 V14 H0" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Corner({ className, d }: { className: string; d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 14 14"
      className={`pointer-events-none absolute h-3 w-3 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d={d} />
    </svg>
  );
}
