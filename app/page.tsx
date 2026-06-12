import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { Hero } from "@/components/hero/Hero";
import { Reveal } from "@/components/showcase/Reveal";
import { SectionFrame, GlowPanel, DataRow } from "@/components/showcase";
import {
  SprintBoard,
  DeployPipeline,
  MessageFeed,
  MetricsPanel,
} from "@/components/showcase/sections";
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

// The simulator's risk treatment shown in miniature with the real data-risk
// tokens, so the panels render exactly what the app does.
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

const stageStyle = (delay: number) => ({ animationDelay: `${delay}ms` });

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-void">
      <ScrollProgress />
      <Header />
      <main>
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
            A ticket arrives at 9:00 AM and you have until end of day to ship it
            or decide not to. Every choice moves your quality, speed, risk, and
            the trust people place in you. As risk climbs, the interface
            tightens: the accent warms, the clock sharpens, and past a point the
            room darkens. At 5:00 PM you see exactly how it added up.
          </p>
          <div
            className="mt-10 flex animate-stage-in flex-wrap items-center gap-4"
            style={stageStyle(320)}
          >
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

        <SectionFrame
          id="premise"
          eyebrow="the premise"
          title="Engineering is judgment under pressure"
          description="ShipDay is not about algorithms or syntax. It is the real job: ambiguous tickets, failing tests, a production page, and a release call at the end, with quality, speed, risk, and trust all moving with every choice."
        >
          <Reveal>
            <GlowPanel className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                By the numbers
              </h3>
              <div className="mt-3">
                <DataRow label="Scenarios" value="5" tone="accent" />
                <DataRow label="Distinct runs, fully enumerated" value="24,832" />
                <DataRow label="Outcomes per scenario" value="5" />
                <DataRow label="Metrics tracked" value="6" />
                <DataRow label="API calls" value="0" tone="good" dot />
              </div>
            </GlowPanel>
          </Reveal>
        </SectionFrame>

        <SectionFrame
          id="trailer"
          eyebrow="a day in motion"
          title="What a workday looks like"
          description="Not screenshots. A live read of the surfaces you work across through one day: the board, the pipeline, the people, and the metrics it all adds up to."
        >
          <div className="flex flex-col gap-5">
            <Reveal>
              <SprintBoard />
            </Reveal>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Reveal delayMs={60}>
                <DeployPipeline />
              </Reveal>
              <Reveal delayMs={120}>
                <MessageFeed />
              </Reveal>
            </div>
            <Reveal delayMs={60}>
              <MetricsPanel />
            </Reveal>
          </div>
        </SectionFrame>

        <SectionFrame
          id="signal"
          eyebrow="the signal"
          title="The room responds to risk"
          description="Tension is never decorative. The interface tracks the risk metric at the same thresholds the engine resolves outcomes at, and eases back when a decision pulls you out of trouble."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {RISK_STATES.map((panel, i) => (
              <Reveal key={panel.state} delayMs={i * 80}>
                <div
                  data-risk={panel.state}
                  className="rounded-xl border border-surface-line bg-surface-raised p-4"
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
              </Reveal>
            ))}
          </div>
        </SectionFrame>

        <SectionFrame
          id="scenarios"
          eyebrow="five workdays"
          title="Pick your pressure"
          description="Each scenario is one simulated day. Different pressures, same job: ship safely."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {scenarioListings.map((listing, i) => (
              <Reveal key={listing.id} delayMs={(i % 2) * 60}>
                <Link
                  href={`/simulator/${listing.id}`}
                  className="group block h-full"
                >
                  <GlowPanel className="h-full p-5 transition-colors group-hover:border-accent/50">
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
                    <h3 className="mt-3 text-lg font-semibold text-ink group-hover:text-accent">
                      {listing.name}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                      {listing.tagline}
                    </p>
                  </GlowPanel>
                </Link>
              </Reveal>
            ))}
          </div>
        </SectionFrame>

        <section className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">
          <Reveal>
            <GlowPanel className="flex flex-col items-center p-10 text-center" tone="hot">
              <h2 className="text-display-sm font-bold tracking-tight text-ink">
                It is 9:00 AM. The ticket is in.
              </h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
                Open the day and make the calls. It runs entirely in your browser,
                with no sign-in and no setup.
              </p>
              <Link
                href={ctaHref}
                className="mt-8 rounded-lg bg-accent px-8 py-3 text-base font-semibold text-void shadow-glow transition-colors hover:bg-accent/90"
              >
                Start the workday
              </Link>
            </GlowPanel>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
