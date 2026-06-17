import type { Metadata } from "next";

export const SITE_NAME = "ShipDay";
export const SITE_DESCRIPTION =
  "A real-life software engineering simulator about shipping safely under pressure.";

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://shipday-topaz.vercel.app";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_OG_IMAGE = {
  url: `${SITE_URL}/shipday-og.png`,
  width: 1200,
  height: 630,
  alt: "ShipDay. Ship safely under pressure.",
};

/**
 * Builds the Open Graph and Twitter card fields for a route.
 */
export function socialMetadata(params: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const { title, description, path } = params;
  const canonicalUrl = new URL(path, SITE_URL).toString();

  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalUrl,
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE_OG_IMAGE],
    },
  };
}
