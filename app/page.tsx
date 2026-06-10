import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { defaultScenarioId, scenarioListings } from "@/data/scenarios";

const ctaHref =
  scenarioListings.length > 1
    ? "/scenarios"
    : `/simulator/${defaultScenarioId}`;

export default function LandingPage() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col items-center py-20 text-center sm:py-28">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
          a software engineering simulator
        </p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          ShipDay
        </h1>
        <p className="mt-4 text-xl text-ink-muted">
          A real-life software engineering simulator about shipping safely
          under pressure.
        </p>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
          Three workdays, each one decision at a time: a ticket that says
          &ldquo;just add a button,&rdquo; a red main with a 3:00 PM release,
          and a Friday config change with the team half gone. Every choice
          shifts your quality, speed, risk, and the trust people place in
          you. At the end of the day you see exactly how it added up, can
          replay every decision, and can take the report with you.
        </p>
        <Link
          href={ctaHref}
          className="mt-10 rounded-lg bg-accent px-8 py-3 text-base font-semibold text-surface transition-colors hover:bg-accent/90"
        >
          Start the workday
        </Link>
        <p className="mt-6 font-mono text-xs text-ink-faint">
          fully deterministic · runs entirely in your browser · no API calls
        </p>
      </div>
    </AppShell>
  );
}
