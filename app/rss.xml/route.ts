import { NextResponse } from "next/server";

import { listPublishedArticlesForRss } from "@/features/news/news.service";
import { getSiteBaseUrl, getSiteConfig } from "@/lib/site/config";
import { toUtcString } from "@/lib/utils/date";
import { buildAbsoluteUrl } from "@/lib/utils/url";

export const runtime = "nodejs";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  try {
    const site = getSiteConfig();
    const baseUrl = getSiteBaseUrl(site);
    const feedUrl = buildAbsoluteUrl(baseUrl, "/rss.xml");
    const siteUrl = buildAbsoluteUrl(baseUrl, "/");

    const items = await listPublishedArticlesForRss(100);

    const xmlItems = items
      .map((item) => {
        const url = buildAbsoluteUrl(baseUrl, `/news/${item.slug}`);
        const category = item.category?.name ? `<category>${escapeXml(item.category.name)}</category>` : "";
        const pubDate = toUtcString(item.publishedAt) || toUtcString(item.updatedAt) || new Date().toUTCString();
        const imageUrl =
          item.featuredImage?.optimizedUrl || item.featuredImage?.thumbnailUrl || item.featuredImage?.originalUrl;
        const media = imageUrl
          ? `<enclosure url=\"${escapeXml(buildAbsoluteUrl(baseUrl, imageUrl))}\" type=\"image/webp\" />`
          : "";

        return [
          "<item>",
          `<title>${escapeXml(item.title)}</title>`,
          `<description>${escapeXml(item.excerpt)}</description>`,
          `<link>${escapeXml(url)}</link>`,
          `<guid isPermaLink=\"true\">${escapeXml(url)}</guid>`,
          `<pubDate>${pubDate}</pubDate>`,
          item.author?.name ? `<author>${escapeXml(item.author.name)}</author>` : "",
          category,
          media,
          "</item>"
        ]
          .filter(Boolean)
          .join("");
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.organizationName)}</title>
    <description>${escapeXml(site.description)}</description>
    <link>${escapeXml(siteUrl)}</link>
    <language>${escapeXml(site.language || "en")}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    ${xmlItems}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to generate RSS feed"
      },
      { status: 500 }
    );
  }
}
