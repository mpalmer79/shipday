import type { Metadata } from "next";
import { StudioClient } from "@/components/studio/StudioClient";
import { socialMetadata } from "@/lib/site";

const PAGE_TITLE = "Authoring studio";
const PAGE_DESCRIPTION =
  "Build a ShipDay scenario with forms instead of JSON: steps, options, outcomes, and rules, validated live and playable on the spot.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  ...socialMetadata({
    title: `${PAGE_TITLE} · ShipDay`,
    description: PAGE_DESCRIPTION,
    path: "/studio",
  }),
};

export default function StudioPage() {
  return <StudioClient />;
}
