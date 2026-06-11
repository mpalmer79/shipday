import type { Scenario } from "@/lib/simulator/types";
import { END_STEP_ID } from "@/lib/simulator/types";
import { justAddAButton } from "./just-add-a-button";
import { theBrokenBuild } from "./the-broken-build";
import { fridayDeploy } from "./friday-deploy";
import { thePage } from "./the-page";

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
  { scenario: thePage, difficulty: "advanced" },
];

export const scenarios: readonly Scenario[] = registry.map((e) => e.scenario);

/**
 * Decisions a player makes on one run, following the first option at each
 * step to the end. For a branching scenario this is the path length, not
 * the number of step definitions (which can include alternate branches).
 * The cycle guard keeps it total even if a scenario ever loops.
 */
function decisionDepth(scenario: Scenario): number {
  let stepId = scenario.initialStepId;
  let depth = 0;
  const seen = new Set<string>();
  while (stepId !== END_STEP_ID && !seen.has(stepId)) {
    seen.add(stepId);
    const step = scenario.steps.find((s) => s.id === stepId);
    if (!step) break;
    depth += 1;
    stepId = step.options[0].nextStepId;
  }
  return depth;
}

export const scenarioListings: readonly ScenarioListing[] = registry.map(
  ({ scenario, difficulty }) => ({
    id: scenario.id,
    name: scenario.name,
    tagline: scenario.tagline,
    difficulty,
    stepCount: decisionDepth(scenario),
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

export { justAddAButton, theBrokenBuild, fridayDeploy, thePage };
