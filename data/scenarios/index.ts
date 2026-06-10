import type { Scenario } from "@/lib/simulator/types";
import { justAddAButton } from "./just-add-a-button";

export const scenarios: readonly Scenario[] = [justAddAButton];

export function getScenario(id: string): Scenario {
  const scenario = scenarios.find((s) => s.id === id);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${id}`);
  }
  return scenario;
}

export { justAddAButton };
