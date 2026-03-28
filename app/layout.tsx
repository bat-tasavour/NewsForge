import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getSiteBaseUrl, getSiteConfig } from "@/lib/site/config";

import "./globals.css";

const site = getSiteConfig();
const baseUrl = getSiteBaseUrl(site);

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: site.organizationName,
    template: `%s | ${site.organizationName}`
  },
  description: site.description,
  alternates: {
    types: {
      "application/rss+xml": `${baseUrl}/rss.xml`
    }
  }
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={site.language || "en"}>
      <body>{children}</body>
    </html>
  );
}
