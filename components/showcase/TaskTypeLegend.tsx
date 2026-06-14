import type { ReactNode } from "react";

/**
 * A compact legend of the task types that move across an operation board:
 * feature, bug, chore, ops, and done. Inline SVG glyphs (decorative; the label
 * is the accessible name) tinted with the semantic tokens. Pure presentation,
 * no motion. Sits under the operation-board visual on the home page so the
 * board's vocabulary reads at a glance without crowding the live task cards.
 */

type TaskType = {
  label: string;
  tone: string;
  icon: ReactNode;
};

const TASK_TYPES: TaskType[] = [
  {
    label: "Feature",
    tone: "text-accent",
    icon: <path d="M12 3v18M3 12h18" />,
  },
  {
    label: "Bug",
    tone: "text-bad",
    icon: (
      <>
        <rect x="7" y="8" width="10" height="10" rx="5" />
        <path d="M12 4v3M4 11h3M17 11h3M5 18l2-2M19 18l-2-2" />
      </>
    ),
  },
  {
    label: "Chore",
    tone: "text-ink-muted",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
      </>
    ),
  },
  {
    label: "Ops",
    tone: "text-warn",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="6" rx="1" />
        <rect x="4" y="13" width="16" height="6" rx="1" />
        <path d="M8 8h.01M8 16h.01" />
      </>
    ),
  },
  {
    label: "Done",
    tone: "text-good",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.5 2.5L16 9" />
      </>
    ),
  },
];

export function TaskTypeLegend({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-start ${className}`}
    >
      {TASK_TYPES.map((task) => (
        <li
          key={task.label}
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 ${task.tone}`}
          >
            {task.icon}
          </svg>
          <span>{task.label}</span>
        </li>
      ))}
    </ul>
  );
}
