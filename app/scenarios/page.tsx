import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { Reveal } from "@/components/showcase/Reveal";
import { ClassifiedStamp } from "@/components/cinematic";
import { MissionDossier } from "@/components/cinematic/MissionDossier";
import { scenarioListings } from "@/data/scenarios";
import { socialMetadata } from "@/lib/site";

const PAGE_TITLE = "Mission select";
const PAGE_DESCRIPTION =
  "Five missions, five workdays. Each dossier is a different operation under pressure, with the same objective: ship safely.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  ...socialMetadata({
    title: `${PAGE_TITLE} · ShipDay`,
    description: PAGE_DESCRIPTION,
    path: "/scenarios",
  }),
};

export default function ScenariosPage() {
  return (
    <AppShell footer>
      <div className="relative mx-auto max-w-5xl py-10">
        {/* A faint engineering grid behind the dossiers, so the select screen
            reads as a briefing-room wall. Decorative and non-interactive. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-6 bottom-0 -z-10 bg-grid-faint bg-[size:34px_34px] opacity-[0.15] [mask-image:radial-gradient(110%_70%_at_50%_0%,black,transparent)]"
        />
        <div className="flex flex-col gap-4">
          <ClassifiedStamp label="Mission select" className="self-start" />
          <h1 className="text-display-sm font-bold tracking-tight text-ink text-center md:text-left">
            Choose your operation
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-ink-muted text-center md:text-left">
            Five sealed case files. Each is one simulated workday run as a field
            operation: different pressure, different terrain, the same objective.
            Open a dossier to take the assignment.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {scenarioListings.map((listing, i) => (
            <Reveal key={listing.id} delayMs={(i % 2) * 70}>
              <MissionDossier listing={listing} />
            </Reveal>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
