import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SimulatorClient } from "@/components/simulator/SimulatorClient";
import { findScenario, scenarios } from "@/data/scenarios";

export function generateStaticParams() {
  return scenarios.map((scenario) => ({ scenarioId: scenario.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}): Promise<Metadata> {
  const { scenarioId } = await params;
  const scenario = findScenario(scenarioId);
  if (!scenario) {
    return {};
  }
  return {
    title: scenario.name,
    description: scenario.tagline,
    openGraph: {
      title: `${scenario.name} · ShipDay`,
      description: scenario.tagline,
    },
    twitter: {
      title: `${scenario.name} · ShipDay`,
      description: scenario.tagline,
    },
  };
}

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const scenario = findScenario(scenarioId);
  if (!scenario) {
    notFound();
  }
  return <SimulatorClient scenario={scenario} />;
}
