import Link from "next/link";

const LINKS = [
  { href: "/scenarios", label: "Missions" },
  { href: "/studio", label: "Studio" },
  { href: "/import", label: "Import" },
  { href: "/compare", label: "Compare" },
];

/**
 * The shared footer for the front door and framing pages. Carries the nav, the
 * tagline, and the deterministic no-external-AI note. Pure presentation.
 */
export function Footer() {
  return (
    <footer className="border-t border-edge/30 bg-void">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-accent shadow-glow-sm"
              />
              <span className="text-sm font-semibold tracking-tight text-ink">
                ShipDay
              </span>
            </div>
            <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-ink-muted md:text-left">
              Every workday is a mission. A software engineering simulator about
              shipping safely under pressure.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-col items-center gap-2 text-sm md:items-start"
          >
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-ink-muted transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-edge/20 pt-6 text-center font-mono text-xs text-ink-faint md:text-left">
          fully deterministic · runs entirely in your browser · no API calls, no
          external AI
        </p>
      </div>
    </footer>
  );
}
