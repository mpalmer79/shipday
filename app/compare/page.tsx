import type { Metadata } from "next";
import { CompareClient } from "@/components/compare/CompareClient";

export const metadata: Metadata = {
  title: "Compare runs",
  description:
    "Compare two completed runs of the same scenario side by side: decisions, metrics, and outcomes.",
};

export default function ComparePage() {
  return <CompareClient />;
}
