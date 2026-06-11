import type { Metadata } from "next";
import { CompareClient } from "@/components/compare/CompareClient";
import { socialMetadata } from "@/lib/site";

const PAGE_TITLE = "Compare runs";
const PAGE_DESCRIPTION =
  "Put two completed runs of the same scenario side by side: decisions, metric trajectories, and final outcomes.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  ...socialMetadata({
    title: `${PAGE_TITLE} · ShipDay`,
    description: PAGE_DESCRIPTION,
    card: "/og/card.svg",
    path: "/compare",
  }),
};

export default function ComparePage() {
  return <CompareClient />;
}
