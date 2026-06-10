import { notFound } from "next/navigation";
import { SimulatorClient } from "@/components/simulator/SimulatorClient";
import { findScenario, scenarios } from "@/data/scenarios";

export function generateStaticParams() {
  return scenarios.map((scenario) => ({ scenarioId: scenario.id }));
}

export const dynamicParams = false;

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  if (!findScenario(scenarioId)) {
    notFound();
  }
  return <SimulatorClient scenarioId={scenarioId} />;
}
