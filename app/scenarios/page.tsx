import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { GlowPanel } from "@/components/showcase";
import { scenarioListings } from "@/data/scenarios";
import { socialMetadata } from "@/lib/site";

const PAGE_TITLE = "Pick a workday";
const PAGE_DESCRIPTION =
  "Choose a simulated workday. Each one is a different kind of pressure, with the same job: ship safely.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  ...socialMetadata({
    title: `${PAGE_TITLE} · ShipDay`,
    description: PAGE_DESCRIPTION,
    path: "/scenarios",
  }),
};

const DIFFICULTY_STYLES: Record<string, string> = {
  starter: "border-good/40 text-good",
  intermediate: "border-warn/40 text-warn",
  advanced: "border-bad/40 text-bad",
  expert: "border-accent/40 text-accent",
};

export default function ScenariosPage() {
  return (
    <AppShell footer>
      <div className="mx-auto max-w-3xl py-10">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          five workdays
        </p>
        <h1 className="mt-3 text-display-sm font-bold tracking-tight text-ink">
          Pick a workday
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Each scenario is one simulated day. Different pressures, same job: ship
          safely.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {scenarioListings.map((listing) => (
            <Link
              key={listing.id}
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
                <h2 className="mt-3 text-lg font-semibold text-ink group-hover:text-accent">
                  {listing.name}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {listing.tagline}
                </p>
              </GlowPanel>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
