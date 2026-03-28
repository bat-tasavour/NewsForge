import type { MetadataRoute } from "next";

import { listAllCategoriesForSitemap, listAllPublishedArticlesForSitemap } from "@/features/news/news.service";
import { getSiteBaseUrl, getSiteConfig } from "@/lib/site/config";
import { buildAbsoluteUrl } from "@/lib/utils/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [articleEntries, categoryEntries] = await Promise.all([
      listAllPublishedArticlesForSitemap(),
      listAllCategoriesForSitemap()
    ]);

    const site = getSiteConfig();
    const baseUrl = getSiteBaseUrl(site);

    const items: MetadataRoute.Sitemap = [
      {
        url: buildAbsoluteUrl(baseUrl, "/"),
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1
      }
    ];

    for (const category of categoryEntries) {
      items.push({
        url: buildAbsoluteUrl(baseUrl, `/category/${category.slug}`),
        lastModified: category.updatedAt,
        changeFrequency: "daily",
        priority: 0.7
      });
    }

    for (const article of articleEntries) {
      items.push({
        url: buildAbsoluteUrl(baseUrl, `/news/${article.slug}`),
        lastModified: article.updatedAt,
        changeFrequency: "hourly",
        priority: 0.9
      });
    }

    return items;
  } catch {
    return [];
  }
}
