import type { Metadata } from "next";
import { ImportClient } from "@/components/import/ImportClient";
import { socialMetadata } from "@/lib/site";

const PAGE_TITLE = "Import a scenario";
const PAGE_DESCRIPTION =
  "Paste a scenario as JSON, validate it against the simulator format, and play it. Nothing is uploaded or stored.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  ...socialMetadata({
    title: `${PAGE_TITLE} · ShipDay`,
    description: PAGE_DESCRIPTION,
    path: "/import",
  }),
};

export default function ImportPage() {
  return <ImportClient />;
}
