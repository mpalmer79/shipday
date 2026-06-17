import type { Metadata } from "next";

export const SITE_NAME = "ShipDay";
export const SITE_DESCRIPTION =
  "A real-life software engineering simulator about shipping safely under pressure.";

const PRODUCTION_SITE_URL = "https://shipday-topaz.vercel.app";

function resolveSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (configuredUrl) {
    return configuredUrl;
  }

  return PRODUCTION_SITE_URL;
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
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: SITE_OG_IMAGE.url,
          width: SITE_OG_IMAGE.width,
          height: SITE_OG_IMAGE.height,
          alt: SITE_OG_IMAGE.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: SITE_OG_IMAGE.url,
          width: SITE_OG_IMAGE.width,
          height: SITE_OG_IMAGE.height,
          alt: SITE_OG_IMAGE.alt,
        },
      ],
    },
  };
}
