import type { Metadata } from "next";
import { Suspense } from "react";
import { RunClient } from "@/components/run/RunClient";
import { socialMetadata } from "@/lib/site";

const PAGE_TITLE = "Shared run";
const PAGE_DESCRIPTION =
  "A completed ShipDay workday, rebuilt from a shared link: the decisions, the report, and the replay.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  ...socialMetadata({
    title: `${PAGE_TITLE} · ShipDay`,
    description: PAGE_DESCRIPTION,
    path: "/run",
  }),
};

export default function RunPage() {
  return (
    <Suspense>
      <RunClient />
    </Suspense>
  );
}
