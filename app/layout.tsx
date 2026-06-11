import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  socialMetadata,
} from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  ...socialMetadata({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    card: "/og/card.svg",
    path: "/",
  }),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
