import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CompletedRunsProvider } from "@/components/runs/CompletedRunsProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const SITE_DESCRIPTION =
  "A real-life software engineering simulator about shipping safely under pressure.";

// Canonical origin for resolving absolute Open Graph and Twitter image
// URLs. Crawlers do not resolve relative image paths, so this must be an
// absolute origin. Change this single value if the deploy domain differs.
const SITE_ORIGIN = "https://shipday.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "ShipDay",
    template: "%s · ShipDay",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: "ShipDay",
    title: "ShipDay",
    description: SITE_DESCRIPTION,
    type: "website",
    images: [
      {
        url: "/og-card.png",
        width: 1200,
        height: 630,
        alt: "ShipDay: a software engineering simulator. Ship safely under pressure, one workday at a time.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShipDay",
    description: SITE_DESCRIPTION,
    images: ["/og-card.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <CompletedRunsProvider>{children}</CompletedRunsProvider>
      </body>
    </html>
  );
}
