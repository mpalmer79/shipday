"use client";

import Link from "next/link";
import type { ScenarioListing } from "@/data/scenarios";
import {
  codenameFor,
  directiveFor,
  fileTagFor,
  threatFor,
} from "@/lib/cinematic/dossier";
import { MissionDossierArt, ThreatIndicator } from "@/components/media";
import { HudFrame } from "./HudFrame";
import { DecodeText } from "./DecodeText";

/**
 * One mission dossier: a classified case file for a scenario. The whole card is
 * a link into the mission. It composes from real registry listing data; the
 * codename, threat level, file tag, and directive are derived presentation. On
 * hover and keyboard focus the folder lifts and its status reads ACTIVE, the
 * reveal-on-open beat. Fully legible at rest, so nothing depends on the motion.
 */
export function MissionDossier({
  listing,
  decode = true,
}: {
  listing: ScenarioListing;
  decode?: boolean;
}) {
  const codename = codenameFor(listing.id);
  const threat = threatFor(listing.difficulty);
  const fileTag = fileTagFor(listing.id);
  const directive = directiveFor(listing.id, listing.tagline);

  return (
    <Link
      href={`/simulator/${listing.id}`}
      className="group block h-full focus:outline-none"
      aria-label={`Open mission ${codename}: ${listing.name}`}
    >
      <HudFrame
        tone="calm"
        className="h-full overflow-hidden p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-accent/60 group-focus-visible:-translate-y-0.5 group-focus-visible:border-accent/60"
      >
        {/* Classified still for the operation, resolved from the mission visual
            map. Decorative: the codename and name below carry the meaning. */}
        <MissionDossierArt
          missionId={listing.id}
          aspect="3/2"
          className="-mx-5 -mt-5 mb-4 !rounded-none"
        />

        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Case {fileTag}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint transition-colors group-hover:text-signal group-focus-visible:text-signal">
            <span className="group-hover:hidden group-focus-visible:hidden">
              Sealed
            </span>
            <span className="hidden group-hover:inline group-focus-visible:inline">
              Active
            </span>
          </span>
        </div>

        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Operation
          </p>
          <h2 className="mt-1 font-mono text-xl font-bold uppercase tracking-[0.12em] text-ink">
            <DecodeText text={codename} active={decode} />
          </h2>
        </div>

        <p className="mt-3 text-sm font-medium text-ink-muted">{listing.name}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {directive}
        </p>

        <div className="mt-5 border-t border-edge/30 pt-3">
          <ThreatIndicator threat={threat} />
          <div className="mt-3 text-right">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              {listing.stepCount} calls
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          <span>Open dossier</span>
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1"
          >
            {"->"}
          </span>
        </div>
      </HudFrame>
    </Link>
  );
}
