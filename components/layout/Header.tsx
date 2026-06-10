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
        <span className="font-mono text-xs text-ink-faint">v0.1</span>
      </div>
    </header>
  );
}
