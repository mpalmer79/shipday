import { redirect } from "next/navigation";
import { defaultScenarioId } from "@/data/scenarios";

export default function SimulatorIndexPage() {
  redirect(`/simulator/${defaultScenarioId}`);
}
