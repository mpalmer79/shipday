export function CodeReviewCard({ code }: { code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-surface-line bg-surface-raised">
      <div className="flex items-center justify-between border-b border-surface-line px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Suggested change
        </span>
        <span className="font-mono text-xs text-ink-faint">
          checkout/discount.ts
        </span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-ink-muted">
        <code>{code}</code>
      </pre>
    </div>
  );
}
