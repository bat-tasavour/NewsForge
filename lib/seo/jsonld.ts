import type { PopulatedArticle } from "@/features/news/news.service";
import type { SiteConfig } from "@/lib/site/config";
import { toIsoString } from "@/lib/utils/date";
import { buildAbsoluteUrl } from "@/lib/utils/url";

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function buildOrganizationJsonLd(site: SiteConfig, baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.organizationName,
    url: baseUrl,
    description: site.description,
    logo: site.logoUrl ? buildAbsoluteUrl(baseUrl, site.logoUrl) : undefined,
    sameAs: [site.social.facebook, site.social.twitter].filter(Boolean)
  };
}

export function buildBreadcrumbJsonLd(baseUrl: string, items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(baseUrl, item.path)
    }))
  };
}

export function buildNewsArticleJsonLd(site: SiteConfig, article: PopulatedArticle, baseUrl: string) {
  const articleUrl = article.seo.canonicalUrl || buildAbsoluteUrl(baseUrl, `/news/${article.slug}`);
  const featuredImageUrl =
    article.featuredImage?.optimizedUrl || article.featuredImage?.thumbnailUrl || "/placeholder-news.svg";

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl
    },
    headline: article.seo.metaTitle || article.title,
    description: article.seo.metaDescription || article.excerpt,
    articleSection: article.categoryId?.name,
    inLanguage: site.language,
    image: [buildAbsoluteUrl(baseUrl, featuredImageUrl)],
    datePublished: toIsoString(article.publishedAt),
    dateModified: toIsoString(article.updatedAt) || toIsoString(new Date()),
    author: {
      "@type": "Person",
      name: article.authorId?.name || site.organizationName
    },
    publisher: {
      "@type": "Organization",
      name: site.organizationName,
      logo: site.logoUrl
        ? {
            "@type": "ImageObject",
            url: buildAbsoluteUrl(baseUrl, site.logoUrl)
          }
        : undefined
    },
    keywords: article.seo.keywords,
    articleBody: article.excerpt,
    url: articleUrl
  };
}
