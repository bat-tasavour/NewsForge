import type { MetadataRoute } from "next";

import { getSiteBaseUrl, getSiteConfig } from "@/lib/site/config";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = getSiteConfig();
  const baseUrl = getSiteBaseUrl(site);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/*"]
      }
    ],
    sitemap: [`${baseUrl}/sitemap.xml`],
    host: baseUrl
  };
}
