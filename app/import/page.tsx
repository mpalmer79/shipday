import type { Metadata } from "next";
import { ImportClient } from "@/components/import/ImportClient";

export const metadata: Metadata = {
  title: "Import a scenario",
  description:
    "Paste scenario JSON, validate it in your browser, and play it from memory.",
};

export default function ImportPage() {
  return <ImportClient />;
}
