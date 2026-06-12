import {
  previewDistribution,
  validateScenario,
  type Distribution,
} from "@/lib/simulator";

/**
 * Runs the distribution walk off the main thread. The draft arrives as a
 * plain object and is validated here as well, so a stale or invalid draft
 * can never crash the walk; the panel only sends valid drafts in practice.
 */

export type WorkerResult =
  | { ok: true; distribution: Distribution }
  | { ok: false; error: string };

self.onmessage = (event: MessageEvent<unknown>) => {
  const result = validateScenario(event.data);
  if (!result.ok) {
    const reply: WorkerResult = {
      ok: false,
      error: `The draft is not a valid scenario: ${result.errors[0]}`,
    };
    self.postMessage(reply);
    return;
  }
  try {
    const reply: WorkerResult = {
      ok: true,
      distribution: previewDistribution(result.scenario),
    };
    self.postMessage(reply);
  } catch (error) {
    const reply: WorkerResult = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(reply);
  }
};
