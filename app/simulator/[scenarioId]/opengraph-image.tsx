import { ImageResponse } from "next/og";
import { renderOgCard, OG_SIZE } from "@/lib/ogCard";
import { scenarioListings, scenarios } from "@/data/scenarios";

export const alt = "ShipDay scenario social card";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return scenarios.map((scenario) => ({ scenarioId: scenario.id }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const listing = scenarioListings.find((l) => l.id === scenarioId);
  if (!listing) {
    return new ImageResponse(
      renderOgCard({
        eyebrow: "a software engineering simulator",
        title: "ShipDay",
        tagline: "Shipping safely under pressure, one decision at a time.",
      }),
      size
    );
  }
  return new ImageResponse(
    renderOgCard({
      eyebrow: `shipday · ${listing.difficulty}`,
      title: listing.name,
      tagline: listing.tagline,
    }),
    size
  );
}
