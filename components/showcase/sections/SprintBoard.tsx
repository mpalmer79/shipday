import { GlowPanel } from "../GlowPanel";

type Tag = "feature" | "bug" | "chore" | "ops" | "done";

const TAG_CLASS: Record<Tag, string> = {
  feature: "border-accent/40 text-accent",
  bug: "border-bad/40 text-bad",
  chore: "border-ink-faint/40 text-ink-faint",
  ops: "border-warn/40 text-warn",
  done: "border-good/40 text-good",
};

const COLUMNS: { name: string; cards: { title: string; tag: Tag }[] }[] = [
  {
    name: "In progress",
    cards: [
      { title: "Add the apply-discount button to checkout", tag: "feature" },
      { title: "Reproduce the flaky promo test locally", tag: "bug" },
    ],
  },
  {
    name: "In review",
    cards: [
      { title: "Pin the transitive logging dependency", tag: "chore" },
      { title: "Write the rollback plan for the config change", tag: "ops" },
    ],
  },
  {
    name: "Shipped",
    cards: [
      { title: "Gate the export behind an admin check", tag: "done" },
      { title: "Backfill the incident timeline", tag: "done" },
    ],
  },
];

/**
 * A sprint board as set dressing: three columns of representative work. Static
 * by design; a board is a snapshot, not a motion piece. Sample content only.
 */
export function SprintBoard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((column) => (
        <GlowPanel key={column.name} className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {column.name}
            </h3>
            <span className="font-mono text-[10px] text-ink-faint">
              {column.cards.length}
            </span>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {column.cards.map((card) => (
              <li
                key={card.title}
                className="rounded-lg border border-edge/30 bg-void/40 p-3"
              >
                <p className="text-sm leading-snug text-ink">{card.title}</p>
                <span
                  className={`mt-2 inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${TAG_CLASS[card.tag]}`}
                >
                  {card.tag}
                </span>
              </li>
            ))}
          </ul>
        </GlowPanel>
      ))}
    </div>
  );
}
