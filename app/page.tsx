import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Hero } from "@/components/hero/Hero";
import {
  defaultScenarioId,
  scenarioListings,
  type ScenarioDifficulty,
} from "@/data/scenarios";

const ctaHref =
  scenarioListings.length > 1
    ? "/scenarios"
    : `/simulator/${defaultScenarioId}`;

const DIFFICULTY_STYLES: Record<ScenarioDifficulty, string> = {
  starter: "border-good/40 text-good",
  intermediate: "border-warn/40 text-warn",
  advanced: "border-bad/40 text-bad",
  expert: "border-accent/40 text-accent",
};

// The visual language in miniature: the same risk tokens that drive the
// simulator, shown at three states so the room change is visible before you
// start. Each panel sets the real data-risk attribute, so this is the actual
// treatment, not a mockup of it.
const RISK_STATES: {
  risk: string;
  label: string;
  status: string;
  statusClass: string;
  state: string;
}[] = [
  {
    risk: "Risk 22",
    label: "Calm",
    status: "ci: 214 passed, 0 failed",
    statusClass: "text-good",
    state: "calm",
  },
  {
    risk: "Risk 52",
    label: "Raised",
    status: "deploy: error rate up 0.4 percent",
    statusClass: "text-warn",
    state: "raised",
  },
  {
    risk: "Risk 78",
    label: "High",
    status: "alert: error rate 11 percent and climbing",
    statusClass: "text-bad",
    state: "high",
  },
];

// A landing-page entrance: pure CSS so the page stays a static server
// component, and the reduced-motion contract in globals.css neutralizes it.
const stageStyle = (delay: number) => ({ animationDelay: `${delay}ms` });

export default function LandingPage() {
  return (
    <AppShell>
      <Hero>
        <p
          className="animate-stage-in font-mono text-xs uppercase tracking-widest text-accent"
          style={stageStyle(0)}
        >
          a software engineering simulator
        </p>
        <h1
          className="mt-4 animate-stage-in text-display font-bold text-ink"
          style={stageStyle(80)}
        >
          ShipDay
        </h1>
        <p
          className="mt-4 max-w-xl animate-stage-in text-xl text-ink-muted"
          style={stageStyle(160)}
        >
          One workday, one decision at a time, with the pressure made visible.
        </p>
        <p
          className="mt-6 max-w-xl animate-stage-in text-base leading-relaxed text-ink-muted"
          style={stageStyle(240)}
        >
          A ticket arrives at 9:00 AM and you have until end of day to ship it or
          decide not to. Every choice moves your quality, speed, risk, and the
          trust people place in you. As risk climbs, the interface tightens: the
          accent warms, the clock sharpens, and past a point the room darkens. At
          5:00 PM you see exactly how it added up.
        </p>
        <div className="mt-10 flex animate-stage-in flex-wrap items-center gap-4" style={stageStyle(320)}>
          <Link
            href={ctaHref}
            className="rounded-lg bg-accent px-8 py-3 text-base font-semibold text-void shadow-glow transition-colors hover:bg-accent/90"
          >
            Start the workday
          </Link>
          <span className="font-mono text-xs text-ink-faint">
            fully deterministic · runs entirely in your browser · no API calls
          </span>
        </div>
      </Hero>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <section aria-labelledby="language-heading">
          <h2
            id="language-heading"
            className="text-center text-xs font-semibold uppercase tracking-wider text-ink-faint"
          >
            The room responds to risk
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {RISK_STATES.map((panel) => (
              <div
                key={panel.state}
                data-risk={panel.state}
                className="rounded-lg border border-surface-line bg-surface-raised p-4"
              >
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                  <span>{panel.risk}</span>
                  <span>{panel.label}</span>
                </div>
                <div className="clock-tracking mt-2 font-mono text-2xl font-bold text-accent">
                  11:30 AM
                </div>
                <div
                  className={`mt-3 font-mono text-[11px] leading-relaxed ${panel.statusClass}`}
                >
                  {panel.status}
                </div>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-xl text-center text-xs leading-relaxed text-ink-faint">
            Below 40 the day stays calm. Past 40 the accent warms and the clock
            sharpens. Past 65 the surfaces darken. The tension is never
            decorative; it tracks the risk metric and eases back when a decision
            pulls you out of trouble.
          </p>
        </section>

        <section className="mt-20" aria-labelledby="scenarios-heading">
          <h2
            id="scenarios-heading"
            className="text-center text-xs font-semibold uppercase tracking-wider text-ink-faint"
          >
            Five workdays
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {scenarioListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/simulator/${listing.id}`}
                className="group flex flex-col rounded-lg border border-surface-line bg-surface-raised p-5 transition-colors hover:border-accent"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${DIFFICULTY_STYLES[listing.difficulty]}`}
                  >
                    {listing.difficulty}
                  </span>
                  <span className="font-mono text-xs text-ink-faint">
                    {listing.stepCount} decisions
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold group-hover:text-accent">
                  {listing.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {listing.tagline}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
