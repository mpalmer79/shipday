import {
  CONDITION_KIND_REFERENCE,
  SCHEMA_SHAPES,
  type SchemaShape,
} from "@/lib/simulator";

/**
 * A collapsible cheatsheet for the scenario format, shown on the import and
 * studio pages so the rule and condition grammar is discoverable without
 * triggering validation errors one at a time. Every shape and the condition
 * kinds are generated from the validator's own constants (see
 * lib/simulator/schemaReference), so this reference cannot drift from what the
 * validator accepts. Decorative framing only; the tactical surface styling
 * matches the surrounding authoring UI.
 */
function ShapeTable({ shape }: { shape: SchemaShape }) {
  return (
    <div className="rounded-lg border border-surface-line bg-surface-raised p-4">
      <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
        {shape.title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{shape.blurb}</p>
      <dl className="mt-3 space-y-1.5">
        {shape.fields.map((field) => (
          <div
            key={field.name}
            className="grid grid-cols-[minmax(0,7rem)_1fr] items-baseline gap-2"
          >
            <dt className="font-mono text-xs text-accent">
              {field.name}
              {!field.required && (
                <span className="text-ink-faint"> ?</span>
              )}
            </dt>
            <dd className="font-mono text-xs leading-relaxed text-ink-muted">
              <span className="text-ink">{field.type}</span>
              {field.note && (
                <span className="text-ink-faint"> — {field.note}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function SchemaReference({ className = "" }: { className?: string }) {
  return (
    <details
      className={`rounded-lg border border-surface-line bg-surface p-0 ${className}`}
    >
      <summary className="cursor-pointer list-none rounded-lg px-4 py-3 text-sm font-medium text-ink transition-colors hover:text-accent">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-faint">
          Reference ·{" "}
        </span>
        Scenario format cheatsheet
      </summary>
      <div className="border-t border-surface-line p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {SCHEMA_SHAPES.map((shape) => (
            <ShapeTable key={shape.title} shape={shape} />
          ))}
          <div className="rounded-lg border border-surface-line bg-surface-raised p-4 lg:col-span-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
              Condition kinds
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              A rule&apos;s <span className="font-mono text-ink">when</span> is one of
              these, discriminated on{" "}
              <span className="font-mono text-ink">kind</span>. The combinators
              nest.
            </p>
            <dl className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {CONDITION_KIND_REFERENCE.map((condition) => (
                <div
                  key={condition.kind}
                  className="grid grid-cols-[minmax(0,7rem)_1fr] items-baseline gap-2"
                >
                  <dt className="font-mono text-xs text-accent">
                    {condition.kind}
                  </dt>
                  <dd className="font-mono text-xs leading-relaxed text-ink-muted">
                    <span className="text-ink">{condition.fields}</span>
                    <span className="text-ink-faint">
                      {" "}
                      — {condition.description}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </details>
  );
}
