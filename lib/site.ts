import type { Metadata } from "next";

export const SITE_NAME = "ShipDay";
export const SITE_DESCRIPTION =
  "A real-life software engineering simulator about shipping safely under pressure.";

/**
 * Absolute base for Open Graph and Twitter card URLs. Vercel injects
 * VERCEL_URL automatically, so no environment variable has to be set for a
 * deploy. Local builds fall back to localhost. Reading these is optional;
 * the app still builds and deploys with nothing configured.
 */
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

const OG_CARD_SIZE = { width: 1200, height: 630 };

/**
 * Builds the Open Graph and Twitter card fields for a route from a title,
 * description, and the social card asset committed under public/og. Shared
 * so every route emits the same shape of tags.
 */
export function socialMetadata(params: {
  title: string;
  description: string;
  card: string;
  path: string;
}): Metadata {
  const { title, description, card, path } = params;
  const images = [{ url: card, ...OG_CARD_SIZE, alt: `${title} social card` }];
  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}
