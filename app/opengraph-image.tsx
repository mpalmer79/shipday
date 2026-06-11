import { ImageResponse } from "next/og";
import { renderOgCard, OG_SIZE } from "@/lib/ogCard";
import { SITE_NAME } from "@/lib/site";

export const alt =
  "ShipDay. Shipping safely under pressure, one decision at a time.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    renderOgCard({
      eyebrow: "a software engineering simulator",
      title: SITE_NAME,
      tagline: "Shipping safely under pressure, one decision at a time.",
    }),
    size
  );
}
