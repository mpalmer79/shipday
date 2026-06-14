import { ImageFrame } from "./ImageFrame";
import { missionVisualFor } from "@/lib/shipdayMedia";

/**
 * The classified still for a mission dossier, resolved from the centralized
 * mission visual mapping by scenario id. Decorative by default: the dossier's
 * codename and name carry the meaning, so the art is reinforcement and is
 * hidden from assistive tech unless a caller opts into a semantic alt.
 */
export function MissionDossierArt({
  missionId,
  aspect = "16/9",
  decorative = true,
  priority = false,
  className = "",
}: {
  missionId: string;
  aspect?: string;
  decorative?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const visual = missionVisualFor(missionId);
  return (
    <ImageFrame
      src={visual.image}
      alt={visual.alt}
      aspect={aspect}
      variant="bare"
      decorative={decorative}
      priority={priority}
      placeholderLabel="Dossier art"
      className={className}
    />
  );
}
