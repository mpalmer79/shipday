export function SystemSignals({ signals }: { signals: string[] }) {
  return (
    <div className="rounded-lg border border-surface-line bg-surface-raised">
      <div className="border-b border-surface-line px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          System signals
        </span>
      </div>
      <ul className="space-y-1 p-4">
        {signals.map((signal) => (
          <li key={signal} className="font-mono text-xs text-ink-muted">
            {signal}
          </li>
        ))}
      </ul>
    </div>
  );
}
