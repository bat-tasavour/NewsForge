import type { Metadata } from "next";

import type { CategoryDocument } from "@/features/categories/category.types";
import type { PopulatedArticle } from "@/features/news/news.service";
import type { ArticleCard } from "@/features/news/news.types";
import { getSiteBaseUrl, type SiteConfig } from "@/lib/site/config";
import { toIsoString } from "@/lib/utils/date";
import { buildAbsoluteUrl } from "@/lib/utils/url";

export function buildHomeMetadata(site: SiteConfig, latestArticles: ArticleCard[]): Metadata {
  const baseUrl = getSiteBaseUrl(site);
  const title = `${site.organizationName} | Latest News`;
  const description = site.description || "Latest verified updates and analysis from our newsroom.";

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical: buildAbsoluteUrl(baseUrl, "/"),
      types: {
        "application/rss+xml": buildAbsoluteUrl(baseUrl, "/rss.xml")
      }
    },
    openGraph: {
      type: "website",
      url: buildAbsoluteUrl(baseUrl, "/"),
      title,
      description,
      siteName: site.organizationName,
      images: latestArticles[0]
        ? [
            {
              url: buildAbsoluteUrl(baseUrl, latestArticles[0].featuredImage.url),
              alt: latestArticles[0].featuredImage.alt
            }
          ]
        : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: latestArticles[0] ? [buildAbsoluteUrl(baseUrl, latestArticles[0].featuredImage.url)] : undefined,
      site: site.social.twitter
    }
  };
}

export function buildCategoryMetadata(site: SiteConfig, category: CategoryDocument): Metadata {
  const baseUrl = getSiteBaseUrl(site);
  const title = `${category.name} News | ${site.organizationName}`;
  const description = category.description || `Read the latest ${category.name.toLowerCase()} stories from ${site.organizationName}.`;
  const canonical = buildAbsoluteUrl(baseUrl, `/category/${category.slug}`);

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: site.organizationName
    },
    twitter: {
      card: "summary",
      title,
      description,
      site: site.social.twitter
    }
  };
}

export function buildArticleMetadata(site: SiteConfig, article: PopulatedArticle): Metadata {
  const baseUrl = getSiteBaseUrl(site);

  const title = article.seo.metaTitle || article.title;
  const description = article.seo.metaDescription || article.excerpt;
  const canonical = article.seo.canonicalUrl || buildAbsoluteUrl(baseUrl, `/news/${article.slug}`);
  const featuredImageUrl =
    article.featuredImage?.optimizedUrl || article.featuredImage?.thumbnailUrl || "/placeholder-news.svg";
  const featuredImageAlt = article.featuredImage?.alt || article.title;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: article.seo.keywords,
    alternates: {
      canonical
    },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      siteName: site.organizationName,
      publishedTime: toIsoString(article.publishedAt),
      modifiedTime: toIsoString(article.updatedAt) || toIsoString(new Date()),
      authors: article.authorId?.name ? [article.authorId.name] : undefined,
      images: [
        {
          url: buildAbsoluteUrl(baseUrl, featuredImageUrl),
          alt: featuredImageAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [buildAbsoluteUrl(baseUrl, featuredImageUrl)],
      site: site.social.twitter
    }
  };
}
