import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-surface-line">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight">ShipDay</span>
          <span className="hidden text-xs text-ink-faint sm:inline">
            one workday, every tradeoff
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm">
          <Link
            href="/scenarios"
            className="text-ink-muted transition-colors hover:text-ink"
          >
            Scenarios
          </Link>
          <Link
            href="/import"
            className="text-ink-muted transition-colors hover:text-ink"
          >
            Import
          </Link>
          <Link
            href="/studio"
            className="text-ink-muted transition-colors hover:text-ink"
          >
            Studio
          </Link>
          <Link
            href="/compare"
            className="text-ink-muted transition-colors hover:text-ink"
          >
            Compare
          </Link>
        </nav>
      </div>
    </header>
  );
}
