import type { Scenario } from "@/lib/simulator/types";
import { justAddAButton } from "./just-add-a-button";
import { theBrokenBuild } from "./the-broken-build";
import { fridayDeploy } from "./friday-deploy";

export type ScenarioDifficulty = "starter" | "intermediate" | "advanced";

export type ScenarioListing = {
  id: string;
  name: string;
  tagline: string;
  difficulty: ScenarioDifficulty;
  stepCount: number;
};

type RegistryEntry = {
  scenario: Scenario;
  difficulty: ScenarioDifficulty;
};

const registry: readonly RegistryEntry[] = [
  { scenario: justAddAButton, difficulty: "starter" },
  { scenario: theBrokenBuild, difficulty: "intermediate" },
  { scenario: fridayDeploy, difficulty: "advanced" },
];

export const scenarios: readonly Scenario[] = registry.map((e) => e.scenario);

export const scenarioListings: readonly ScenarioListing[] = registry.map(
  ({ scenario, difficulty }) => ({
    id: scenario.id,
    name: scenario.name,
    tagline: scenario.tagline,
    difficulty,
    stepCount: scenario.steps.length,
  })
);

export const defaultScenarioId = registry[0].scenario.id;

export function getScenario(id: string): Scenario {
  const scenario = scenarios.find((s) => s.id === id);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${id}`);
  }
  return scenario;
}

export function findScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export { justAddAButton, theBrokenBuild, fridayDeploy };
