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
import { GhostProtocolIntro } from "@/components/cinematic/GhostProtocolIntro";
import { ClassifiedStamp } from "@/components/cinematic";
import { MissionDossier } from "@/components/cinematic/MissionDossier";
import { scenarioListings } from "@/data/scenarios";

const ctaHref = "/scenarios";

// The three escalation states shown in miniature with the real data-risk
// tokens, framed as the mission alert ladder the simulator runs.
const ALERT_STATES: {
  state: string;
  code: string;
  label: string;
  status: string;
  statusClass: string;
}[] = [
  {
    state: "calm",
    code: "Condition green",
    label: "Nominal",
    status: "ci: 214 passed, 0 failed",
    statusClass: "text-good",
  },
  {
    state: "raised",
    code: "Condition amber",
    label: "Tactical",
    status: "deploy: error rate up 0.4 percent",
    statusClass: "text-warn",
  },
  {
    state: "high",
    code: "Condition red",
    label: "Red alert",
    status: "alert: error rate 11 percent and climbing",
    statusClass: "text-bad",
  },
];

const stageStyle = (delay: number) => ({ animationDelay: `${delay}ms` });

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-void">
      <GhostProtocolIntro />
      <ScrollProgress />
      <Header />
      <main>
        <Hero>
          <div
            className="animate-stage-in flex items-center gap-3"
            style={stageStyle(0)}
          >
            <ClassifiedStamp label="Operative briefing" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              clearance verified
            </span>
          </div>
          <h1
            className="mt-5 animate-stage-in text-display font-bold text-ink"
            style={stageStyle(80)}
          >
            ShipDay
          </h1>
          <p
            className="mt-4 max-w-xl animate-stage-in text-xl text-ink-muted"
            style={stageStyle(160)}
          >
            You are an operative in an engineering agency. Every workday is a
            mission, and the clock is already running.
          </p>
          <p
            className="mt-6 max-w-xl animate-stage-in text-base leading-relaxed text-ink-muted"
            style={stageStyle(240)}
          >
            An assignment lands at 9:00 AM and you have until end of day to ship
            it or call it off. Every decision moves your quality, speed, risk,
            and the trust the team places in you. As risk climbs the room goes
            tactical, the mission clock sharpens, and past a threshold the
            interface drops into red alert. At 5:00 PM the operation resolves and
            you read the after-action file.
          </p>
          <div
            className="mt-10 flex animate-stage-in flex-wrap items-center gap-4"
            style={stageStyle(320)}
          >
            <Link
              href={ctaHref}
              className="rounded-lg bg-accent px-8 py-3 text-base font-semibold text-void shadow-glow transition-colors hover:bg-accent/90"
            >
              Accept the assignment
            </Link>
            <span className="font-mono text-xs text-ink-faint">
              fully deterministic · runs entirely in your browser · no API calls
            </span>
          </div>
        </Hero>

        <SectionFrame
          id="premise"
          eyebrow="the assignment"
          title="The job is judgment under fire"
          description="ShipDay is not about algorithms or syntax. It is the real work of the field: ambiguous tickets, failing pipelines, a live production page, and a release call at the end, with quality, speed, risk, and trust all moving with every decision."
        >
          <Reveal>
            <GlowPanel className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Operations dossier
              </h3>
              <div className="mt-3">
                <DataRow label="Missions on file" value="5" tone="accent" />
                <DataRow label="Distinct runs, fully enumerated" value="24,832" />
                <DataRow label="Outcomes per mission" value="5" />
                <DataRow label="Metrics tracked" value="6" />
                <DataRow label="External calls" value="0" tone="good" dot />
              </div>
            </GlowPanel>
          </Reveal>
        </SectionFrame>

        <SectionFrame
          id="trailer"
          eyebrow="a day in the field"
          title="What an operation looks like"
          description="Not screenshots. A live read of the surfaces you work across through one day: the board, the pipeline, the team channel, and the metrics it all adds up to."
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
          eyebrow="the alert ladder"
          title="The room responds to risk"
          description="Tension is never decorative. The interface tracks the risk metric at the same thresholds the engine resolves outcomes at, and stands down when a decision pulls you out of trouble."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ALERT_STATES.map((panel, i) => (
              <Reveal key={panel.state} delayMs={i * 80}>
                <div
                  data-risk={panel.state}
                  className="rounded-xl border border-surface-line bg-surface-raised p-4"
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                    <span>{panel.code}</span>
                    <span>{panel.label}</span>
                  </div>
                  <div className="countdown-tracking mt-2 font-mono text-2xl font-bold text-accent">
                    T-5:30
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
          eyebrow="five missions"
          title="Pick your operation"
          description="Each mission is one simulated day. Different pressure, same objective: ship safely."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {scenarioListings.map((listing, i) => (
              <Reveal key={listing.id} delayMs={(i % 2) * 60}>
                <MissionDossier listing={listing} decode={false} />
              </Reveal>
            ))}
          </div>
        </SectionFrame>

        <section className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">
          <Reveal>
            <GlowPanel className="flex flex-col items-center p-10 text-center" tone="hot">
              <ClassifiedStamp label="Clock is running" tone="alert" />
              <h2 className="mt-4 text-display-sm font-bold tracking-tight text-ink">
                It is 9:00 AM. The assignment is in.
              </h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
                Take the mission and make the calls. It runs entirely in your
                browser, with no sign-in and no setup.
              </p>
              <Link
                href={ctaHref}
                className="mt-8 rounded-lg bg-accent px-8 py-3 text-base font-semibold text-void shadow-glow transition-colors hover:bg-accent/90"
              >
                Accept the assignment
              </Link>
            </GlowPanel>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
