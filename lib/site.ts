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

/**
 * Builds the Open Graph and Twitter card fields for a route. The og:image
 * and twitter:image tags come from the opengraph-image and twitter-image
 * file conventions (a product card at the root, a per-scenario card under
 * the scenario route), so this helper carries only the text fields.
 */
export function socialMetadata(params: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const { title, description, path } = params;
  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
