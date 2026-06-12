import Link from "next/link";

const NAV = [
  { href: "/scenarios", label: "Missions" },
  { href: "/import", label: "Import" },
  { href: "/studio", label: "Studio" },
  { href: "/compare", label: "Compare" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-edge/30 bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-accent shadow-glow-sm"
          />
          <span className="text-lg font-semibold tracking-tight text-ink">
            ShipDay
          </span>
          <span className="hidden font-mono text-xs text-ink-faint sm:inline">
            engineering agency operations
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-ink-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
